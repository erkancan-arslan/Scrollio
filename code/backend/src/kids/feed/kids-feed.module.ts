import { Module } from '@nestjs/common';
import { KidsFeedController } from './kids-feed.controller';
import { KidsFeedService } from './kids-feed.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsFeedController],
  providers: [KidsFeedService],
  exports: [KidsFeedService],
})
export class KidsFeedModule {}
