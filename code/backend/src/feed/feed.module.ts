import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { QuizController } from './quiz/quiz.controller';
import { QuizService } from './quiz/quiz.service';
import { ScrollioCoinsService } from './scrollio-coins.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [FeedController, QuizController],
  providers: [FeedService, QuizService, ScrollioCoinsService],
  exports: [FeedService],
})
export class FeedModule {}
