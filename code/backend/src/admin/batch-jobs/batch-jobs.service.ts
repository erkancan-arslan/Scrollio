import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { TopicSuggestionService, Difficulty, PreviousLevelTopic } from '../ai/topic-suggestion.service';
import { CreateBatchJobDto } from './dto/create-batch-job.dto';
import { ApproveTopicsDto } from './dto/approve-topics.dto';
import { ApproveAndSuggestNextDto } from './dto/approve-and-suggest-next.dto';
import { JobStatus } from '../types/admin.types';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const VIDEOS_PER_DIFFICULTY = 5;
const BATCH_DURATION_SECONDS = 20;

const NEXT_DIFFICULTY: Record<'beginner' | 'intermediate', Difficulty> = {
  beginner: 'intermediate',
  intermediate: 'advanced',
};

@Injectable()
export class BatchJobsService {
  private readonly logger = new Logger(BatchJobsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly topicSuggestionService: TopicSuggestionService,
  ) {}

  /**
   * Creates the batch record + 15 job placeholders, then immediately
   * suggests 5 beginner topics (the only level the user sees first).
   * Intermediate and advanced get placeholder titles — they will be
   * suggested step-by-step as the user approves each level.
   */
  async createBatch(dto: CreateBatchJobDto, userId: string) {
    const admin = this.supabaseService.getAdminClient();

    const totalJobs = DIFFICULTIES.length * VIDEOS_PER_DIFFICULTY;

    const { data: batch, error: batchError } = await admin
      .from('generation_batches')
      .insert({
        title: dto.title,
        topic: dto.topic,
        subject: dto.subject || null,
        content_target: dto.contentTarget,
        language: dto.language,
        tone: dto.tone || 'friendly',
        reference_video_id: dto.referenceVideoId,
        brainrot_video_id: dto.brainrotVideoId || null,
        custom_prompt: dto.customPrompt || null,
        total_jobs: totalJobs,
        completed_jobs: 0,
        failed_jobs: 0,
        status: 'pending',
        created_by: userId,
      })
      .select()
      .single();

    if (batchError || !batch) {
      this.logger.error('Failed to create batch', batchError);
      throw batchError ?? new Error('Failed to create batch');
    }

    // ── 1. Suggest beginner topics ──────────────────────────────────────────
    let beginnerSuggestions: Array<{ title: string; subTopic: string }>;
    try {
      beginnerSuggestions = await this.topicSuggestionService.suggestForDifficulty(
        dto.topic,
        'beginner',
        dto.language,
        dto.contentTarget,
        dto.subject,
        dto.customPrompt,
      );
    } catch (err) {
      this.logger.error('Beginner topic suggestion failed, using fallback', err);
      beginnerSuggestions = Array.from({ length: VIDEOS_PER_DIFFICULTY }, (_, i) => ({
        title: `${dto.title} — Beginner #${i + 1}`,
        subTopic: `${dto.topic} beginner concept ${i + 1}`,
      }));
    }

    // ── 2. Create all 15 job records ────────────────────────────────────────
    // Beginner jobs get real suggestions; intermediate/advanced get placeholder titles
    // that will be filled in when the user approves each previous level.
    const jobRecords = DIFFICULTIES.flatMap((difficulty, diffIdx) =>
      Array.from({ length: VIDEOS_PER_DIFFICULTY }, (_, i) => {
        const isFirst = difficulty === 'beginner';
        const suggestion = isFirst ? (beginnerSuggestions[i] ?? null) : null;
        return {
          batch_id: batch.id,
          title: suggestion?.title ?? `${dto.title} — ${this.capitalize(difficulty)} #${i + 1}`,
          topic: dto.topic,
          suggested_sub_topic: suggestion?.subTopic ?? null,
          subject: suggestion?.subTopic ?? dto.subject ?? null,
          content_target: dto.contentTarget,
          language: dto.language,
          tone: dto.tone || 'friendly',
          duration_target_seconds: BATCH_DURATION_SECONDS,
          difficulty,
          custom_prompt: dto.customPrompt || null,
          reference_video_id: dto.referenceVideoId,
          brainrot_video_id: dto.brainrotVideoId || null,
          status: JobStatus.DRAFT,
          progress_percent: 0,
          created_by: userId,
        };
      }),
    );

    const { data: jobs, error: jobsError } = await admin
      .from('generated_video_jobs')
      .insert(jobRecords)
      .select('id, title, topic, suggested_sub_topic, difficulty, status');

    if (jobsError || !jobs) {
      this.logger.error('Failed to create batch jobs', jobsError);
      throw jobsError ?? new Error('Failed to create batch jobs');
    }

    // Return only beginner jobs — user reviews these first
    const beginnerJobs = jobs.filter((j) => j.difficulty === 'beginner');
    this.logger.log(`Batch ${batch.id} created. Beginner topics suggested.`);
    return { batch, jobs: beginnerJobs };
  }

  /**
   * Saves the approved topics for the current difficulty level, then
   * uses them as context to generate suggestions for the next level.
   * Returns the next difficulty's job records with suggestions populated.
   */
  async approveAndSuggestNext(batchId: string, dto: ApproveAndSuggestNextDto) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Persist approved topics for current difficulty
    await Promise.all(
      dto.approvedJobs.map(({ jobId, title, subTopic }) =>
        admin
          .from('generated_video_jobs')
          .update({
            title,
            subject: subTopic,
            suggested_sub_topic: subTopic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId)
          .eq('batch_id', batchId),
      ),
    );

    // 2. Build full previous-level context for the LLM
    //    Load ALL previously saved topics so advanced sees both beginner + intermediate
    const { data: savedJobs } = await admin
      .from('generated_video_jobs')
      .select('difficulty, title, suggested_sub_topic')
      .eq('batch_id', batchId)
      .in('difficulty', this.getPreviousDifficulties(dto.currentDifficulty))
      .not('suggested_sub_topic', 'is', null)
      .order('difficulty')
      .order('created_at');

    const previousLevelTopics = (['beginner', 'intermediate'] as const)
      .filter((d) => this.getPreviousDifficulties(dto.currentDifficulty).includes(d))
      .map((d) => ({
        difficulty: d as Difficulty,
        topics: (savedJobs ?? [])
          .filter((j) => j.difficulty === d)
          .map((j): PreviousLevelTopic => ({
            title: j.title,
            subTopic: j.suggested_sub_topic ?? j.title,
          })),
      }))
      .filter((entry) => entry.topics.length > 0);

    // 3. Get the batch details to pass to the suggestion service
    const { data: batch } = await admin
      .from('generation_batches')
      .select('topic, subject, language, content_target, custom_prompt')
      .eq('id', batchId)
      .single();

    if (!batch) throw new NotFoundException('Batch not found');

    // 4. Suggest topics for next difficulty
    const nextDifficulty = NEXT_DIFFICULTY[dto.currentDifficulty];

    let nextSuggestions: Array<{ title: string; subTopic: string }>;
    try {
      nextSuggestions = await this.topicSuggestionService.suggestForDifficulty(
        batch.topic,
        nextDifficulty,
        batch.language,
        batch.content_target,
        batch.subject ?? undefined,
        batch.custom_prompt ?? undefined,
        previousLevelTopics,
      );
    } catch (err) {
      this.logger.error(`${nextDifficulty} topic suggestion failed, using fallback`, err);
      nextSuggestions = Array.from({ length: VIDEOS_PER_DIFFICULTY }, (_, i) => ({
        title: `${batch.topic} — ${this.capitalize(nextDifficulty)} #${i + 1}`,
        subTopic: `${batch.topic} ${nextDifficulty} concept ${i + 1}`,
      }));
    }

    // 5. Update next-difficulty job records with the suggestions
    const { data: nextJobs } = await admin
      .from('generated_video_jobs')
      .select('id, title, topic, suggested_sub_topic, difficulty, status')
      .eq('batch_id', batchId)
      .eq('difficulty', nextDifficulty)
      .order('created_at');

    if (nextJobs) {
      await Promise.all(
        nextJobs.map((job, i) => {
          const s = nextSuggestions[i];
          if (!s) return Promise.resolve();
          return admin
            .from('generated_video_jobs')
            .update({
              title: s.title,
              subject: s.subTopic,
              suggested_sub_topic: s.subTopic,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
        }),
      );
    }

    // Return fresh copy of next-difficulty jobs with suggestions
    const { data: freshNextJobs } = await admin
      .from('generated_video_jobs')
      .select('id, title, topic, suggested_sub_topic, difficulty, status')
      .eq('batch_id', batchId)
      .eq('difficulty', nextDifficulty)
      .order('created_at');

    return {
      nextDifficulty,
      jobs: freshNextJobs ?? [],
    };
  }

  /** Save the final (advanced) approved topics. Script generation is triggered by the controller. */
  async applyApprovedTopics(batchId: string, dto: ApproveTopicsDto): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    await Promise.all(
      dto.jobs.map(({ jobId, title, subTopic }) =>
        admin
          .from('generated_video_jobs')
          .update({
            title,
            subject: subTopic,
            suggested_sub_topic: subTopic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId)
          .eq('batch_id', batchId),
      ),
    );

    this.logger.log(`Applied advanced topics for batch ${batchId}`);
  }

  async updateBatchStatus(batchId: string, status: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    await admin
      .from('generation_batches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', batchId);
  }

  async getScripts(batchId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: batch, error: batchErr } = await admin
      .from('generation_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchErr || !batch) throw new NotFoundException('Batch not found');

    const { data: jobs, error: jobsErr } = await admin
      .from('generated_video_jobs')
      .select('id, title, topic, difficulty, status, generated_script, cleaned_narration_text, script_approved, error_message')
      .eq('batch_id', batchId)
      .order('difficulty')
      .order('created_at');

    if (jobsErr) throw jobsErr;

    return { batch, jobs: jobs ?? [] };
  }

  async markScriptApproved(jobId: string, editedNarration?: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    const fields: Record<string, unknown> = {
      script_approved: true,
      updated_at: new Date().toISOString(),
    };

    if (editedNarration !== undefined) {
      fields.cleaned_narration_text = editedNarration;
      fields.generated_script = editedNarration;
    }

    const { error } = await admin
      .from('generated_video_jobs')
      .update(fields)
      .eq('id', jobId);

    if (error) {
      this.logger.error(`Failed to mark script approved for job ${jobId}`, error);
      throw error;
    }
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: batch, error } = await admin
      .from('generation_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !batch) {
      throw new NotFoundException('Batch not found');
    }

    const { data: jobs } = await admin
      .from('generated_video_jobs')
      .select('id, title, topic, difficulty, status, current_step, progress_percent, error_message, script_approved, created_at, updated_at')
      .eq('batch_id', id)
      .order('difficulty')
      .order('created_at');

    return { batch, jobs: jobs ?? [] };
  }

  async findAll(limit = 20, offset = 0) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error, count } = await admin
      .from('generation_batches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Failed to list batches', error);
      throw error;
    }

    return { data: data ?? [], count: count ?? 0 };
  }

  async getJobIdsForBatch(batchId: string): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('generated_video_jobs')
      .select('id')
      .eq('batch_id', batchId);

    if (error) {
      this.logger.error(`Failed to get job IDs for batch ${batchId}`, error);
      throw error;
    }

    return (data ?? []).map((row) => row.id);
  }

  async updateBatchProgress(batchId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    const { data: jobs, error } = await admin
      .from('generated_video_jobs')
      .select('status')
      .eq('batch_id', batchId);

    if (error || !jobs) return;

    const total = jobs.length;
    const completed = jobs.filter((j) => j.status === 'published').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;

    let batchStatus = 'running';
    if (completed + failed === total) {
      batchStatus = failed === total ? 'failed' : 'completed';
    }

    await admin
      .from('generation_batches')
      .update({
        completed_jobs: completed,
        failed_jobs: failed,
        status: batchStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);
  }

  private getPreviousDifficulties(current: 'beginner' | 'intermediate'): Difficulty[] {
    if (current === 'beginner') return [];
    if (current === 'intermediate') return ['beginner'];
    return ['beginner', 'intermediate'];
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
