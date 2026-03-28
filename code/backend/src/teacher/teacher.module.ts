import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminModule } from '../admin/admin.module';

import { TeacherAuthController } from './teacher-auth.controller';
import { TeacherAuthService } from './teacher-auth.service';

import { TeacherProfileController } from './teacher-profile.controller';
import { TeacherProfileService } from './teacher-profile.service';

import { ClassroomTeacherController } from './classroom.controller';
import { ClassroomTeacherService } from './classroom.service';

import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonOrchestratorService } from './lesson-orchestrator.service';

import { KidsClassroomController } from './kids-classroom.controller';

import { TtsService } from '../admin/ai/tts.service';
import { LipsyncService } from '../admin/ai/lipsync.service';

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [
    TeacherAuthController,
    TeacherProfileController,
    ClassroomTeacherController,
    LessonController,
    KidsClassroomController,
  ],
  providers: [
    TeacherAuthService,
    TeacherProfileService,
    ClassroomTeacherService,
    LessonService,
    LessonOrchestratorService,
    TtsService,
    LipsyncService,
  ],
  exports: [LessonService, ClassroomTeacherService],
})
export class TeacherModule {}
