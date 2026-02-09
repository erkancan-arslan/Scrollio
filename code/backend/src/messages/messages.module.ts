import { Module } from '@nestjs/common';
import { MessagesController, MessageActionsController } from './messages.controller';
import { MessagesService } from './messages.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [MessagesController, MessageActionsController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
