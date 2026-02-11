import { Module } from '@nestjs/common';
import { KidsVoiceController } from './kids-voice.controller';
import { KidsVoiceService } from './kids-voice.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsVoiceController],
  providers: [KidsVoiceService],
  exports: [KidsVoiceService],
})
export class KidsVoiceModule {}
