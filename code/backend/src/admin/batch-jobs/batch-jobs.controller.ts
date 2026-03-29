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
import { BatchJobsService } from './batch-jobs.service';
import { GenerationOrchestratorService } from '../generation-jobs/generation-orchestrator.service';
import { CreateBatchJobDto } from './dto/create-batch-job.dto';
import { ApproveTopicsDto } from './dto/approve-topics.dto';
import { ApproveScriptDto } from './dto/approve-script.dto';
import { ApproveAndSuggestNextDto } from './dto/approve-and-suggest-next.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/batch-jobs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class BatchJobsController {
  constructor(
    private readonly batchService: BatchJobsService,
    private readonly orchestrator: GenerationOrchestratorService,
  ) {}

  /**
   * Create batch + immediately get 5 beginner topic suggestions from the LLM.
   * Returns { batch, jobs } where jobs are the 5 beginner job records.
   */
  @Post()
  create(@Body() dto: CreateBatchJobDto, @Req() req: any) {
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
   * User has approved the current difficulty's topics.
   * Saves them, then uses them as context to suggest the next difficulty's topics.
   * Returns { nextDifficulty, jobs } — the next level's 5 jobs with suggestions.
   */
  @Post(':id/approve-and-suggest-next')
  approveAndSuggestNext(
    @Param('id') id: string,
    @Body() dto: ApproveAndSuggestNextDto,
  ) {
    return this.batchService.approveAndSuggestNext(id, dto);
  }

  /**
   * User has approved all three levels (final step: advanced).
   * Saves the advanced topics, then kicks off script generation for ALL 15 jobs.
   */
  @Post(':id/approve-topics')
  async approveTopics(@Param('id') id: string, @Body() dto: ApproveTopicsDto) {
    // Save the final (advanced) topics
    await this.batchService.applyApprovedTopics(id, dto);

    // Generate scripts for ALL 15 jobs (beginner + intermediate already saved earlier)
    const allJobIds = await this.batchService.getJobIdsForBatch(id);

    this.orchestrator
      .generateScriptsForBatch(allJobIds)
      .then(() => this.batchService.updateBatchStatus(id, 'pending_scripts'))
      .catch(() => {
        this.batchService.updateBatchStatus(id, 'failed').catch(() => {});
      });

    return { message: 'Topics approved, generating scripts', batchId: id, jobCount: allJobIds.length };
  }

  /** Poll this endpoint to retrieve generated scripts once ready */
  @Get(':id/scripts')
  getScripts(@Param('id') id: string) {
    return this.batchService.getScripts(id);
  }

  /**
   * User approves (and optionally edits) the script for one job.
   * Fires TTS → lipsync → thumbnail → publish pipeline for that job.
   */
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
