import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../../supabase/supabase.service';
import { TopicSuggestionService } from '../../admin/ai/topic-suggestion.service';
import { CreateKidsBatchJobDto } from './dto/create-kids-batch-job.dto';
import { ApproveTopicsDto } from '../../admin/batch-jobs/dto/approve-topics.dto';
import { JobStatus } from '../../admin/types/admin.types';

const KIDS_TARGET = 'kids';
const KIDS_MAX_DURATION_SECONDS = 30;
const KIDS_BATCH_DURATION_SECONDS = KIDS_MAX_DURATION_SECONDS;

/**
 * Kids batch: N lesson angles × each mascot reference (bird, cat, dragon) — same DB tables as core batches,
 * but no difficulty tiers; jobs use difficulty NULL and kids_* columns.
 */
@Injectable()
export class KidsBatchJobsService {
  private readonly logger = new Logger(KidsBatchJobsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly topicSuggestionService: TopicSuggestionService,
  ) {}

  private async assertKidsBatch(batchId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('generation_batches')
      .select('id')
      .eq('id', batchId)
      .eq('content_target', KIDS_TARGET)
      .single();

    if (error || !data) {
      throw new NotFoundException('Kids batch not found');
    }
  }

  /**
   * Creates generation_batches + (videoCount × mascot refs) jobs.
   * Each lesson index shares kids_generation_group_id across mascots (traceability).
   */
  async createBatch(dto: CreateKidsBatchJobDto, userId: string) {
    const admin = this.supabaseService.getAdminClient();

    let q = admin
      .from('reference_videos')
      .select('id, character_id, title')
      .eq('audience_tag', 'kids')
      .not('character_id', 'is', null)
      .order('character_id', { ascending: true });

    if (dto.referenceVideoIds?.length) {
      q = q.in('id', dto.referenceVideoIds);
    }

    const { data: refs, error: refErr } = await q;

    if (refErr) {
      this.logger.error('Failed to load kids mascot reference videos', refErr);
      throw refErr;
    }

    if (!refs?.length) {
      throw new BadRequestException(
        'No mascot reference videos found. Upload kids bases with audience_tag=kids and character_id (bird, cat, dragon), or pass referenceVideoIds.',
      );
    }

    const n = dto.videoCount;
    const mascotCount = refs.length;
    const totalJobs = n * mascotCount;

    const topicTags = [...new Set(dto.topicTags.map((t) => t.trim()).filter(Boolean))];
    if (topicTags.length === 0) {
      throw new BadRequestException('topicTags must include at least one catalog topic name.');
    }

    let suggestions: Array<{ title: string; subTopic: string }>;
    try {
      suggestions = await this.topicSuggestionService.suggestKidsMascotBatchTopics(
        dto.topic,
        n,
        dto.language,
        dto.subject,
        dto.customPrompt,
      );
    } catch (err) {
      this.logger.error('Kids batch topic suggestion failed, using fallback titles', err);
      suggestions = Array.from({ length: n }, (_, i) => ({
        title: `${dto.title} — #${i + 1}`,
        subTopic: `${dto.topic} — angle ${i + 1}`,
      }));
    }

    const { data: batch, error: batchError } = await admin
      .from('generation_batches')
      .insert({
        title: dto.title,
        topic: dto.topic,
        subject: dto.subject || null,
        content_target: KIDS_TARGET,
        language: dto.language,
        tone: dto.tone || 'friendly',
        reference_video_id: refs[0].id,
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
      this.logger.error('Failed to create kids batch', batchError);
      throw batchError ?? new Error('Failed to create kids batch');
    }

    const jobRecords: Record<string, unknown>[] = [];

    for (let i = 0; i < n; i++) {
      const groupId = randomUUID();
      const sug = suggestions[i] ?? {
        title: `${dto.title} — #${i + 1}`,
        subTopic: `${dto.topic} — angle ${i + 1}`,
      };

      for (const ref of refs) {
        jobRecords.push({
          batch_id: batch.id,
          title: `${sug.title} (${ref.character_id})`,
          topic: sug.subTopic,
          suggested_sub_topic: sug.subTopic,
          subject: dto.subject || null,
          content_target: KIDS_TARGET,
          language: dto.language,
          tone: dto.tone || 'friendly',
          duration_target_seconds: KIDS_BATCH_DURATION_SECONDS,
          difficulty: null,
          custom_prompt: dto.customPrompt || null,
          reference_video_id: ref.id,
          kids_generation_group_id: groupId,
          kids_age_group: dto.ageGroup,
          kids_topic_tags: topicTags,
          status: JobStatus.DRAFT,
          progress_percent: 0,
          created_by: userId,
        });
      }
    }

    const { data: jobs, error: jobsError } = await admin
      .from('generated_video_jobs')
      .insert(jobRecords)
      .select(
        'id, title, topic, suggested_sub_topic, difficulty, status, reference_video_id, kids_generation_group_id',
      );

    if (jobsError || !jobs) {
      this.logger.error('Failed to create kids batch jobs', jobsError);
      throw jobsError ?? new Error('Failed to create kids batch jobs');
    }

    this.logger.log(
      `[kids] Batch ${batch.id}: ${n} lessons × ${mascotCount} mascots = ${jobs.length} jobs`,
    );

    return {
      batch,
      jobs,
      meta: {
        videoCount: n,
        mascotCount,
        totalJobs: jobs.length,
      },
    };
  }

  async applyApprovedTopics(batchId: string, dto: ApproveTopicsDto): Promise<void> {
    await this.assertKidsBatch(batchId);
    const admin = this.supabaseService.getAdminClient();

    await Promise.all(
      dto.jobs.map(({ jobId, title, subTopic }) =>
        admin
          .from('generated_video_jobs')
          .update({
            title,
            topic: subTopic,
            suggested_sub_topic: subTopic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId)
          .eq('batch_id', batchId)
          .eq('content_target', KIDS_TARGET),
      ),
    );

    this.logger.log(`[kids] Applied topic edits for batch ${batchId} (${dto.jobs.length} jobs)`);
  }

  async updateBatchStatus(batchId: string, status: string): Promise<void> {
    await this.assertKidsBatch(batchId);
    const admin = this.supabaseService.getAdminClient();
    await admin
      .from('generation_batches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .eq('content_target', KIDS_TARGET);
  }

  async getScripts(batchId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: batch, error: batchErr } = await admin
      .from('generation_batches')
      .select('*')
      .eq('id', batchId)
      .eq('content_target', KIDS_TARGET)
      .single();

    if (batchErr || !batch) throw new NotFoundException('Kids batch not found');

    const { data: jobs, error: jobsErr } = await admin
      .from('generated_video_jobs')
      .select('id, title, topic, difficulty, status, generated_script, cleaned_narration_text, script_approved, error_message, kids_generation_group_id, reference_video_id')
      .eq('batch_id', batchId)
      .eq('content_target', KIDS_TARGET)
      .order('created_at', { ascending: true });

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
      .eq('id', jobId)
      .eq('content_target', KIDS_TARGET);

    if (error) {
      this.logger.error(`Failed to mark script approved for kids job ${jobId}`, error);
      throw error;
    }
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: batch, error } = await admin
      .from('generation_batches')
      .select('*')
      .eq('id', id)
      .eq('content_target', KIDS_TARGET)
      .single();

    if (error || !batch) {
      throw new NotFoundException('Kids batch not found');
    }

    const { data: jobs } = await admin
      .from('generated_video_jobs')
      .select(
        'id, title, topic, difficulty, status, current_step, progress_percent, error_message, script_approved, created_at, updated_at, kids_generation_group_id, reference_video_id',
      )
      .eq('batch_id', id)
      .eq('content_target', KIDS_TARGET)
      .order('created_at', { ascending: true });

    return { batch, jobs: jobs ?? [] };
  }

  async findAll(limit = 20, offset = 0) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error, count } = await admin
      .from('generation_batches')
      .select('*', { count: 'exact' })
      .eq('content_target', KIDS_TARGET)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Failed to list kids batches', error);
      throw error;
    }

    return { data: data ?? [], count: count ?? 0 };
  }

  async getJobIdsForBatch(batchId: string): Promise<string[]> {
    await this.assertKidsBatch(batchId);
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('generated_video_jobs')
      .select('id')
      .eq('batch_id', batchId)
      .eq('content_target', KIDS_TARGET);

    if (error) {
      this.logger.error(`Failed to get job IDs for kids batch ${batchId}`, error);
      throw error;
    }

    return (data ?? []).map((row) => row.id);
  }

  async updateBatchProgress(batchId: string): Promise<void> {
    await this.assertKidsBatch(batchId);
    const admin = this.supabaseService.getAdminClient();

    const { data: jobs, error } = await admin
      .from('generated_video_jobs')
      .select('status')
      .eq('batch_id', batchId)
      .eq('content_target', KIDS_TARGET);

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
      .eq('id', batchId)
      .eq('content_target', KIDS_TARGET);
  }
}
