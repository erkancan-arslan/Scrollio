import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../../supabase/supabase.module';
import { BunnyCdnModule } from '../../bunnycdn/bunnycdn.module';
import { KidsCustomMascotController } from './kids-custom-mascot.controller';
import { KidsCustomMascotJobsService } from './kids-custom-mascot-jobs.service';
import { KidsCustomMascotPipelineService } from './kids-custom-mascot-pipeline.service';
import { AudioVideoMergeService } from '../../admin-kids/merge/audio-video-merge.service';

@Module({
  imports: [SupabaseModule, ConfigModule, BunnyCdnModule],
  controllers: [KidsCustomMascotController],
  providers: [KidsCustomMascotJobsService, KidsCustomMascotPipelineService, AudioVideoMergeService],
})
export class KidsCustomMascotModule {}
