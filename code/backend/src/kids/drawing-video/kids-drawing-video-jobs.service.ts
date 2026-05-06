import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

export type KidsDrawingVideoJobRow = {
  id: string;
  child_profile_id: string;
  drawing_id: string | null;
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'skipped';
  current_step: string | null;
  progress_percent: number;
  source_image_url: string | null;
  stylized_image_url: string | null;
  video_url: string | null;
  pinned_until: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type KidsDrawingVideoCycleRow = {
  child_profile_id: string;
  cycle_due_at: string;
  last_generated_at: string | null;
  last_job_id: string | null;
  updated_at: string;
};

export type KidsDrawingRow = {
  id: string;
  child_profile_id: string;
  image_url: string | null;
  mentor_image_url: string | null;
  created_at: string;
};

@Injectable()
export class KidsDrawingVideoJobsService {
  private readonly logger = new Logger(KidsDrawingVideoJobsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getCycle(childProfileId: string): Promise<KidsDrawingVideoCycleRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_drawing_video_cycles')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .maybeSingle();
    if (error) {
      this.logger.error(`getCycle ${childProfileId}: ${error.message}`);
      throw error;
    }
    return (data as KidsDrawingVideoCycleRow) ?? null;
  }

  /**
   * Lazily upsert a cycle row if one doesn't exist (defensive — trigger should have done this).
   * New children start in the "ready" (expired) state — `cycle_due_at = now` — so the
   * first generation can be triggered immediately by the child without a 48h wait.
   * The 48h countdown only starts after a generation completes (see `resetCycle`).
   */
  async ensureCycle(childProfileId: string): Promise<KidsDrawingVideoCycleRow> {
    const existing = await this.getCycle(childProfileId);
    if (existing) return existing;

    const admin = this.supabaseService.getAdminClient();
    const dueAt = new Date().toISOString();
    const { data, error } = await admin
      .from('kids_drawing_video_cycles')
      .upsert({ child_profile_id: childProfileId, cycle_due_at: dueAt }, { onConflict: 'child_profile_id' })
      .select()
      .single();
    if (error || !data) {
      this.logger.error(`ensureCycle ${childProfileId}`, error);
      throw error ?? new Error('Failed to ensure cycle');
    }
    return data as KidsDrawingVideoCycleRow;
  }

  /** Push the cycle 48h forward and link the last job (if any). */
  async resetCycle(childProfileId: string, lastJobId: string | null): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const { error } = await admin
      .from('kids_drawing_video_cycles')
      .upsert(
        {
          child_profile_id: childProfileId,
          cycle_due_at: dueAt,
          last_generated_at: lastJobId ? now : null,
          last_job_id: lastJobId,
          updated_at: now,
        },
        { onConflict: 'child_profile_id' },
      );
    if (error) {
      this.logger.error(`resetCycle ${childProfileId}: ${error.message}`);
      throw error;
    }
  }

  async findActiveJobForChild(childProfileId: string): Promise<KidsDrawingVideoJobRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_drawing_video_jobs')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.error(`findActiveJobForChild ${childProfileId}: ${error.message}`);
      throw error;
    }
    return (data as KidsDrawingVideoJobRow) ?? null;
  }

  async findLatestJobForChild(childProfileId: string): Promise<KidsDrawingVideoJobRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_drawing_video_jobs')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.error(`findLatestJobForChild ${childProfileId}: ${error.message}`);
      throw error;
    }
    return (data as KidsDrawingVideoJobRow) ?? null;
  }

  async findCurrentPinnedForChild(childProfileId: string): Promise<KidsDrawingVideoJobRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await admin
      .from('kids_drawing_video_jobs')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .eq('status', 'ready')
      .gt('pinned_until', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.error(`findCurrentPinnedForChild ${childProfileId}: ${error.message}`);
      throw error;
    }
    return (data as KidsDrawingVideoJobRow) ?? null;
  }

  async findJobById(jobId: string): Promise<KidsDrawingVideoJobRow> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_drawing_video_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Drawing video job not found');
    }
    return data as KidsDrawingVideoJobRow;
  }

  async findLatestDrawingForChild(childProfileId: string): Promise<KidsDrawingRow | null> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_drawings')
      .select('id, child_profile_id, image_url, mentor_image_url, created_at')
      .eq('child_profile_id', childProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      this.logger.error(`findLatestDrawingForChild ${childProfileId}: ${error.message}`);
      throw error;
    }
    return (data as KidsDrawingRow) ?? null;
  }

  async createJob(
    childProfileId: string,
    drawingId: string | null,
    sourceImageUrl: string,
  ): Promise<KidsDrawingVideoJobRow> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_drawing_video_jobs')
      .insert({
        child_profile_id: childProfileId,
        drawing_id: drawingId,
        source_image_url: sourceImageUrl,
        status: 'queued',
        progress_percent: 0,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create kids_drawing_video_jobs row', error);
      throw error ?? new Error('Failed to create job');
    }
    return data as KidsDrawingVideoJobRow;
  }

  async updateJob(
    jobId: string,
    updates: Partial<{
      status: KidsDrawingVideoJobRow['status'];
      currentStep: string | null;
      progressPercent: number;
      stylizedImageUrl: string | null;
      videoUrl: string | null;
      pinnedUntil: string | null;
      errorMessage: string | null;
    }>,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.currentStep !== undefined) row.current_step = updates.currentStep;
    if (updates.progressPercent !== undefined) row.progress_percent = updates.progressPercent;
    if (updates.stylizedImageUrl !== undefined) row.stylized_image_url = updates.stylizedImageUrl;
    if (updates.videoUrl !== undefined) row.video_url = updates.videoUrl;
    if (updates.pinnedUntil !== undefined) row.pinned_until = updates.pinnedUntil;
    if (updates.errorMessage !== undefined) row.error_message = updates.errorMessage;

    const { error } = await admin
      .from('kids_drawing_video_jobs')
      .update(row)
      .eq('id', jobId);
    if (error) {
      this.logger.error(`updateJob ${jobId}: ${error.message}`);
      throw error;
    }
  }

  /** Children whose cycle is due and who don't currently have an active job. */
  async findDueChildren(limit = 50): Promise<string[]> {
    const admin = this.supabaseService.getAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await admin
      .from('kids_drawing_video_cycles')
      .select('child_profile_id')
      .lte('cycle_due_at', nowIso)
      .order('cycle_due_at', { ascending: true })
      .limit(limit);
    if (error) {
      this.logger.error(`findDueChildren: ${error.message}`);
      throw error;
    }
    return (data ?? []).map((r: { child_profile_id: string }) => r.child_profile_id);
  }
}
