import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KidsParentalController } from './kids-parental.controller';
import { KidsParentalService } from './kids-parental.service';
import { KidsParentalReportService } from './kids-parental-report.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { FcmModule } from '../../fcm/fcm.module';

@Module({
  imports: [ScheduleModule.forRoot(), SupabaseModule, AuthModule, FcmModule],
  controllers: [KidsParentalController],
  providers: [KidsParentalService, KidsParentalReportService],
  exports: [KidsParentalService],
})
export class KidsParentalModule {}
