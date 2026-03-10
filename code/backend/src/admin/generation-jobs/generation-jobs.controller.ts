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
import { GenerationJobsService } from './generation-jobs.service';
import { GenerationOrchestratorService } from './generation-orchestrator.service';
import { JobLogsService } from '../logs/job-logs.service';
import { CreateGenerationJobDto } from './dto/create-generation-job.dto';
import { GenerationJobQueryDto } from './dto/generation-job-query.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/generation-jobs')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class GenerationJobsController {
  constructor(
    private readonly service: GenerationJobsService,
    private readonly orchestrator: GenerationOrchestratorService,
    private readonly logsService: JobLogsService,
  ) {}

  @Post()
  create(@Body() dto: CreateGenerationJobDto, @Req() req: any) {
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
    this.orchestrator.runPipeline(job.id).catch((err) => {
      /* logged inside orchestrator */
    });
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
    this.orchestrator.runPipeline(job.id).catch((err) => {
      /* logged inside orchestrator */
    });
    return { message: 'Job retried', jobId: job.id };
  }
}
