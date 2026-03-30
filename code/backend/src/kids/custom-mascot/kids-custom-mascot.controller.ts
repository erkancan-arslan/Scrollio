import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentChild } from '../../auth/current-child.decorator';
import { KidsCustomMascotJobsService } from './kids-custom-mascot-jobs.service';
import { KidsCustomMascotPipelineService } from './kids-custom-mascot-pipeline.service';
import { CreateKidsCustomMascotJobDto } from './dto/create-kids-custom-mascot-job.dto';

@ApiTags('kids-custom-mascot')
@ApiBearerAuth()
@Controller('kids/custom-mascot/jobs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('parent', 'school')
export class KidsCustomMascotController {
  private readonly logger = new Logger(KidsCustomMascotController.name);

  constructor(
    private readonly jobsService: KidsCustomMascotJobsService,
    private readonly pipeline: KidsCustomMascotPipelineService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create async job: drawing → 3D-style image → 9:16 → video → merge with narration audio' })
  async create(
    @CurrentChild() childId: string | undefined,
    @Body() dto: CreateKidsCustomMascotJobDto,
    @Req() req: { user: { id: string } },
  ) {
    if (!childId?.trim()) {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
    if (!dto.imageBase64.startsWith('data:image/')) {
      throw new BadRequestException('imageBase64 must be a data URL (data:image/png;base64,...)');
    }

    const job = await this.jobsService.createJob(childId.trim(), req.user.id);

    void this.pipeline.run(job.id, dto.imageBase64, req.user.id).catch((err) => {
      this.logger.error('pipeline error', err instanceof Error ? err.stack : err);
    });

    return {
      jobId: job.id,
      status: job.status,
    };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Latest mascot job for the active child (for restoring UI after restart)' })
  async latest(@CurrentChild() childId: string | undefined, @Req() req: { user: { id: string } }) {
    if (!childId?.trim()) {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
    const row = await this.jobsService.findLatestForChild(childId.trim(), req.user.id);
    if (!row) {
      return { job: null };
    }
    return { job: this.toPublicJob(row) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Poll job status' })
  async getOne(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    const row = await this.jobsService.findOneForParent(id, req.user.id);
    return { job: this.toPublicJob(row) };
  }

  private toPublicJob(row: {
    id: string;
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
  }) {
    return {
      id: row.id,
      status: row.status,
      currentStep: row.current_step,
      progressPercent: row.progress_percent,
      mentorImageUrl: row.mentor_image_url,
      portrait9_16ImageUrl: row.portrait_9_16_image_url,
      upscaledImageUrl: row.upscaled_image_url,
      rawVideoUrl: row.raw_video_url,
      finalVideoUrl: row.final_video_url,
      narrationAudioUrl: row.narration_audio_url,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
