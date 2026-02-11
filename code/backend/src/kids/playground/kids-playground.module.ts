import { Module } from '@nestjs/common';
import { KidsPlaygroundController } from './kids-playground.controller';
import { KidsPlaygroundService } from './kids-playground.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsPlaygroundController],
  providers: [KidsPlaygroundService],
  exports: [KidsPlaygroundService],
})
export class KidsPlaygroundModule {}
