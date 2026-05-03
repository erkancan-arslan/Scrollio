import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { KidsDrawingVideoController } from './kids-drawing-video.controller';
import { KidsDrawingVideoJobsService } from './kids-drawing-video-jobs.service';
import { KidsDrawingVideoPipelineService } from './kids-drawing-video-pipeline.service';
import { KidsDrawingVideoTickService } from './kids-drawing-video-tick.service';
import { KidsDrawingVideoCronService } from './kids-drawing-video-cron.service';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot(), SupabaseModule, AuthModule],
  controllers: [KidsDrawingVideoController],
  providers: [
    KidsDrawingVideoJobsService,
    KidsDrawingVideoPipelineService,
    KidsDrawingVideoTickService,
    KidsDrawingVideoCronService,
  ],
  exports: [KidsDrawingVideoJobsService],
})
export class KidsDrawingVideoModule {}
