import { Module } from '@nestjs/common';
import { KidsProgressionController } from './kids-progression.controller';
import { KidsProgressionService } from './kids-progression.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsProgressionController],
  providers: [KidsProgressionService],
  exports: [KidsProgressionService],
})
export class KidsProgressionModule {}
