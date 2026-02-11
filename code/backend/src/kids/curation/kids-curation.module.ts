import { Module } from '@nestjs/common';
import { KidsCurationController } from './kids-curation.controller';
import { KidsCurationService } from './kids-curation.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsCurationController],
  providers: [KidsCurationService],
  exports: [KidsCurationService],
})
export class KidsCurationModule {}
