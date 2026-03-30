import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { KidsBatchJobsService } from './kids-batch-jobs.service';
import { KidsGenerationOrchestratorService } from '../kids-generation-jobs/kids-generation-orchestrator.service';
import { CreateKidsBatchJobDto } from './dto/create-kids-batch-job.dto';
import { OptionalApproveTopicsDto } from './dto/optional-approve-topics.dto';
import { ApproveTopicsDto } from '../../admin/batch-jobs/dto/approve-topics.dto';
import { ApproveScriptDto } from '../../admin/batch-jobs/dto/approve-script.dto';

@ApiTags('admin-kids')
@ApiBearerAuth()
@Controller('admin/kids/batch-jobs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class KidsBatchJobsController {
  constructor(
    private readonly batchService: KidsBatchJobsService,
    private readonly orchestrator: KidsGenerationOrchestratorService,
  ) {}

  /**
   * Create batch: videoCount lesson angles × each mascot reference (typically ×3 jobs per angle).
   */
  @Post()
  create(@Body() dto: CreateKidsBatchJobDto, @Req() req: any) {
    return this.batchService.createBatch(dto, req.user.id);
  }

  @Get()
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.batchService.findAll(limit, offset);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchService.findOne(id);
  }

  /**
   * Optional: edit per-job title/topic, then run the full pipeline for every job (script → TTS → merge → thumbnail → publish).
   * Body can be empty `{}` to use suggested topics as-is.
   */
  @Post(':id/start-pipeline')
  async startPipeline(@Param('id') id: string, @Body() dto?: OptionalApproveTopicsDto) {
    return this.kickFullBatchPipeline(id, dto);
  }

  /** @deprecated Use POST :id/start-pipeline — same behavior (full pipeline for all jobs). */
  @Post(':id/generate-scripts')
  async generateScripts(@Param('id') id: string, @Body() dto?: OptionalApproveTopicsDto) {
    return this.kickFullBatchPipeline(id, dto);
  }

  /** @deprecated Use POST :id/start-pipeline — kept for existing clients. */
  @Post(':id/approve-topics')
  async approveTopicsLegacy(@Param('id') id: string, @Body() dto: ApproveTopicsDto) {
    return this.kickFullBatchPipeline(id, dto.jobs?.length ? { jobs: dto.jobs } : undefined);
  }

  private async kickFullBatchPipeline(batchId: string, dto?: OptionalApproveTopicsDto) {
    if (dto?.jobs?.length) {
      await this.batchService.applyApprovedTopics(batchId, { jobs: dto.jobs });
    }

    const allJobIds = await this.batchService.getJobIdsForBatch(batchId);

    await this.batchService.updateBatchStatus(batchId, 'running');

    this.orchestrator
      .runBatchPipeline(batchId, allJobIds)
      .finally(() => this.batchService.updateBatchProgress(batchId).catch(() => {}));

    return {
      message: 'Pipeline started for all jobs',
      batchId,
      jobCount: allJobIds.length,
    };
  }

  @Get(':id/scripts')
  getScripts(@Param('id') id: string) {
    return this.batchService.getScripts(id);
  }

  @Post(':id/approve-script/:jobId')
  async approveScript(
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Body() dto: ApproveScriptDto,
  ) {
    await this.batchService.markScriptApproved(jobId, dto.script);
    await this.batchService.updateBatchStatus(id, 'running');

    this.orchestrator
      .runVideoFromApprovedScript(jobId)
      .finally(() => {
        this.batchService.updateBatchProgress(id).catch(() => {});
      })
      .catch(() => {});

    return { message: 'Script approved, generating video', batchId: id, jobId };
  }
}
