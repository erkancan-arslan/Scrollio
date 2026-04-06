import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { BunnyCdnService } from '../bunnycdn/bunnycdn.service';

export interface MigrationResult {
  lessonId: string;
  title: string;
  slidesProcessed: number;
  audioMigrated: number;
  videoMigrated: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class LessonCdnMigrationService {
  private readonly logger = new Logger(LessonCdnMigrationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly bunnyCdnService: BunnyCdnService,
  ) {}

  /**
   * Returns true if a URL already lives on BunnyCDN (by checking the pull zone domain).
   */
  private isBunnyCdnUrl(url: string): boolean {
    const pullZoneDomain = this.configService.get<string>('BUNNY_CDN_DOMAIN') || '';
    if (!pullZoneDomain || !url) return false;
    const clean = pullZoneDomain.replace(/\/$/, '');
    return url.includes(clean);
  }

  /**
   * Migrate all published lessons that contain slides with non-BunnyCDN media URLs.
   */
  async migrateAllLessons(): Promise<{
    total: number;
    migrated: number;
    alreadyCurrent: number;
    results: MigrationResult[];
  }> {
    const admin = this.supabaseService.getAdminClient();

    // Fetch all published lessons that have slides_data
    const { data: lessons, error } = await admin
      .from('teacher_lessons')
      .select('id, title, slides_data')
      .eq('status', 'published')
      .not('slides_data', 'is', null);

    if (error) {
      this.logger.error(`Failed to fetch lessons: ${error.message}`);
      throw error;
    }

    const results: MigrationResult[] = [];
    let migrated = 0;
    let alreadyCurrent = 0;

    for (const lesson of lessons ?? []) {
      const result = await this.migrateSingleLesson(lesson.id, lesson.title, lesson.slides_data);
      results.push(result);

      if (result.audioMigrated + result.videoMigrated > 0) {
        migrated++;
      } else {
        alreadyCurrent++;
      }
    }

    return {
      total: lessons?.length ?? 0,
      migrated,
      alreadyCurrent,
      results,
    };
  }

  /**
   * Migrate a single lesson's slides_data to BunnyCDN.
   */
  async migrateSingleLesson(
    lessonId: string,
    title: string,
    slidesData: any[],
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      lessonId,
      title,
      slidesProcessed: 0,
      audioMigrated: 0,
      videoMigrated: 0,
      skipped: 0,
      errors: [],
    };

    if (!Array.isArray(slidesData) || slidesData.length === 0) {
      this.logger.log(`Lesson ${lessonId} has no slides — skipping`);
      return result;
    }

    const updatedSlides = [...slidesData];
    let anyChange = false;

    for (let i = 0; i < updatedSlides.length; i++) {
      const slide = { ...updatedSlides[i] };
      result.slidesProcessed++;

      // --- Audio ---
      if (slide.audioUrl && !this.isBunnyCdnUrl(slide.audioUrl)) {
        try {
          this.logger.log(`[${lessonId}] Migrating audio slide ${i}: ${slide.audioUrl.slice(0, 80)}...`);
          slide.audioUrl = await this.bunnyCdnService.uploadFromUrl(
            slide.audioUrl,
            `classroom-lessons/${lessonId}/audio-slide-${i}.mp4`,
            'audio/mp4',
          );
          result.audioMigrated++;
          anyChange = true;
          this.logger.log(`[${lessonId}] Audio slide ${i} → ${slide.audioUrl}`);
        } catch (err: any) {
          const msg = `Audio slide ${i} upload failed: ${err.message}`;
          this.logger.warn(`[${lessonId}] ${msg}`);
          result.errors.push(msg);
        }
      } else if (slide.audioUrl) {
        result.skipped++;
      }

      // --- Video ---
      if (slide.videoUrl && !this.isBunnyCdnUrl(slide.videoUrl)) {
        try {
          this.logger.log(`[${lessonId}] Migrating video slide ${i}: ${slide.videoUrl.slice(0, 80)}...`);
          slide.videoUrl = await this.bunnyCdnService.uploadFromUrl(
            slide.videoUrl,
            `classroom-lessons/${lessonId}/video-slide-${i}.mp4`,
            'video/mp4',
          );
          result.videoMigrated++;
          anyChange = true;
          this.logger.log(`[${lessonId}] Video slide ${i} → ${slide.videoUrl}`);
        } catch (err: any) {
          const msg = `Video slide ${i} upload failed: ${err.message}`;
          this.logger.warn(`[${lessonId}] ${msg}`);
          result.errors.push(msg);
        }
      } else if (slide.videoUrl) {
        result.skipped++;
      }

      updatedSlides[i] = slide;
    }

    // Only write back to DB if something actually changed
    if (anyChange) {
      const admin = this.supabaseService.getAdminClient();
      const { error: updateError } = await admin
        .from('teacher_lessons')
        .update({ slides_data: updatedSlides, updated_at: new Date().toISOString() })
        .eq('id', lessonId);

      if (updateError) {
        const msg = `DB update failed: ${updateError.message}`;
        this.logger.error(`[${lessonId}] ${msg}`);
        result.errors.push(msg);
      } else {
        this.logger.log(
          `[${lessonId}] Saved — audio migrated: ${result.audioMigrated}, video migrated: ${result.videoMigrated}`,
        );
      }
    } else {
      this.logger.log(`[${lessonId}] All slides already on BunnyCDN — nothing to do`);
    }

    return result;
  }

  /**
   * Migrate all teacher reference videos to BunnyCDN.
   */
  async migrateAllReferenceVideos() {
    const admin = this.supabaseService.getAdminClient();

    const { data: profiles, error } = await admin
      .from('teacher_profiles')
      .select('id, name, reference_video_url')
      .eq('reference_video_status', 'ready')
      .not('reference_video_url', 'is', null);

    if (error) {
      this.logger.error(`Failed to fetch teacher profiles: ${error.message}`);
      throw error;
    }

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const profile of profiles ?? []) {
      if (!profile.reference_video_url || this.isBunnyCdnUrl(profile.reference_video_url)) {
        skipped++;
        continue;
      }

      this.logger.log(`Migrating reference video for teacher ${profile.id}...`);
      try {
        const storagePath = `teachers/${profile.id}/${Date.now()}-migrated-reference.mp4`;
        const newUrl = await this.bunnyCdnService.uploadFromUrl(
          profile.reference_video_url,
          storagePath,
          'video/mp4'
        );

        const { error: updateError } = await admin
          .from('teacher_profiles')
          .update({
            reference_video_url: newUrl,
            reference_video_storage_path: storagePath,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;

        migrated++;
        this.logger.log(`Successfully migrated teacher ${profile.id} -> ${newUrl}`);
      } catch (err: any) {
        failed++;
        this.logger.error(`Failed to migrate teacher ${profile.id}: ${err.message}`);
      }
    }

    return { total: (profiles ?? []).length, migrated, skipped, failed };
  }
}
