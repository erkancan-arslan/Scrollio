import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { KidsGenerationJobsService } from './kids-generation-jobs.service';
import { KidsGenerationOrchestratorService } from './kids-generation-orchestrator.service';
import { JobLogsService } from '../../admin/logs/job-logs.service';
import { CreateKidsGenerationJobDto } from '../dto/create-kids-generation-job.dto';
import { GenerationJobQueryDto } from '../../admin/generation-jobs/dto/generation-job-query.dto';
import { CreateKidsVideoBundleDto } from './dto/create-kids-video-bundle.dto';

@ApiTags('admin-kids')
@ApiBearerAuth()
@Controller('admin/kids/generation-jobs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class KidsGenerationJobsController {
  constructor(
    private readonly service: KidsGenerationJobsService,
    private readonly orchestrator: KidsGenerationOrchestratorService,
    private readonly logsService: JobLogsService,
  ) {}

  /** One lesson × all mascot base videos (shared script, per-mascot TTS voice + merge). */
  @Post('bundle')
  createBundle(@Body() dto: CreateKidsVideoBundleDto, @Req() req: any) {
    return this.service.createMascotBundle(dto, req.user.id);
  }

  @Post('groups/:groupId/start')
  startMascotGroup(@Param('groupId') groupId: string) {
    this.orchestrator.runMascotGroupPipeline(groupId).catch(() => {});
    return { message: 'Kids mascot bundle pipeline started', groupId };
  }

  @Post()
  create(@Body() dto: CreateKidsGenerationJobDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get()
  findAll(@Query() query: GenerationJobQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/start')
  async start(@Param('id') id: string) {
    const job = await this.service.findOne(id);
    this.orchestrator.runPipeline(job.id).catch(() => {});
    return { message: 'Job started', jobId: job.id };
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string) {
    return this.logsService.getLogsForJob(id);
  }

  @Post(':id/retry')
  async retry(@Param('id') id: string) {
    const job = await this.service.findOne(id);
    await this.service.updateStatus(id, {
      status: 'queued',
      errorMessage: null as any,
      progressPercent: 0,
      currentStep: null as any,
    });
    this.orchestrator.runPipeline(job.id).catch(() => {});
    return { message: 'Job retried', jobId: job.id };
  }
}
