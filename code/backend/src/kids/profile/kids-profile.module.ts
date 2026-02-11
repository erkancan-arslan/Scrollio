import { Module } from '@nestjs/common';
import { KidsProfileController } from './kids-profile.controller';
import { KidsProfileService } from './kids-profile.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsProfileController],
  providers: [KidsProfileService],
  exports: [KidsProfileService],
})
export class KidsProfileModule {}
