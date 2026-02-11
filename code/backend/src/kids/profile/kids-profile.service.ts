import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateKidsProfileDto, UpdateAvatarDto, SelectTopicsDto } from './dto';

@Injectable()
export class KidsProfileService {
  private readonly logger = new Logger(KidsProfileService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get full child profile with progress and topic data.
   */
  async getProfile(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const [profileRes, progressRes, topicsRes] = await Promise.all([
      admin.from('kids_child_profiles').select('*').eq('id', childId).maybeSingle(),
      admin.from('kids_progress').select('*').eq('child_profile_id', childId).maybeSingle(),
      admin
        .from('kids_child_topics')
        .select('topic_id, kids_topics(id, name, icon_url, category)')
        .eq('child_profile_id', childId),
    ]);

    if (!profileRes.data) {
      throw new NotFoundException('Child profile not found');
    }

    const topics = (topicsRes.data ?? []).map((ct: Record<string, unknown>) => ct.kids_topics);

    return {
      ...profileRes.data,
      progress: progressRes.data ?? { level: 1, xp: 0 },
      selectedTopics: topics,
    };
  }

  /**
   * Update child profile fields.
   */
  async updateProfile(childId: string, dto: UpdateKidsProfileDto) {
    const admin = this.supabaseService.getAdminClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.displayName !== undefined) updateData.display_name = dto.displayName;
    if (dto.language !== undefined) {
      updateData.avatar_config = admin
        .from('kids_child_profiles')
        .select('avatar_config')
        .eq('id', childId)
        .maybeSingle()
        .then((r) => ({
          ...((r.data?.avatar_config as Record<string, unknown>) ?? {}),
          language: dto.language,
        }));
    }

    const { data, error } = await admin
      .from('kids_child_profiles')
      .update(updateData)
      .eq('id', childId)
      .select()
      .single();

    if (error) {
      this.logger.error(`updateProfile error: ${error.message}`);
      throw new NotFoundException('Failed to update profile');
    }

    return data;
  }

  /**
   * Update child avatar config.
   */
  async updateAvatar(childId: string, dto: UpdateAvatarDto) {
    const admin = this.supabaseService.getAdminClient();

    // Get current avatar config and merge
    const { data: current } = await admin
      .from('kids_child_profiles')
      .select('avatar_config')
      .eq('id', childId)
      .maybeSingle();

    const currentConfig = (current?.avatar_config ?? {}) as Record<string, unknown>;
    const newConfig = {
      ...currentConfig,
      avatarId: dto.avatarId,
      ...(dto.color ? { color: dto.color } : {}),
    };

    const { data, error } = await admin
      .from('kids_child_profiles')
      .update({ avatar_config: newConfig, updated_at: new Date().toISOString() })
      .eq('id', childId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('Failed to update avatar');
    }

    return data;
  }

  /**
   * Get viewing history for a child (recent 50 views with content details).
   */
  async getHistory(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_feed_views')
      .select('*, kids_content(id, title, thumbnail_url, topic_tags, duration_seconds)')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`getHistory error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get aggregated learning metrics for a child.
   */
  async getMetrics(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    // Parallel queries for metrics
    const [
      progressRes,
      viewCountRes,
      quizCountRes,
      bookmarkCountRes,
      rewardsCountRes,
    ] = await Promise.all([
      admin.from('kids_progress').select('*').eq('child_profile_id', childId).maybeSingle(),
      admin
        .from('kids_feed_views')
        .select('id', { count: 'exact', head: true })
        .eq('child_profile_id', childId),
      admin
        .from('kids_quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('child_profile_id', childId),
      admin
        .from('kids_bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('child_profile_id', childId),
      admin
        .from('kids_rewards')
        .select('id', { count: 'exact', head: true })
        .eq('child_profile_id', childId),
    ]);

    const progress = progressRes.data ?? { level: 1, xp: 0 };
    const level = progress.level as number;

    return {
      level,
      currentXp: progress.xp,
      xpToNextLevel: level * 100,
      totalVideosWatched: viewCountRes.count ?? 0,
      totalQuizzesTaken: quizCountRes.count ?? 0,
      totalBookmarks: bookmarkCountRes.count ?? 0,
      totalRewards: rewardsCountRes.count ?? 0,
    };
  }

  // ──────────── Topics ────────────

  /**
   * Get all available topics.
   */
  async getAllTopics() {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_topics')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      this.logger.error(`getAllTopics error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Search topics by name.
   */
  async searchTopics(query: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data } = await admin
      .from('kids_topics')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(20);

    return data ?? [];
  }

  /**
   * Get child's selected topic IDs.
   */
  async getSelectedTopics(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data } = await admin
      .from('kids_child_topics')
      .select('topic_id, kids_topics(id, name, icon_url, category)')
      .eq('child_profile_id', childId);

    return (data ?? []).map((ct: Record<string, unknown>) => ct.kids_topics);
  }

  /**
   * Replace child's selected topics.
   */
  async selectTopics(childId: string, dto: SelectTopicsDto) {
    const admin = this.supabaseService.getAdminClient();

    // Delete existing selections
    await admin
      .from('kids_child_topics')
      .delete()
      .eq('child_profile_id', childId);

    // Insert new selections
    if (dto.topicIds.length > 0) {
      await admin.from('kids_child_topics').insert(
        dto.topicIds.map((topicId) => ({
          child_profile_id: childId,
          topic_id: topicId,
        })),
      );
    }

    // Log activity
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'topics_selected',
      metadata: { topic_ids: dto.topicIds, count: dto.topicIds.length },
    });

    return this.getSelectedTopics(childId);
  }
}
