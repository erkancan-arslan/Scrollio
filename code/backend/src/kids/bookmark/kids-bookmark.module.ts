import { Module } from '@nestjs/common';
import { KidsBookmarkController } from './kids-bookmark.controller';
import { KidsBookmarkService } from './kids-bookmark.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsBookmarkController],
  providers: [KidsBookmarkService],
  exports: [KidsBookmarkService],
})
export class KidsBookmarkModule {}
