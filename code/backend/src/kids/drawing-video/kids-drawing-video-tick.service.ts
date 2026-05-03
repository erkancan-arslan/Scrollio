import { Injectable, Logger } from '@nestjs/common';
import { KidsDrawingVideoJobsService } from './kids-drawing-video-jobs.service';
import { KidsDrawingVideoPipelineService } from './kids-drawing-video-pipeline.service';

export type TickResult =
  | { status: 'not_due'; cycleDueAt: string }
  | { status: 'already_running'; jobId: string }
  | { status: 'no_drawing'; cycleDueAt: string }
  | { status: 'started'; jobId: string };

/**
 * Single-source-of-truth for "is this child due, and should we start a job?".
 * Called by both the controller (lazy-on-read from mobile) and the cron.
 */
@Injectable()
export class KidsDrawingVideoTickService {
  private readonly logger = new Logger(KidsDrawingVideoTickService.name);

  constructor(
    private readonly jobsService: KidsDrawingVideoJobsService,
    private readonly pipeline: KidsDrawingVideoPipelineService,
  ) {}

  async tickForChild(childProfileId: string, force = false): Promise<TickResult> {
    const cycle = await this.jobsService.ensureCycle(childProfileId);
    const dueAt = new Date(cycle.cycle_due_at).getTime();

    if (!force && dueAt > Date.now()) {
      return { status: 'not_due', cycleDueAt: cycle.cycle_due_at };
    }

    const active = await this.jobsService.findActiveJobForChild(childProfileId);
    if (active) {
      return { status: 'already_running', jobId: active.id };
    }

    const drawing = await this.jobsService.findLatestDrawingForChild(childProfileId);
    const sourceUrl = drawing?.mentor_image_url || drawing?.image_url || null;
    if (!drawing || !sourceUrl) {
      this.logger.log(
        `tick ${childProfileId}: no drawing yet, pushing cycle forward 48h`,
      );
      await this.jobsService.resetCycle(childProfileId, null);
      const refreshed = await this.jobsService.getCycle(childProfileId);
      return { status: 'no_drawing', cycleDueAt: refreshed?.cycle_due_at ?? cycle.cycle_due_at };
    }

    const job = await this.jobsService.createJob(childProfileId, drawing.id, sourceUrl);
    this.logger.log(`tick ${childProfileId}: started job ${job.id} (drawing ${drawing.id})`);

    // Fire-and-forget pipeline run (mirrors custom-mascot pattern)
    void this.pipeline.run(job.id, childProfileId, sourceUrl).catch((err) => {
      this.logger.error(
        `pipeline error for job ${job.id}`,
        err instanceof Error ? err.stack : err,
      );
    });

    return { status: 'started', jobId: job.id };
  }
}
