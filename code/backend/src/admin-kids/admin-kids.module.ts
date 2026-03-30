import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';

import { ScriptGenerationService } from '../admin/ai/script-generation.service';
import { TtsService } from '../admin/ai/tts.service';
import { ThumbnailService } from '../admin/ai/thumbnail.service';
import { TopicSuggestionService } from '../admin/ai/topic-suggestion.service';
import { ReferenceVideosService } from '../admin/reference-videos/reference-videos.service';
import { GeneratedVideosService } from '../admin/generated-videos/generated-videos.service';
import { FeedPublishingService } from '../admin/feeds/feed-publishing.service';
import { JobLogsService } from '../admin/logs/job-logs.service';

import { KidsGenerationJobsController } from './kids-generation-jobs/kids-generation-jobs.controller';
import { KidsGenerationJobsService } from './kids-generation-jobs/kids-generation-jobs.service';
import { KidsGenerationOrchestratorService } from './kids-generation-jobs/kids-generation-orchestrator.service';
import { KidsBatchJobsController } from './kids-batch-jobs/kids-batch-jobs.controller';
import { KidsBatchJobsService } from './kids-batch-jobs/kids-batch-jobs.service';
import { AudioVideoMergeService } from './merge/audio-video-merge.service';
import { KidsVoiceService } from './kids-voice.service';
import { KidsTopicsAdminController } from './kids-topics/kids-topics-admin.controller';
import { KidsTopicsAdminService } from './kids-topics/kids-topics-admin.service';

/**
 * Kids-module video generation: cloned pipelines (single job + batch), scoped to content_target = kids.
 * Reuses AI + storage services from admin (separate Nest provider instances).
 */
@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [KidsGenerationJobsController, KidsBatchJobsController, KidsTopicsAdminController],
  providers: [
    ScriptGenerationService,
    TtsService,
    ThumbnailService,
    TopicSuggestionService,
    ReferenceVideosService,
    GeneratedVideosService,
    FeedPublishingService,
    JobLogsService,
    KidsGenerationJobsService,
    KidsBatchJobsService,
    KidsGenerationOrchestratorService,
    AudioVideoMergeService,
    KidsVoiceService,
    KidsTopicsAdminService,
  ],
})
export class AdminKidsModule {}
