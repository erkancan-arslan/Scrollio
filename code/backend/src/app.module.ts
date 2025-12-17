import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { FeedModule } from './feed/feed.module';
import { ProfileModule } from './profile/profile.module';
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
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
