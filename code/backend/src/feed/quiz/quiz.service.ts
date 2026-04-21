import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

// ── Types ────────────────────────────────────────────────────────────────────

export type QuizLevel = 'beginner' | 'intermediate';
export type VideoDifficulty = 'beginner' | 'intermediate' | 'advanced';

interface StoredQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizStatusResponse {
  currentLevel: VideoDifficulty;
  pendingQuizLevel: QuizLevel | null;
  hasQuestions: boolean;
  /** If true, the client can refetch the feed — the server already unlocked
   *  the next level (e.g. pool was empty, beginner count zero, etc.). */
  autoUnlocked?: boolean;
}

export interface NextQuestionResponse {
  questionId: string;
  videoId: string;
  question: string;
  options: string[];
  /** True if the pool is exhausted; client should dismiss the overlay. */
  autoUnlock?: boolean;
  /** When server auto-unlocks (empty pool), this is the newly unlocked level. */
  unlockedLevel?: VideoDifficulty;
}

export interface SubmitResponse {
  correct: boolean;
  explanation?: string;
  /** Newly unlocked difficulty tier (same as `nextLevel` in the product spec). */
  unlockedLevel?: VideoDifficulty;
  nextLevel?: VideoDifficulty;
}

const NEXT_LEVEL: Record<QuizLevel, VideoDifficulty> = {
  beginner: 'intermediate',
  intermediate: 'advanced',
};

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Whether the user owes a quiz for this topic, and at what level.
   *
   * A quiz is pending iff
   *   - the next level is not yet unlocked, AND
   *   - every published video at the current level in this topic has been
   *     watched by the user at least once.
   *
   * If the user has also completed every video at the current level but the
   * underlying question pool is empty, we fail-open and unlock immediately
   * so the user is never stuck behind content that can't be quizzed.
   */
  async getStatus(userId: string, topic: string): Promise<QuizStatusResponse> {
    if (!topic) throw new BadRequestException('topic is required');
    const admin = this.supabaseService.getAdminClient();

    const unlocks = await this.getUnlocks(userId, topic);
    const currentLevel: VideoDifficulty = unlocks.has('advanced')
      ? 'advanced'
      : unlocks.has('intermediate')
        ? 'intermediate'
        : 'beginner';

    // Advanced is terminal
    if (currentLevel === 'advanced') {
      return { currentLevel, pendingQuizLevel: null, hasQuestions: false };
    }

    const level: QuizLevel = currentLevel;

    // Every published video in this topic at the current level
    const { data: levelVideos, error } = await admin
      .from('videos')
      .select('id, quiz_questions')
      .eq('topic', topic)
      .eq('difficulty_level', level)
      .eq('is_published', true)
      .eq('moderation_status', 'approved');

    if (error) {
      this.logger.error('Failed to load level videos for quiz status', error);
      throw error;
    }

    if (!levelVideos || levelVideos.length === 0) {
      // No videos at this level — nothing to quiz on yet
      return { currentLevel, pendingQuizLevel: null, hasQuestions: false };
    }

    const levelIds = levelVideos.map((v) => v.id);
    // Deduplicated watch history (see `user_watched_videos` view).
    const watched = await this.getWatchedVideoIds(userId, levelIds);
    const allWatched = levelIds.every((id) => watched.has(id));

    if (!allWatched) {
      return { currentLevel, pendingQuizLevel: null, hasQuestions: false };
    }

    const poolSize = this.countAvailableQuestions(levelVideos, watched);

    if (poolSize === 0) {
      // Fail-open: unlock next level so user isn't stuck
      await this.upsertUnlock(userId, topic, NEXT_LEVEL[level]);
      return {
        currentLevel,
        pendingQuizLevel: null,
        hasQuestions: false,
        autoUnlocked: true,
      };
    }

    return {
      currentLevel,
      pendingQuizLevel: level,
      hasQuestions: true,
    };
  }

  /**
   * Pick one random un-attempted question from the pool of
   * (topic, level) videos the user has already watched.
   *
   * If every question in the pool has already been attempted (user kept
   * answering wrong until the pool was exhausted), we fail-open and unlock
   * the next level so the user can continue.
   */
  async getNextQuestion(
    userId: string,
    topic: string,
    level: QuizLevel,
  ): Promise<NextQuestionResponse | null> {
    if (!topic) throw new BadRequestException('topic is required');
    if (!this.isQuizLevel(level)) throw new BadRequestException('Invalid level');
    const admin = this.supabaseService.getAdminClient();

    const { data: levelVideos, error } = await admin
      .from('videos')
      .select('id, quiz_questions')
      .eq('topic', topic)
      .eq('difficulty_level', level)
      .eq('is_published', true)
      .eq('moderation_status', 'approved');

    if (error) {
      this.logger.error('Failed to load level videos for next-question', error);
      throw error;
    }

    const watched = await this.getWatchedVideoIds(
      userId,
      (levelVideos ?? []).map((v) => v.id),
    );

    // Flatten: [{ videoId, question }]
    const pool: Array<{ videoId: string; q: StoredQuestion }> = [];
    for (const v of levelVideos ?? []) {
      if (!watched.has(v.id)) continue;
      const questions = this.extractQuestions(v.quiz_questions);
      for (const q of questions) pool.push({ videoId: v.id, q });
    }

    if (pool.length === 0) {
      const unlockedLevel = await this.autoUnlock(userId, topic, level);
      return {
        questionId: '',
        videoId: '',
        question: '',
        options: [],
        autoUnlock: true,
        unlockedLevel,
      };
    }

    const attempted = await this.getAttemptedQuestionIds(userId, topic, level);
    const remaining = pool.filter(({ q }) => !attempted.has(q.id));

    if (remaining.length === 0) {
      // Every question has been tried at least once — unlock so the user
      // isn't stuck retrying forever.
      const unlockedLevel = await this.autoUnlock(userId, topic, level);
      return {
        questionId: '',
        videoId: '',
        question: '',
        options: [],
        autoUnlock: true,
        unlockedLevel,
      };
    }

    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    return {
      questionId: pick.q.id,
      videoId: pick.videoId,
      question: pick.q.question,
      options: pick.q.options,
    };
  }

  /**
   * Compare the user's answer against the stored correctAnswer, log the
   * attempt, and unlock the next level on success.
   */
  async submit(
    userId: string,
    input: {
      topic: string;
      level: QuizLevel;
      questionId: string;
      videoId: string;
      selectedAnswer: number;
    },
  ): Promise<SubmitResponse> {
    if (!input.topic) throw new BadRequestException('topic is required');
    if (!this.isQuizLevel(input.level)) throw new BadRequestException('Invalid level');
    if (!input.questionId) throw new BadRequestException('questionId is required');
    if (!input.videoId) throw new BadRequestException('videoId is required');
    if (!Number.isInteger(input.selectedAnswer)) {
      throw new BadRequestException('selectedAnswer must be an integer');
    }

    const admin = this.supabaseService.getAdminClient();

    const { data: video, error } = await admin
      .from('videos')
      .select('id, topic, difficulty_level, quiz_questions')
      .eq('id', input.videoId)
      .single();

    if (error || !video) {
      throw new BadRequestException('Video not found');
    }
    if (video.topic !== input.topic || video.difficulty_level !== input.level) {
      throw new BadRequestException('Video does not match topic/level');
    }

    const questions = this.extractQuestions(video.quiz_questions);
    const question = questions.find((q) => q.id === input.questionId);
    if (!question) {
      throw new BadRequestException('Question not found on video');
    }

    const isCorrect = input.selectedAnswer === question.correctAnswer;

    // Log attempt (best-effort — we don't want a logging failure to hide
    // the user's answer from them).
    const { error: logErr } = await admin.from('core_quiz_attempts').insert({
      user_id: userId,
      topic: input.topic,
      level: input.level,
      video_id: input.videoId,
      question_id: input.questionId,
      selected_answer: input.selectedAnswer,
      is_correct: isCorrect,
    });
    if (logErr) this.logger.warn(`Failed to log quiz attempt: ${logErr.message}`);

    if (!isCorrect) {
      return { correct: false, explanation: question.explanation };
    }

    const unlockedLevel = NEXT_LEVEL[input.level];
    await this.upsertUnlock(userId, input.topic, unlockedLevel);
    return {
      correct: true,
      explanation: question.explanation,
      unlockedLevel,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private isQuizLevel(value: unknown): value is QuizLevel {
    return value === 'beginner' || value === 'intermediate';
  }

  private async getUnlocks(userId: string, topic: string): Promise<Set<string>> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('user_topic_level_unlocks')
      .select('level')
      .eq('user_id', userId)
      .eq('topic', topic);
    if (error) {
      this.logger.error('Failed to load unlocks', error);
      throw error;
    }
    return new Set((data ?? []).map((r) => r.level));
  }

  private async getWatchedVideoIds(userId: string, videoIds: string[]): Promise<Set<string>> {
    if (videoIds.length === 0) return new Set();
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('user_watched_videos')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds);
    if (error) {
      this.logger.error('Failed to load watched ids from user_watched_videos', error);
      throw error;
    }
    return new Set((data ?? []).map((r) => r.video_id));
  }

  private async getAttemptedQuestionIds(
    userId: string,
    topic: string,
    level: QuizLevel,
  ): Promise<Set<string>> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('core_quiz_attempts')
      .select('question_id')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('level', level);
    if (error) {
      this.logger.error('Failed to load attempts', error);
      throw error;
    }
    return new Set((data ?? []).map((r) => r.question_id));
  }

  private async upsertUnlock(
    userId: string,
    topic: string,
    level: VideoDifficulty,
  ): Promise<void> {
    if (level === 'beginner') return;
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.from('user_topic_level_unlocks').upsert(
      { user_id: userId, topic, level, unlocked_at: new Date().toISOString() },
      { onConflict: 'user_id,topic,level' },
    );
    if (error) this.logger.error('Failed to upsert unlock', error);
  }

  private async autoUnlock(
    userId: string,
    topic: string,
    level: QuizLevel,
  ): Promise<VideoDifficulty> {
    const next = NEXT_LEVEL[level];
    await this.upsertUnlock(userId, topic, next);
    return next;
  }

  private countAvailableQuestions(
    videos: Array<{ id: string; quiz_questions: unknown }>,
    watched: Set<string>,
  ): number {
    let n = 0;
    for (const v of videos) {
      if (!watched.has(v.id)) continue;
      n += this.extractQuestions(v.quiz_questions).length;
    }
    return n;
  }

  private extractQuestions(raw: unknown): StoredQuestion[] {
    if (!Array.isArray(raw)) return [];
    const out: StoredQuestion[] = [];
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      const q = r as any;
      if (
        typeof q.id === 'string' &&
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.every((o: unknown) => typeof o === 'string') &&
        Number.isInteger(q.correctAnswer) &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < q.options.length
      ) {
        out.push({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
        });
      }
    }
    return out;
  }
}
