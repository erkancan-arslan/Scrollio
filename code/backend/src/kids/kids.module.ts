import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { KidsFeedModule } from './feed/kids-feed.module';
import { KidsQuizModule } from './quiz/kids-quiz.module';
import { KidsBookmarkModule } from './bookmark/kids-bookmark.module';
import { KidsLikeModule } from './like/kids-like.module';
import { KidsCurationModule } from './curation/kids-curation.module';
import { KidsPlaygroundModule } from './playground/kids-playground.module';
import { KidsProgressionModule } from './progression/kids-progression.module';
import { KidsProfileModule } from './profile/kids-profile.module';
import { KidsParentalModule } from './parental/kids-parental.module';
import { KidsVoiceModule } from './voice/kids-voice.module';
import { KidsChildAuthModule } from './child-auth/kids-child-auth.module';
import { KidsSettingsModule } from './settings/kids-settings.module';
import { KidsCustomMascotModule } from './custom-mascot/kids-custom-mascot.module';

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
    KidsFeedModule,
    KidsQuizModule,
    KidsBookmarkModule,
    KidsLikeModule,
    KidsCurationModule,
    KidsPlaygroundModule,
    KidsProgressionModule,
    KidsProfileModule,
    KidsParentalModule,
    KidsVoiceModule,
    KidsChildAuthModule,
    KidsSettingsModule,
    KidsCustomMascotModule,
  ],
})
export class KidsModule {}
