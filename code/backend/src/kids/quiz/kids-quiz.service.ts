import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SubmitAnswerDto } from './dto';

const KIDS_PLAYGROUND_POINTS_QUIZ_CORRECT = 35;

@Injectable()
export class KidsQuizService {
  private readonly logger = new Logger(KidsQuizService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get quiz by content ID. Hides correct answers from the response.
   */
  async getQuizByContentId(childId: string, contentId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: quiz, error } = await admin
      .from('kids_quizzes')
      .select('*')
      .eq('content_id', contentId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !quiz) {
      throw new NotFoundException('Quiz not found for this content');
    }

    // Check if child already has a perfect score
    const { data: bestAttempt } = await admin
      .from('kids_quiz_attempts')
      .select('score')
      .eq('child_profile_id', childId)
      .eq('quiz_id', quiz.id)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Strip correct answers from questions before sending to client
    const questions = (quiz.questions as Array<Record<string, unknown>>).map(
      (q, idx) => ({
        id: q.id ?? `q_${idx}`,
        question: q.question,
        options: q.options,
        // Do NOT include q.correctAnswer
      }),
    );

    return {
      id: quiz.id,
      contentId: quiz.content_id,
      questions,
      completed: (bestAttempt?.score as number) === 100,
    };
  }

  /**
   * Submit quiz answers. Calculates score, awards XP.
   */
  async submitAnswer(childId: string, quizId: string, dto: SubmitAnswerDto) {
    const admin = this.supabaseService.getAdminClient();

    // Fetch quiz with correct answers
    const { data: quiz, error } = await admin
      .from('kids_quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();

    if (error || !quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = quiz.questions as Array<{
      id?: string;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
    }>;

    // Find the question matching the submitted answer
    const question = questions.find(
      (q, idx) => (q.id ?? `q_${idx}`) === dto.questionId,
    );

    if (!question) {
      throw new NotFoundException('Question not found in this quiz');
    }

    const isCorrect =
      dto.selectedAnswers.length === 1 &&
      dto.selectedAnswers[0] === question.correctAnswer;

    // Calculate score across all attempts for this quiz
    // For simplicity, we score this single question submission
    const score = isCorrect ? 100 : 0;

    // Award XP
    let xpEarned = 10; // base XP for attempting
    if (isCorrect) xpEarned = 50;

    // Insert attempt
    await admin.from('kids_quiz_attempts').insert({
      child_profile_id: childId,
      quiz_id: quizId,
      answers: [
        {
          questionId: dto.questionId,
          selectedAnswers: dto.selectedAnswers,
          correct: isCorrect,
        },
      ],
      score,
      completed_at: new Date().toISOString(),
    });

    // Log activity
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'quiz_attempt',
      metadata: {
        quiz_id: quizId,
        question_id: dto.questionId,
        score,
        correct: isCorrect,
        xp_earned: xpEarned,
      },
    });

    // Add XP to progress
    await this.addXp(admin, childId, xpEarned);

    let playgroundPointsAwarded = 0;
    if (isCorrect) {
      playgroundPointsAwarded = KIDS_PLAYGROUND_POINTS_QUIZ_CORRECT;
      await this.addPlaygroundPoints(admin, childId, playgroundPointsAwarded);
    }

    const playgroundPoints = await this.getPlaygroundPoints(admin, childId);

    return {
      correct: isCorrect,
      score,
      xpEarned,
      playgroundPointsAwarded,
      playgroundPoints,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? null,
    };
  }

  private async getPlaygroundPoints(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
  ): Promise<number> {
    const { data: row } = await admin
      .from('kids_progress')
      .select('playground_points')
      .eq('child_profile_id', childId)
      .maybeSingle();
    return (row?.playground_points as number) ?? 0;
  }

  private async addPlaygroundPoints(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
    amount: number,
  ) {
    if (amount <= 0) return;
    const { data: progress } = await admin
      .from('kids_progress')
      .select('playground_points')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!progress) return;

    const next = (progress.playground_points as number) + amount;
    await admin
      .from('kids_progress')
      .update({ playground_points: next, updated_at: new Date().toISOString() })
      .eq('child_profile_id', childId);
  }

  private async addXp(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
    xpAmount: number,
  ) {
    const { data: progress } = await admin
      .from('kids_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!progress) return;

    let newXp = (progress.xp as number) + xpAmount;
    let level = progress.level as number;

    while (newXp >= level * 100) {
      newXp -= level * 100;
      level++;
    }

    await admin
      .from('kids_progress')
      .update({ xp: newXp, level, updated_at: new Date().toISOString() })
      .eq('child_profile_id', childId);
  }
}
