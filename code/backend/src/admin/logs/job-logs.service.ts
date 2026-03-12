import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JobLogsService {
  private readonly logger = new Logger(JobLogsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async log(
    jobId: string,
    stepName: string,
    status: string,
    message: string,
    payload?: Record<string, unknown>,
  ) {
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.from('generation_job_logs').insert({
      job_id: jobId,
      step_name: stepName,
      status,
      message,
      payload: payload || null,
    });

    if (error) {
      this.logger.error(`Failed to log step ${stepName} for job ${jobId}`, error);
    }
  }

  async getLogsForJob(jobId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('generation_job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch logs for job ${jobId}`, error);
      throw error;
    }
    return data ?? [];
  }
}
