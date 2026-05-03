import { Module } from '@nestjs/common';
import { KidsFeedController } from './kids-feed.controller';
import { KidsFeedService } from './kids-feed.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { KidsDrawingVideoModule } from '../drawing-video/kids-drawing-video.module';

@Module({
  imports: [SupabaseModule, AuthModule, KidsDrawingVideoModule],
  controllers: [KidsFeedController],
  providers: [KidsFeedService],
  exports: [KidsFeedService],
})
export class KidsFeedModule {}
