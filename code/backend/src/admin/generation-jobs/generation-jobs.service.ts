import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateGenerationJobDto } from './dto/create-generation-job.dto';
import { GenerationJobQueryDto } from './dto/generation-job-query.dto';
import { JobStatus } from '../types/admin.types';

@Injectable()
export class GenerationJobsService {
  private readonly logger = new Logger(GenerationJobsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(dto: CreateGenerationJobDto, userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const record = {
      title: dto.title,
      topic: dto.topic,
      subject: dto.subject || null,
      content_target: dto.contentTarget,
      language: dto.language,
      tone: dto.tone || 'friendly',
      duration_target_seconds: dto.durationTargetSeconds || null,
      difficulty: dto.difficulty || null,
      custom_prompt: dto.customPrompt || null,
      reference_video_id: dto.referenceVideoId,
      brainrot_video_id: dto.brainrotVideoId || null,
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
      this.logger.error('Failed to create generation job', error);
      throw error;
    }
    return data;
  }

  async findAll(query: GenerationJobQueryDto) {
    const admin = this.supabaseService.getAdminClient();
    let q = admin
      .from('generated_video_jobs')
      .select('*, reference_videos!generated_video_jobs_reference_video_id_fkey(id, title, public_url, thumbnail_url)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query.status) q = q.eq('status', query.status);
    if (query.contentTarget) q = q.eq('content_target', query.contentTarget);
    if (query.language) q = q.eq('language', query.language);
    if (query.search) q = q.ilike('title', `%${query.search}%`);
    if (query.limit) q = q.limit(query.limit);
    if (query.offset) q = q.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error, count } = await q;

    if (error) {
      this.logger.error('Failed to list generation jobs', error);
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
      .single();

    if (error || !data) {
      throw new NotFoundException('Generation job not found');
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
      composedVideoUrl?: string;
      brainrotVideoId?: string;
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
    if (updates.composedVideoUrl !== undefined) fields.composed_video_url = updates.composedVideoUrl;
    if (updates.brainrotVideoId !== undefined) fields.brainrot_video_id = updates.brainrotVideoId;

    const { data, error } = await admin
      .from('generated_video_jobs')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update job ${id}`, error);
      throw error;
    }
    return data;
  }

  async getStats() {
    const admin = this.supabaseService.getAdminClient();

    const [total, processing, failed, published] = await Promise.all([
      admin.from('generated_video_jobs').select('id', { count: 'exact', head: true }),
      admin.from('generated_video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
      admin.from('generated_video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      admin.from('generated_video_jobs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
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
