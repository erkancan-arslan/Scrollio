import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { GeneratedVideoQueryDto } from './dto/generated-video-query.dto';

interface CreateFromJobInput {
  jobId: string;
  title: string;
  topic: string;
  subject?: string;
  contentTarget: string;
  language: string;
  difficulty?: string | null;
  script?: string;
  audioUrl?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  referenceVideoId?: string;
  quizQuestions?: unknown[];
}

@Injectable()
export class GeneratedVideosService {
  private readonly logger = new Logger(GeneratedVideosService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createFromJob(input: CreateFromJobInput) {
    const admin = this.supabaseService.getAdminClient();

    const record = {
      job_id: input.jobId,
      title: input.title,
      topic: input.topic,
      subject: input.subject || null,
      content_target: input.contentTarget,
      language: input.language,
      difficulty: input.difficulty || null,
      script: input.script || null,
      audio_url: input.audioUrl || null,
      video_url: input.videoUrl,
      thumbnail_url: input.thumbnailUrl || null,
      reference_video_id: input.referenceVideoId || null,
      quiz_questions: input.quizQuestions ?? [],
      status: 'active',
    };

    const { data, error } = await admin
      .from('generated_videos')
      .insert(record)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create generated video', error);
      throw error;
    }
    return data;
  }

  async findAll(query: GeneratedVideoQueryDto) {
    const admin = this.supabaseService.getAdminClient();
    let q = admin
      .from('generated_videos')
      .select('*, feed_items(id, feed_type, is_published)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query.contentTarget) q = q.eq('content_target', query.contentTarget);
    if (query.status) q = q.eq('status', query.status);
    if (query.language) q = q.eq('language', query.language);
    if (query.jobId) q = q.eq('job_id', query.jobId);
    if (query.search) q = q.ilike('title', `%${query.search}%`);
    if (query.limit) q = q.limit(query.limit);
    if (query.offset) q = q.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error, count } = await q;

    if (error) {
      this.logger.error('Failed to list generated videos', error);
      throw error;
    }
    return { data: data ?? [], count: count ?? 0 };
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('generated_videos')
      .select('*, feed_items(id, feed_type, is_published, published_at)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Generated video not found');
    }
    return data;
  }

  async updateStatus(id: string, status: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('generated_videos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update generated video ${id}`, error);
      throw error;
    }
    return data;
  }
}
