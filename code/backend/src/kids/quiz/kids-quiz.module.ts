import { Module } from '@nestjs/common';
import { KidsQuizController } from './kids-quiz.controller';
import { KidsQuizService } from './kids-quiz.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [KidsQuizController],
  providers: [KidsQuizService],
  exports: [KidsQuizService],
})
export class KidsQuizModule {}
