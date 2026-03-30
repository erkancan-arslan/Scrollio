import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { FeedModule } from './feed/feed.module';
import { ProfileModule } from './profile/profile.module';
import { SearchModule } from './search/search.module';
import { FriendsModule } from './friends/friends.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { FcmModule } from './fcm/fcm.module';
import { KidsModule } from './kids/kids.module';
import { DuelModule } from './duel/duel.module';
import { ClassroomModule } from './classroom/classroom.module';
import { AdminModule } from './admin/admin.module';
import { AdminKidsModule } from './admin-kids/admin-kids.module';
import { TeacherModule } from './teacher/teacher.module';
import { BilVeFethetModule } from './bil-ve-fethet/bil-ve-fethet.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    FeedModule,
    ProfileModule,
    SearchModule,
    FriendsModule,
    ConversationsModule,
    MessagesModule,
    FcmModule,
    KidsModule,
    DuelModule,
    ClassroomModule,
    AdminModule,
    AdminKidsModule,
    TeacherModule,
    BilVeFethetModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
