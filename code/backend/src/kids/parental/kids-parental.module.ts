import { Module } from '@nestjs/common';
import { KidsParentalController } from './kids-parental.controller';
import { KidsParentalService } from './kids-parental.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsParentalController],
  providers: [KidsParentalService],
  exports: [KidsParentalService],
})
export class KidsParentalModule {}
