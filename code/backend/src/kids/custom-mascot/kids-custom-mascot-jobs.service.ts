import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

export type KidsCustomMascotJobRow = {
  id: string;
  child_profile_id: string;
  parent_user_id: string;
  status: string;
  current_step: string | null;
  progress_percent: number;
  mentor_image_url: string | null;
  portrait_9_16_image_url: string | null;
  upscaled_image_url: string | null;
  raw_video_url: string | null;
  final_video_url: string | null;
  narration_audio_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class KidsCustomMascotJobsService {
  private readonly logger = new Logger(KidsCustomMascotJobsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async assertChildBelongsToParent(childProfileId: string, parentUserId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_child_profiles')
      .select('id, parent_id')
      .eq('id', childProfileId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Child profile not found');
    }
    if (data.parent_id !== parentUserId) {
      throw new ForbiddenException('This child profile does not belong to the current user');
    }
  }

  async createJob(childProfileId: string, parentUserId: string): Promise<KidsCustomMascotJobRow> {
    await this.assertChildBelongsToParent(childProfileId, parentUserId);

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_custom_mascot_jobs')
      .insert({
        child_profile_id: childProfileId,
        parent_user_id: parentUserId,
        status: 'queued',
        progress_percent: 0,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create kids_custom_mascot_jobs row', error);
      throw error ?? new Error('Failed to create job');
    }
    return data as KidsCustomMascotJobRow;
  }

  async findOneForParent(jobId: string, parentUserId: string): Promise<KidsCustomMascotJobRow> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_custom_mascot_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('parent_user_id', parentUserId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Mascot job not found');
    }
    return data as KidsCustomMascotJobRow;
  }

  async findLatestForChild(childProfileId: string, parentUserId: string): Promise<KidsCustomMascotJobRow | null> {
    await this.assertChildBelongsToParent(childProfileId, parentUserId);

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_custom_mascot_jobs')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .eq('parent_user_id', parentUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error('findLatestForChild error', error);
      throw error;
    }
    return (data as KidsCustomMascotJobRow) ?? null;
  }

  async updateJob(
    jobId: string,
    updates: Partial<{
      status: string;
      currentStep: string | null;
      progressPercent: number;
      mentorImageUrl: string | null;
      portrait9_16ImageUrl: string | null;
      upscaledImageUrl: string | null;
      rawVideoUrl: string | null;
      finalVideoUrl: string | null;
      narrationAudioUrl: string | null;
      errorMessage: string | null;
    }>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.currentStep !== undefined) row.current_step = updates.currentStep;
    if (updates.progressPercent !== undefined) row.progress_percent = updates.progressPercent;
    if (updates.mentorImageUrl !== undefined) row.mentor_image_url = updates.mentorImageUrl;
    if (updates.portrait9_16ImageUrl !== undefined) row.portrait_9_16_image_url = updates.portrait9_16ImageUrl;
    if (updates.upscaledImageUrl !== undefined) row.upscaled_image_url = updates.upscaledImageUrl;
    if (updates.rawVideoUrl !== undefined) row.raw_video_url = updates.rawVideoUrl;
    if (updates.finalVideoUrl !== undefined) row.final_video_url = updates.finalVideoUrl;
    if (updates.narrationAudioUrl !== undefined) row.narration_audio_url = updates.narrationAudioUrl;
    if (updates.errorMessage !== undefined) row.error_message = updates.errorMessage;

    const { error } = await admin.from('kids_custom_mascot_jobs').update(row).eq('id', jobId);
    if (error) {
      this.logger.error(`updateJob ${jobId}`, error);
      throw error;
    }
  }
}
