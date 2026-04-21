import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class FeedPublishingService {
  private readonly logger = new Logger(FeedPublishingService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async publish(generatedVideoId: string, contentTarget: string) {
    if (!['core', 'kids'].includes(contentTarget)) {
      throw new BadRequestException(`Invalid content target: ${contentTarget}`);
    }

    const admin = this.supabaseService.getAdminClient();

    // Fetch the generated video details along with the job
    const { data: genVideo, error: gvError } = await admin
      .from('generated_videos')
      .select('*, generated_video_jobs(*)')
      .eq('id', generatedVideoId)
      .single();

    if (gvError || !genVideo) {
      this.logger.error('Generated video not found for publishing', gvError);
      throw new BadRequestException('Generated video not found');
    }

    // --- Insert into feed_items (admin tracking) ---
    const { data: existing } = await admin
      .from('feed_items')
      .select('id')
      .eq('generated_video_id', generatedVideoId)
      .eq('feed_type', contentTarget)
      .single();

    if (existing) {
      const { data, error } = await admin
        .from('feed_items')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to re-publish feed item', error);
        throw error;
      }
    } else {
      const { error } = await admin
        .from('feed_items')
        .insert({
          generated_video_id: generatedVideoId,
          feed_type: contentTarget,
          is_published: true,
          published_at: new Date().toISOString(),
        });

      if (error) {
        this.logger.error('Failed to publish to feed_items', error);
        throw error;
      }
    }

    // --- Also insert into the `videos` table so Core feed picks it up ---
    if (contentTarget === 'core') {
      await this.publishToCoreVideosTable(admin, genVideo);
    }

    if (contentTarget === 'kids') {
      await this.publishToKidsContentTable(admin, genVideo);
    }

    this.logger.log(`Published video ${generatedVideoId} to ${contentTarget} feed`);
    return { id: generatedVideoId, published: true };
  }

  private async publishToCoreVideosTable(admin: any, genVideo: any) {
    const { data: existingVideo } = await admin
      .from('videos')
      .select('id')
      .eq('source_generated_video_id', genVideo.id)
      .maybeSingle();

    if (existingVideo) {
      await admin
        .from('videos')
        .update({ is_published: true, moderation_status: 'approved' })
        .eq('id', existingVideo.id);
      this.logger.log(`Re-published existing core video ${existingVideo.id}`);
      return;
    }

    const job = genVideo.generated_video_jobs;
    const durationSeconds = job?.duration_target_seconds || 60;

    const videoRecord: Record<string, any> = {
      title: genVideo.title,
      description: genVideo.script?.slice(0, 500) || genVideo.topic || '',
      video_url: genVideo.video_url,
      thumbnail_url: genVideo.thumbnail_url || null,
      duration: durationSeconds,
      difficulty_level: genVideo.difficulty || job?.difficulty || 'beginner',
      tags: [genVideo.topic, genVideo.language].filter(Boolean),
      topic: genVideo.topic || null,
      is_published: true,
      moderation_status: 'approved',
      source_generated_video_id: genVideo.id,
      quiz_questions: Array.isArray(genVideo.quiz_questions) ? genVideo.quiz_questions : [],
    };

    const { data, error } = await admin
      .from('videos')
      .insert(videoRecord)
      .select()
      .single();

    if (error) {
      this.logger.warn(
        `Could not insert into videos table (non-blocking): ${error.message}. ` +
        `The video may be missing 'source_generated_video_id' column. ` +
        `Run the latest migration to add it.`,
      );
      // Fallback: try without the source tracking column (and without
      // quiz_questions in case the latest migration hasn't been applied).
      delete videoRecord.source_generated_video_id;
      delete videoRecord.quiz_questions;
      const { error: fallbackError } = await admin.from('videos').insert(videoRecord);
      if (fallbackError) {
        this.logger.error('Fallback insert into videos also failed', fallbackError);
      } else {
        this.logger.log('Inserted into videos table (without source tracking)');
      }
      return;
    }

    this.logger.log(`Inserted admin-generated video into core videos table: ${data.id}`);
  }

  /**
   * Kids app feed reads `kids_content`. Requires job → reference_videos.character_id for mascot routing.
   */
  private async publishToKidsContentTable(admin: any, genVideo: any) {
    const job = Array.isArray(genVideo.generated_video_jobs)
      ? genVideo.generated_video_jobs[0]
      : genVideo.generated_video_jobs;

    const { data: ref, error: refErr } = await admin
      .from('reference_videos')
      .select('character_id')
      .eq('id', job?.reference_video_id)
      .maybeSingle();

    if (refErr) {
      this.logger.error('Failed to load reference video for kids publish', refErr);
      throw new BadRequestException('Could not resolve mascot for kids publish');
    }

    const characterId = ref?.character_id as string | null | undefined;
    if (!characterId) {
      throw new BadRequestException(
        'Kids publish requires reference_videos.character_id (mascot id). Re-upload or patch the reference asset.',
      );
    }

    const ageGroup = job?.kids_age_group === '10-12' ? '10-12' : '7-9';
    const topicTags: string[] =
      Array.isArray(job?.kids_topic_tags) && job.kids_topic_tags.length > 0
        ? job.kids_topic_tags
        : [genVideo.topic].filter(Boolean);
    const durationSeconds = job?.duration_target_seconds ?? 45;

    const { data: existing } = await admin
      .from('kids_content')
      .select('id')
      .eq('source_generated_video_id', genVideo.id)
      .maybeSingle();

    const payload = {
      title: genVideo.title,
      description: (genVideo.script || genVideo.topic || '').toString().slice(0, 500),
      video_url: genVideo.video_url,
      thumbnail_url: genVideo.thumbnail_url || null,
      age_group: ageGroup,
      difficulty: null,
      topic: genVideo.topic || null,
      topic_tags: topicTags,
      duration_seconds: durationSeconds,
      is_active: true,
      character_id: characterId,
      source_generated_video_id: genVideo.id,
      kids_generation_group_id: job?.kids_generation_group_id ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await admin.from('kids_content').update(payload).eq('id', existing.id);
      if (error) {
        this.logger.error('Failed to update kids_content', error);
        throw error;
      }
      this.logger.log(`Updated kids_content ${existing.id} for generated video ${genVideo.id}`);
      return;
    }

    const { error } = await admin.from('kids_content').insert({
      ...payload,
      created_by: job?.created_by ?? null,
    });

    if (error) {
      this.logger.error('Failed to insert kids_content', error);
      throw error;
    }

    this.logger.log(`Inserted kids_content for generated video ${genVideo.id} (mascot ${characterId})`);
  }

  async unpublish(generatedVideoId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('feed_items')
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('generated_video_id', generatedVideoId)
      .select();

    if (error) {
      this.logger.error('Failed to unpublish feed item', error);
      throw error;
    }

    // Also hide from core videos table
    await admin
      .from('videos')
      .update({ is_published: false })
      .eq('source_generated_video_id', generatedVideoId);

    await admin
      .from('kids_content')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('source_generated_video_id', generatedVideoId);

    this.logger.log(`Unpublished video ${generatedVideoId}`);
    return data;
  }

  async listFeedItems(feedType?: string, limit = 50, offset = 0) {
    const admin = this.supabaseService.getAdminClient();
    let q = admin
      .from('feed_items')
      .select('*, generated_videos(id, title, video_url, content_target)', { count: 'exact' })
      .order('published_at', { ascending: false });

    if (feedType) q = q.eq('feed_type', feedType);
    q = q.limit(limit);
    if (offset > 0) q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;
    if (error) {
      this.logger.error('Failed to list feed items', error);
      throw error;
    }
    return { data: data ?? [], count: count ?? 0 };
  }
}
