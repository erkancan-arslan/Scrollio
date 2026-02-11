import { Module } from '@nestjs/common';
import { KidsSettingsController } from './kids-settings.controller';
import { KidsSettingsService } from './kids-settings.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsSettingsController],
  providers: [KidsSettingsService],
  exports: [KidsSettingsService],
})
export class KidsSettingsModule {}
