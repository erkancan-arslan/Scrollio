import { Injectable, Logger } from '@nestjs/common';
import { KidsDrawingVideoJobsService } from './kids-drawing-video-jobs.service';
import { KidsDrawingVideoTickService } from './kids-drawing-video-tick.service';

/**
 * Drawing-video generation is strictly child-initiated — the kid taps the
 * "Click to create your video" pill in the overlay. The cron is disabled so
 * the backend never starts a job behind the user's back. Kept as a no-op
 * service to preserve module wiring; remove module registration to delete.
 */
@Injectable()
export class KidsDrawingVideoCronService {
  private readonly logger = new Logger(KidsDrawingVideoCronService.name);

  constructor(
    private readonly jobsService: KidsDrawingVideoJobsService,
    private readonly tickService: KidsDrawingVideoTickService,
  ) {}

  async sweep(): Promise<void> {
    // Intentionally a no-op. See class doc.
  }
}
