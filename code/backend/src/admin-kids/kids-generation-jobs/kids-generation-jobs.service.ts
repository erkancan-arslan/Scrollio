import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateKidsGenerationJobDto } from '../dto/create-kids-generation-job.dto';
import { GenerationJobQueryDto } from '../../admin/generation-jobs/dto/generation-job-query.dto';
import { CreateKidsVideoBundleDto } from './dto/create-kids-video-bundle.dto';
import { JobStatus } from '../../admin/types/admin.types';

const KIDS_TARGET = 'kids';
/** Hard cap for kids narration (TTS vs base video length). */
const KIDS_MAX_DURATION_SECONDS = 30;
/** Default when client omits duration. */
const KIDS_DEFAULT_DURATION_SECONDS = KIDS_MAX_DURATION_SECONDS;

/**
 * Kids-module clone of GenerationJobsService: same tables, scoped to content_target = kids.
 */
@Injectable()
export class KidsGenerationJobsService {
  private readonly logger = new Logger(KidsGenerationJobsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(dto: CreateKidsGenerationJobDto, userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const record = {
      title: dto.title,
      topic: dto.topic,
      subject: dto.subject || null,
      content_target: KIDS_TARGET,
      language: dto.language,
      tone: dto.tone || 'friendly',
      duration_target_seconds: Math.min(
        dto.durationTargetSeconds ?? KIDS_DEFAULT_DURATION_SECONDS,
        KIDS_MAX_DURATION_SECONDS,
      ),
      difficulty: dto.difficulty ?? null,
      custom_prompt: dto.customPrompt || null,
      reference_video_id: dto.referenceVideoId,
      kids_age_group: dto.ageGroup ?? null,
      kids_topic_tags:
        dto.topicTags && dto.topicTags.length > 0
          ? [...new Set(dto.topicTags.map((t) => t.trim()).filter(Boolean))]
          : null,
      status: JobStatus.DRAFT,
      progress_percent: 0,
      created_by: userId,
    };

    const { data, error } = await admin
      .from('generated_video_jobs')
      .insert(record)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create kids generation job', error);
      throw error;
    }
    return data;
  }

  /**
   * One admin lesson × N mascot base videos: creates N jobs sharing kids_generation_group_id and one script (filled in pipeline).
   */
  async createMascotBundle(dto: CreateKidsVideoBundleDto, userId: string) {
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
        'No mascot reference videos found. Upload kids base animations with audience_tag=kids and character_id (bird, cat, or dragon).',
      );
    }

    const groupId = randomUUID();

    const records = refs.map((ref) => ({
      title: dto.title,
      topic: dto.topic,
      subject: dto.subject || null,
      content_target: KIDS_TARGET,
      language: dto.language,
      tone: dto.tone || 'friendly',
      duration_target_seconds: KIDS_DEFAULT_DURATION_SECONDS,
      difficulty: null,
      custom_prompt: dto.customPrompt || null,
      reference_video_id: ref.id,
      kids_generation_group_id: groupId,
      kids_age_group: dto.ageGroup,
      kids_topic_tags: dto.topicTags,
      status: JobStatus.DRAFT,
      progress_percent: 0,
      created_by: userId,
    }));

    const { data: jobs, error: jobsErr } = await admin
      .from('generated_video_jobs')
      .insert(records)
      .select('id, title, topic, reference_video_id, kids_generation_group_id, kids_age_group, kids_topic_tags, status');

    if (jobsErr || !jobs) {
      this.logger.error('Failed to create kids mascot bundle jobs', jobsErr);
      throw jobsErr ?? new Error('Failed to create jobs');
    }

    return { kidsGenerationGroupId: groupId, jobs };
  }

  async findJobsByGroupId(groupId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('generated_video_jobs')
      .select(
        '*, reference_videos!generated_video_jobs_reference_video_id_fkey(id, title, public_url, thumbnail_url, persona_name, character_id)',
      )
      .eq('kids_generation_group_id', groupId)
      .eq('content_target', KIDS_TARGET)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to load jobs for group ${groupId}`, error);
      throw error;
    }
    if (!data?.length) {
      throw new NotFoundException('Kids generation group not found');
    }
    return data;
  }

  async findAll(query: GenerationJobQueryDto) {
    const admin = this.supabaseService.getAdminClient();
    let q = admin
      .from('generated_video_jobs')
      .select('*, reference_videos!generated_video_jobs_reference_video_id_fkey(id, title, public_url, thumbnail_url)', { count: 'exact' })
      .eq('content_target', KIDS_TARGET)
      .order('created_at', { ascending: false });

    if (query.status) q = q.eq('status', query.status);
    if (query.language) q = q.eq('language', query.language);
    if (query.search) q = q.ilike('title', `%${query.search}%`);
    if (query.limit) q = q.limit(query.limit);
    if (query.offset) q = q.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error, count } = await q;

    if (error) {
      this.logger.error('Failed to list kids generation jobs', error);
      throw error;
    }
    return { data: data ?? [], count: count ?? 0 };
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('generated_video_jobs')
      .select('*, reference_videos!generated_video_jobs_reference_video_id_fkey(id, title, public_url, thumbnail_url, persona_name)')
      .eq('id', id)
      .eq('content_target', KIDS_TARGET)
      .single();

    if (error || !data) {
      throw new NotFoundException('Kids generation job not found');
    }
    return data;
  }

  async updateStatus(
    id: string,
    updates: {
      status?: string;
      currentStep?: string;
      progressPercent?: number;
      errorMessage?: string;
      generatedScript?: string;
      cleanedNarrationText?: string;
      audioUrl?: string;
      finalVideoUrl?: string;
      finalVideoProvider?: string;
      referenceVideoUrlSnapshot?: string;
      thumbnailUrl?: string;
    },
  ) {
    const admin = this.supabaseService.getAdminClient();

    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) fields.status = updates.status;
    if (updates.currentStep !== undefined) fields.current_step = updates.currentStep;
    if (updates.progressPercent !== undefined) fields.progress_percent = updates.progressPercent;
    if (updates.errorMessage !== undefined) fields.error_message = updates.errorMessage;
    if (updates.generatedScript !== undefined) fields.generated_script = updates.generatedScript;
    if (updates.cleanedNarrationText !== undefined) fields.cleaned_narration_text = updates.cleanedNarrationText;
    if (updates.audioUrl !== undefined) fields.audio_url = updates.audioUrl;
    if (updates.finalVideoUrl !== undefined) fields.final_video_url = updates.finalVideoUrl;
    if (updates.finalVideoProvider !== undefined) fields.final_video_provider = updates.finalVideoProvider;
    if (updates.referenceVideoUrlSnapshot !== undefined) fields.reference_video_url_snapshot = updates.referenceVideoUrlSnapshot;
    if (updates.thumbnailUrl !== undefined) fields.thumbnail_url = updates.thumbnailUrl;

    const { data, error } = await admin
      .from('generated_video_jobs')
      .update(fields)
      .eq('id', id)
      .eq('content_target', KIDS_TARGET)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update kids job ${id}`, error);
      throw error;
    }
    return data;
  }

  async getStats() {
    const admin = this.supabaseService.getAdminClient();
    const base = () => admin.from('generated_video_jobs').select('id', { count: 'exact', head: true }).eq('content_target', KIDS_TARGET);

    const [total, processing, failed, published] = await Promise.all([
      base(),
      base().eq('status', 'processing'),
      base().eq('status', 'failed'),
      base().eq('status', 'published'),
    ]);

    const { count: refVideoCount } = await admin
      .from('reference_videos')
      .select('id', { count: 'exact', head: true });

    return {
      totalJobs: total.count ?? 0,
      processingJobs: processing.count ?? 0,
      failedJobs: failed.count ?? 0,
      publishedJobs: published.count ?? 0,
      totalReferenceVideos: refVideoCount ?? 0,
    };
  }
}
