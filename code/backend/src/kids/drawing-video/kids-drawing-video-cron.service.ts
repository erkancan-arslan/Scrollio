import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KidsDrawingVideoJobsService } from './kids-drawing-video-jobs.service';
import { KidsDrawingVideoTickService } from './kids-drawing-video-tick.service';

/**
 * Safety-net cron — every 10 minutes, scan children whose 48h cycle has
 * elapsed and start a job. Mobile lazy-on-read tick handles the common
 * case; this catches children whose parent never opens the app.
 */
@Injectable()
export class KidsDrawingVideoCronService {
  private readonly logger = new Logger(KidsDrawingVideoCronService.name);

  constructor(
    private readonly jobsService: KidsDrawingVideoJobsService,
    private readonly tickService: KidsDrawingVideoTickService,
  ) {}

  @Cron('*/10 * * * *', { name: 'kids-drawing-video-tick' })
  async sweep(): Promise<void> {
    let dueChildren: string[];
    try {
      dueChildren = await this.jobsService.findDueChildren(50);
    } catch (err) {
      this.logger.error('sweep: findDueChildren failed', err instanceof Error ? err.stack : err);
      return;
    }

    if (dueChildren.length === 0) return;
    this.logger.log(`sweep: ${dueChildren.length} children due`);

    for (const childId of dueChildren) {
      try {
        const result = await this.tickService.tickForChild(childId);
        this.logger.log(`sweep ${childId}: ${result.status}`);
      } catch (err) {
        this.logger.error(
          `sweep ${childId} failed`,
          err instanceof Error ? err.stack : err,
        );
      }
    }
  }
}
