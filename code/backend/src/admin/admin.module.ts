import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { BunnyCdnModule } from '../bunnycdn/bunnycdn.module';

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
import { ThumbnailService } from './ai/thumbnail.service';
import { VideoCompositionService } from './ai/video-composition.service';
import { TopicSuggestionService } from './ai/topic-suggestion.service';

import { FeedPublishingService } from './feeds/feed-publishing.service';
import { JobLogsService } from './logs/job-logs.service';
import { AdminStorageService } from './storage/admin-storage.service';

import { BatchJobsController } from './batch-jobs/batch-jobs.controller';
import { BatchJobsService } from './batch-jobs/batch-jobs.service';

@Module({
  imports: [SupabaseModule, ConfigModule, BunnyCdnModule],
  controllers: [
    ReferenceVideosController,
    GenerationJobsController,
    GeneratedVideosController,
    BatchJobsController,
  ],
  providers: [
    ReferenceVideosService,
    GenerationJobsService,
    GenerationOrchestratorService,
    GeneratedVideosService,
    ScriptGenerationService,
    TtsService,
    LipsyncService,
    ThumbnailService,
    VideoCompositionService,
    TopicSuggestionService,
    FeedPublishingService,
    JobLogsService,
    AdminStorageService,
    BatchJobsService,
  ],
  exports: [
    ReferenceVideosService,
    GenerationJobsService,
    GeneratedVideosService,
    FeedPublishingService,
  ],
})
export class AdminModule {}
