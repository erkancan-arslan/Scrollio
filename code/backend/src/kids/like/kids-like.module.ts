import { Module } from '@nestjs/common';
import { KidsLikeController } from './kids-like.controller';
import { KidsLikeService } from './kids-like.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsLikeController],
  providers: [KidsLikeService],
  exports: [KidsLikeService],
})
export class KidsLikeModule {}
