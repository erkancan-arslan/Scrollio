import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { KidsDrawingVideoJobsService, KidsDrawingVideoJobRow } from './kids-drawing-video-jobs.service';
import { KidsDrawingVideoTickService } from './kids-drawing-video-tick.service';

type PublicJob = {
  id: string;
  status: KidsDrawingVideoJobRow['status'];
  currentStep: string | null;
  progressPercent: number;
  videoUrl: string | null;
  pinnedUntil: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

function toPublicJob(row: KidsDrawingVideoJobRow): PublicJob {
  return {
    id: row.id,
    status: row.status,
    currentStep: row.current_step,
    progressPercent: row.progress_percent,
    videoUrl: row.video_url,
    pinnedUntil: row.pinned_until,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@ApiTags('kids-drawing-videos')
@ApiBearerAuth()
@Controller('kids/drawing-videos')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsDrawingVideoController {
  private readonly logger = new Logger(KidsDrawingVideoController.name);

  constructor(
    private readonly jobsService: KidsDrawingVideoJobsService,
    private readonly tickService: KidsDrawingVideoTickService,
  ) {}

  @Get('cycle-status')
  @ApiOperation({
    summary: 'Countdown UI feed: cycle due time, latest pinned video, latest job status',
  })
  async cycleStatus(@CurrentChild() childId: string | undefined) {
    if (!childId?.trim()) {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
    const trimmed = childId.trim();

    const cycle = await this.jobsService.ensureCycle(trimmed);
    const [pinned, latestJob] = await Promise.all([
      this.jobsService.findCurrentPinnedForChild(trimmed),
      this.jobsService.findLatestJobForChild(trimmed),
    ]);

    return {
      serverNow: new Date().toISOString(),
      cycleDueAt: cycle.cycle_due_at,
      lastGeneratedAt: cycle.last_generated_at,
      pinnedVideoUrl: pinned?.video_url ?? null,
      pinnedUntil: pinned?.pinned_until ?? null,
      latestJob: latestJob ? toPublicJob(latestJob) : null,
    };
  }

  @Post('tick')
  @ApiOperation({ summary: 'Lazy-on-read tick: start a job if the cycle is due' })
  async tick(@CurrentChild() childId: string | undefined) {
    if (!childId?.trim()) {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
    const result = await this.tickService.tickForChild(childId.trim());
    return result;
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Poll a specific drawing video job' })
  async getJob(
    @CurrentChild() childId: string | undefined,
    @Param('id') id: string,
  ) {
    if (!childId?.trim()) {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
    const row = await this.jobsService.findJobById(id);
    if (row.child_profile_id !== childId.trim()) {
      throw new NotFoundException('Drawing video job not found');
    }
    return { job: toPublicJob(row) };
  }

  /**
   * Local-only debug endpoint — bypass the 48h check and start a job immediately.
   * Disabled in production to avoid abuse.
   */
  @Post('debug/force-tick')
  @ApiOperation({ summary: 'Force-start a job ignoring the 48h cycle (non-production only)' })
  async forceTick(@CurrentChild() childId: string | undefined) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    if (!childId?.trim()) {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
    const result = await this.tickService.tickForChild(childId.trim(), true);
    this.logger.warn(`force-tick ${childId}: ${result.status}`);
    return result;
  }
}
