import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { GetKidsFeedDto, ViewedEventDto } from './dto';

@Injectable()
export class KidsFeedService {
  private readonly logger = new Logger(KidsFeedService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Map date of birth → kids_content.age_group band. Null if unknown / unparseable.
   */
  private ageGroupFromDob(dob: string | null | undefined): '7-9' | '10-12' | null {
    if (!dob || typeof dob !== 'string') return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const md = now.getMonth() - birth.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age--;
    if (age <= 9) return '7-9';
    return '10-12';
  }

  /**
   * Get personalised feed for a child: kids_content only, filtered by mascot, topics, age band.
   * Excludes recently viewed content (last 24h) and paginates.
   */
  async getFeed(childId: string, query: GetKidsFeedDto) {
    const admin = this.supabaseService.getAdminClient();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    type EmptyReason = 'no_mascot' | 'no_topics' | 'no_matching_content';

    const empty = (reason: EmptyReason) => ({
      data: [] as Record<string, unknown>[],
      meta: {
        page,
        limit,
        total: 0,
        hasMore: false,
        emptyReason: reason,
      },
    });

    // 1. Child profile (mascot + DOB for age band)
    const { data: childProfile } = await admin
      .from('kids_child_profiles')
      .select('selected_character_id, date_of_birth')
      .eq('id', childId)
      .maybeSingle();

    const mascotId = childProfile?.selected_character_id as string | null | undefined;
    if (!mascotId?.trim()) {
      return empty('no_mascot');
    }

    // 2. Selected topic names
    const { data: childTopics } = await admin
      .from('kids_child_topics')
      .select('topic_id, kids_topics(name)')
      .eq('child_profile_id', childId);

    const topicNames = (childTopics ?? [])
      .map((ct: Record<string, unknown>) => {
        const topic = ct.kids_topics as { name: string } | null;
        return topic?.name;
      })
      .filter(Boolean) as string[];

    if (!query.topicId && topicNames.length === 0) {
      return empty('no_topics');
    }

    // 3. Recently viewed (last 24h) to exclude
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentViews } = await admin
      .from('kids_feed_views')
      .select('content_id')
      .eq('child_profile_id', childId)
      .gte('created_at', oneDayAgo);

    const viewedIds = (recentViews ?? []).map((v: { content_id: string }) => v.content_id);

    const ageGroup = this.ageGroupFromDob(childProfile?.date_of_birth as string | null | undefined);

    // 4. Build feed query on kids_content only
    let feedQuery = admin
      .from('kids_content')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('character_id', mascotId.trim())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ageGroup) {
      feedQuery = feedQuery.eq('age_group', ageGroup);
    }

    if (query.topicId) {
      const { data: topic } = await admin
        .from('kids_topics')
        .select('name')
        .eq('id', query.topicId)
        .maybeSingle();

      if (topic?.name) {
        feedQuery = feedQuery.contains('topic_tags', [topic.name]);
      }
    } else {
      feedQuery = feedQuery.overlaps('topic_tags', topicNames);
    }

    if (viewedIds.length > 0) {
      feedQuery = feedQuery.filter('id', 'not.in', `(${viewedIds.join(',')})`);
    }

    const { data: items, count, error } = await feedQuery;

    if (error) {
      this.logger.error(`getFeed error: ${error.message}`);
    }

    // 4. Check which items are bookmarked by this child
    const contentIds = (items ?? []).map((i: { id: string }) => i.id);
    let bookmarkedSet = new Set<string>();

    if (contentIds.length > 0) {
      const { data: bookmarks } = await admin
        .from('kids_bookmarks')
        .select('content_id')
        .eq('child_profile_id', childId)
        .in('content_id', contentIds);

      bookmarkedSet = new Set(
        (bookmarks ?? []).map((b: { content_id: string }) => b.content_id),
      );
    }

    // 5. Check which items have quizzes
    let quizContentSet = new Set<string>();
    if (contentIds.length > 0) {
      const { data: quizzes } = await admin
        .from('kids_quizzes')
        .select('content_id')
        .eq('is_active', true)
        .in('content_id', contentIds);

      quizContentSet = new Set(
        (quizzes ?? []).map((q: { content_id: string }) => q.content_id),
      );
    }

    const feedItems = (items ?? []).map((item: Record<string, unknown>) => ({
      ...item,
      isBookmarked: bookmarkedSet.has(item.id as string),
      hasQuiz: quizContentSet.has(item.id as string),
    }));

    const total = count ?? 0;
    const emptyReason: EmptyReason | undefined =
      total === 0 && feedItems.length === 0 ? 'no_matching_content' : undefined;

    return {
      data: feedItems,
      meta: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
        ...(emptyReason ? { emptyReason } : {}),
      },
    };
  }

  /**
   * Track a content view event. Awards XP based on watch time.
   */
  async trackView(childId: string, dto: ViewedEventDto) {
    const admin = this.supabaseService.getAdminClient();

    // 1. Get content duration to check completion
    const { data: content } = await admin
      .from('kids_content')
      .select('duration_seconds')
      .eq('id', dto.contentId)
      .maybeSingle();

    const duration = (content?.duration_seconds as number) ?? 0;
    const completedAt =
      duration > 0 && dto.watchedSeconds >= duration * 0.8
        ? new Date().toISOString()
        : null;

    // 2. Insert feed view
    const { error: viewError } = await admin.from('kids_feed_views').insert({
      child_profile_id: childId,
      content_id: dto.contentId,
      watched_seconds: dto.watchedSeconds,
      completed_at: completedAt,
    });

    if (viewError) {
      this.logger.error(`trackView insert error: ${viewError.message}`);
    }

    // 3. Log activity
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'video_view',
      metadata: {
        content_id: dto.contentId,
        watched_seconds: dto.watchedSeconds,
        completed: !!completedAt,
      },
    });

    // 4. Award XP (1 XP per 10 seconds watched)
    const xpEarned = Math.floor(dto.watchedSeconds / 10);
    if (xpEarned > 0) {
      await this.addXp(admin, childId, xpEarned);
    }

    return {
      tracked: true,
      xpEarned,
      completed: !!completedAt,
    };
  }

  /**
   * Shared helper: add XP and check for level up.
   */
  private async addXp(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
    xpAmount: number,
  ) {
    // Get current progress
    const { data: progress } = await admin
      .from('kids_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!progress) return;

    let newXp = (progress.xp as number) + xpAmount;
    let level = progress.level as number;
    let leveledUp = false;

    // Level up check: level N requires N * 100 XP
    while (newXp >= level * 100) {
      newXp -= level * 100;
      level++;
      leveledUp = true;
    }

    await admin
      .from('kids_progress')
      .update({ xp: newXp, level, updated_at: new Date().toISOString() })
      .eq('child_profile_id', childId);

    if (leveledUp) {
      await admin.from('kids_rewards').insert({
        child_profile_id: childId,
        reward_type: 'level_up',
        reward_data: { newLevel: level },
        earned_at: new Date().toISOString(),
      });
    }
  }
}
