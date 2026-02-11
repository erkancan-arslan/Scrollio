import { Module } from '@nestjs/common';
import { KidsChildAuthController } from './kids-child-auth.controller';
import { KidsChildAuthService } from './kids-child-auth.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsChildAuthController],
  providers: [KidsChildAuthService],
  exports: [KidsChildAuthService],
})
export class KidsChildAuthModule {}
