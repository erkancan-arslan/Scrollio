import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';

import { ReferenceVideosController } from './reference-videos/reference-videos.controller';
import { ReferenceVideosService } from './reference-videos/reference-videos.service';

import { GenerationJobsController } from './generation-jobs/generation-jobs.controller';
import { GenerationJobsService } from './generation-jobs/generation-jobs.service';
import { GenerationOrchestratorService } from './generation-jobs/generation-orchestrator.service';

import { GeneratedVideosController } from './generated-videos/generated-videos.controller';
import { GeneratedVideosService } from './generated-videos/generated-videos.service';

import { ScriptGenerationService } from './ai/script-generation.service';
import { TtsService } from './ai/tts.service';
import { LipsyncService } from './ai/lipsync.service';

import { FeedPublishingService } from './feeds/feed-publishing.service';
import { JobLogsService } from './logs/job-logs.service';
import { AdminStorageService } from './storage/admin-storage.service';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [
    ReferenceVideosController,
    GenerationJobsController,
    GeneratedVideosController,
  ],
  providers: [
    ReferenceVideosService,
    GenerationJobsService,
    GenerationOrchestratorService,
    GeneratedVideosService,
    ScriptGenerationService,
    TtsService,
    LipsyncService,
    FeedPublishingService,
    JobLogsService,
    AdminStorageService,
  ],
  exports: [
    ReferenceVideosService,
    GenerationJobsService,
    GeneratedVideosService,
    FeedPublishingService,
  ],
})
export class AdminModule {}
