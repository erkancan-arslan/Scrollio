import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import {
  VideoDto,
  FeedResponseDto,
  TopicDto,
  TopicsResponseDto,
  ActionResponseDto,
} from './dto/feed-response.dto';
import { FeedQueryDto, BookmarkedFeedQueryDto, LikedFeedQueryDto, WatchedFeedQueryDto } from './dto/feed-query.dto';
import { RecordViewDto } from './dto/video-action.dto';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private readonly bunnyCdnBaseUrl: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    // BunnyCDN base URL for video delivery
    this.bunnyCdnBaseUrl = this.configService.get<string>('BUNNY_CDN_URL') || '';
  }

  /**
   * Resolve a stored video URL into a playable one.
   *
   * - Supabase Storage URLs (private bucket) → short-lived signed URL (1 hour)
   * - Everything else (BunnyCDN, external CDN, public URLs) → returned as-is
   */
  private async resolveVideoUrl(storedUrl: string): Promise<string> {
    if (!storedUrl) return storedUrl;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';

    // Not a Supabase storage URL — pass through unchanged
    if (!supabaseUrl || !storedUrl.includes(supabaseUrl)) {
      return storedUrl;
    }

    // Parse:  .../storage/v1/object/(public|private)/bucket-name/file-path
    const match = storedUrl.match(
      /\/storage\/v1\/object\/(?:public|private)\/([^/?#]+)\/(.+?)(?:\?.*)?$/,
    );
    if (!match) return storedUrl;

    const [, bucket, filePath] = match;

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // valid for 1 hour

    if (error || !data?.signedUrl) {
      this.logger.warn(`Could not sign URL for ${storedUrl}: ${error?.message}`);
      return storedUrl; // fall back to original
    }

    return data.signedUrl;
  }

  /** Fisher-Yates shuffle — returns a new shuffled array */
  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get personalized feed for a user.
   *
   * Personalization logic (applied when the user is authenticated and has
   * preferred topics set, and no explicit topicId/difficulty filter is in
   * the query):
   *   - Videos are restricted to the user's preferred topics.
   *   - Per topic, only beginner videos are shown until the user has watched
   *     every beginner video in that topic; after that, beginner + intermediate
   *     videos are unlocked.
   */
  async getFeed(userId: string | null, query: FeedQueryDto): Promise<FeedResponseDto> {
    const supabase = this.supabaseService.getAdminClient();
    const limit = query.limit || 10;

    // Resolve personalization filter (topic + difficulty per topic)
    let topicOrFilter: string | null = null;
    const shouldPersonalize = !query.topicId && !query.difficulty;

    if (shouldPersonalize && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      const preferredTopics: string[] = profile?.preferences?.preferredTopics ?? [];

      if (preferredTopics.length > 0) {
        const allowances = await this.getTopicDifficultyAllowances(userId, preferredTopics);
        topicOrFilter = this.buildTopicOrFilter(preferredTopics, allowances);
      }
    }

    // Step 1: count eligible videos so we can pick a random starting offset
    let countQuery = supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('moderation_status', 'approved');

    if (query.topicId) countQuery = countQuery.eq('topic_id', query.topicId);
    if (query.difficulty) countQuery = countQuery.eq('difficulty_level', query.difficulty);
    if (topicOrFilter) countQuery = countQuery.or(topicOrFilter);

    const { count, error: countError } = await countQuery;
    if (countError) {
      this.logger.error('Error counting videos:', countError);
      throw countError;
    }

    const totalCount = count ?? 0;
    if (totalCount === 0) {
      return { videos: [], nextCursor: null, hasMore: false };
    }

    // Step 2: pick a random offset so a different slice is returned every call
    const maxOffset = Math.max(0, totalCount - limit);
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

    // Step 3: fetch `limit` videos from that random position (ORDER BY id for stable range)
    let dbQuery = supabase
      .from('videos')
      .select(`
        *,
        topicData:topics(id, name, slug),
        creator:creators(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('is_published', true)
      .eq('moderation_status', 'approved')
      .order('id')
      .range(randomOffset, randomOffset + limit - 1);

    if (query.topicId) dbQuery = dbQuery.eq('topic_id', query.topicId);
    if (query.difficulty) dbQuery = dbQuery.eq('difficulty_level', query.difficulty);
    if (topicOrFilter) dbQuery = dbQuery.or(topicOrFilter);

    const { data: videos, error } = await dbQuery;

    if (error) {
      this.logger.error('Error fetching feed:', error);
      throw error;
    }

    // Shuffle the fetched slice so even the within-page order is random
    const videosToReturn = this.shuffleArray(videos ?? []);

    // Get user's likes and bookmarks if authenticated
    let userLikes = new Set<string>();
    let userBookmarks = new Set<string>();

    if (userId && videosToReturn.length > 0) {
      const videoIds = videosToReturn.map((v) => v.id);

      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('video_likes')
          .select('video_id')
          .eq('user_id', userId)
          .in('video_id', videoIds),
        supabase
          .from('video_bookmarks')
          .select('video_id')
          .eq('user_id', userId)
          .in('video_id', videoIds),
      ]);

      if (likesResult.data) {
        userLikes = new Set(likesResult.data.map((l) => l.video_id));
      }
      if (bookmarksResult.data) {
        userBookmarks = new Set(bookmarksResult.data.map((b) => b.video_id));
      }
    }

    // Resolve signed URLs for all videos in one batch
    const resolvedUrls = await Promise.all(
      videosToReturn.map((v) => this.resolveVideoUrl(v.video_url)),
    );
    const urlMap = new Map(videosToReturn.map((v, i) => [v.id, resolvedUrls[i]]));

    // Transform to DTOs
    const videosDtos: VideoDto[] = videosToReturn.map((video) =>
      this.transformVideoToDto(video, userLikes, userBookmarks, urlMap.get(video.id)),
    );

    return {
      videos: videosDtos,
      // nextCursor is null — each load is an independent random pick.
      // hasMore stays true as long as there are enough videos to keep scrolling.
      nextCursor: null,
      hasMore: totalCount > limit,
    };
  }

  /**
   * Get user's bookmarked videos
   */
  async getBookmarkedFeed(userId: string, query: BookmarkedFeedQueryDto): Promise<FeedResponseDto> {
    const supabase = this.supabaseService.getAdminClient();
    const limit = query.limit || 10;

    let dbQuery = supabase
      .from('video_bookmarks')
      .select(`
        video_id,
        created_at,
        video:videos(
          *,
          topicData:topics(id, name, slug),
          creator:creators(id, username, display_name, avatar_url, is_verified)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (query.cursor) {
      const { data: cursorBookmark } = await supabase
        .from('video_bookmarks')
        .select('created_at')
        .eq('video_id', query.cursor)
        .eq('user_id', userId)
        .single();

      if (cursorBookmark) {
        dbQuery = dbQuery.lt('created_at', cursorBookmark.created_at);
      }
    }

    const { data: bookmarks, error } = await dbQuery;

    if (error) {
      this.logger.error('Error fetching bookmarked feed:', error);
      throw error;
    }

    const hasMore = bookmarks && bookmarks.length > limit;
    const bookmarksToReturn = hasMore ? bookmarks.slice(0, limit) : bookmarks || [];

    // Get user's likes
    let userLikes = new Set<string>();
    if (bookmarksToReturn.length > 0) {
      const videoIds = bookmarksToReturn.map((b) => b.video_id);
      const { data: likes } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', userId)
        .in('video_id', videoIds);

      if (likes) {
        userLikes = new Set(likes.map((l) => l.video_id));
      }
    }

    // All returned videos are bookmarked
    const userBookmarks = new Set(bookmarksToReturn.map((b) => b.video_id));

    const getVideo = (b: (typeof bookmarksToReturn)[0]) =>
      Array.isArray(b.video) ? b.video[0] : b.video;

    const validBookmarks = bookmarksToReturn.filter((b) => getVideo(b));

    const resolvedUrls = await Promise.all(
      validBookmarks.map((b) => this.resolveVideoUrl(getVideo(b)!.video_url)),
    );
    const urlMap = new Map(validBookmarks.map((b, i) => [b.video_id, resolvedUrls[i]]));

    const videosDtos: VideoDto[] = validBookmarks
      .map((b) => this.transformVideoToDto(getVideo(b)!, userLikes, userBookmarks, urlMap.get(b.video_id)));

    return {
      videos: videosDtos,
      nextCursor: hasMore && bookmarksToReturn.length > 0
        ? bookmarksToReturn[bookmarksToReturn.length - 1].video_id
        : null,
      hasMore,
    };
  }

  /**
   * Get a paginated list of videos the user has liked
   */
  async getLikedFeed(userId: string, query: LikedFeedQueryDto): Promise<FeedResponseDto> {
    const supabase = this.supabaseService.getAdminClient();
    const limit = query.limit || 10;

    let dbQuery = supabase
      .from('video_likes')
      .select(`
        video_id,
        created_at,
        video:videos(
          *,
          topicData:topics(id, name, slug),
          creator:creators(id, username, display_name, avatar_url, is_verified)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (query.cursor) {
      const { data: cursorLike } = await supabase
        .from('video_likes')
        .select('created_at')
        .eq('video_id', query.cursor)
        .eq('user_id', userId)
        .single();

      if (cursorLike) {
        dbQuery = dbQuery.lt('created_at', cursorLike.created_at);
      }
    }

    const { data: likes, error } = await dbQuery;

    if (error) {
      this.logger.error('Error fetching liked feed:', error);
      throw error;
    }

    const hasMore = likes && likes.length > limit;
    const likesToReturn = hasMore ? likes.slice(0, limit) : likes || [];

    // All returned videos are liked by the user
    const userLikes = new Set(likesToReturn.map((l) => l.video_id));

    // Check which of these the user has also bookmarked
    let userBookmarks = new Set<string>();
    if (likesToReturn.length > 0) {
      const videoIds = likesToReturn.map((l) => l.video_id);
      const { data: bookmarks } = await supabase
        .from('video_bookmarks')
        .select('video_id')
        .eq('user_id', userId)
        .in('video_id', videoIds);

      if (bookmarks) {
        userBookmarks = new Set(bookmarks.map((b) => b.video_id));
      }
    }

    const getVideo = (l: (typeof likesToReturn)[0]) =>
      Array.isArray(l.video) ? l.video[0] : l.video;

    const validLikes = likesToReturn.filter((l) => getVideo(l));

    const resolvedUrls = await Promise.all(
      validLikes.map((l) => this.resolveVideoUrl(getVideo(l)!.video_url)),
    );
    const urlMap = new Map(validLikes.map((l, i) => [l.video_id, resolvedUrls[i]]));

    const videosDtos: VideoDto[] = validLikes.map((l) =>
      this.transformVideoToDto(getVideo(l)!, userLikes, userBookmarks, urlMap.get(l.video_id)),
    );

    return {
      videos: videosDtos,
      nextCursor:
        hasMore && likesToReturn.length > 0
          ? likesToReturn[likesToReturn.length - 1].video_id
          : null,
      hasMore,
    };
  }

  /**
   * Get a paginated list of unique videos the authenticated user has watched
   */
  async getWatchedFeed(userId: string, query: WatchedFeedQueryDto): Promise<FeedResponseDto> {
    const supabase = this.supabaseService.getAdminClient();
    const limit = query.limit || 10;

    let dbQuery = supabase
      .from('user_watched_videos')
      .select(`
        video_id,
        watched_at,
        video:videos(
          *,
          topicData:topics(id, name, slug),
          creator:creators(id, username, display_name, avatar_url, is_verified)
        )
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(limit + 1);

    if (query.cursor) {
      const { data: cursorRow } = await supabase
        .from('user_watched_videos')
        .select('watched_at')
        .eq('user_id', userId)
        .eq('video_id', query.cursor)
        .single();

      if (cursorRow) {
        dbQuery = dbQuery.lt('watched_at', cursorRow.watched_at);
      }
    }

    const { data: rows, error } = await dbQuery;

    if (error) {
      this.logger.error('Error fetching watched feed:', error);
      throw error;
    }

    const hasMore = rows && rows.length > limit;
    const rowsToReturn = hasMore ? rows.slice(0, limit) : rows || [];

    // Check which of these the user has liked / bookmarked
    let userLikes = new Set<string>();
    let userBookmarks = new Set<string>();

    if (rowsToReturn.length > 0) {
      const videoIds = rowsToReturn.map((r) => r.video_id);
      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('video_likes')
          .select('video_id')
          .eq('user_id', userId)
          .in('video_id', videoIds),
        supabase
          .from('video_bookmarks')
          .select('video_id')
          .eq('user_id', userId)
          .in('video_id', videoIds),
      ]);

      if (likesResult.data) userLikes = new Set(likesResult.data.map((l) => l.video_id));
      if (bookmarksResult.data) userBookmarks = new Set(bookmarksResult.data.map((b) => b.video_id));
    }

    const getVideo = (r: (typeof rowsToReturn)[0]) =>
      Array.isArray(r.video) ? r.video[0] : r.video;

    const validRows = rowsToReturn.filter((r) => getVideo(r));

    const resolvedUrls = await Promise.all(
      validRows.map((r) => this.resolveVideoUrl(getVideo(r)!.video_url)),
    );
    const urlMap = new Map(validRows.map((r, i) => [r.video_id, resolvedUrls[i]]));

    const videosDtos: VideoDto[] = validRows.map((r) =>
      this.transformVideoToDto(getVideo(r)!, userLikes, userBookmarks, urlMap.get(r.video_id)),
    );

    return {
      videos: videosDtos,
      nextCursor: hasMore && rowsToReturn.length > 0
        ? rowsToReturn[rowsToReturn.length - 1].video_id
        : null,
      hasMore,
    };
  }

  /**
   * Get distinct topic strings from the videos table (used for onboarding topic selection)
   */
  async getVideoTopics(): Promise<{ topics: string[] }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('videos')
      .select('topic')
      .eq('is_published', true)
      .eq('moderation_status', 'approved')
      .not('topic', 'is', null)
      .order('topic');

    if (error) {
      this.logger.error('Error fetching video topics:', error);
      throw error;
    }

    // Deduplicate client-side
    const topics = [...new Set((data ?? []).map((v) => v.topic).filter(Boolean))].sort();
    return { topics };
  }

  /**
   * For each preferred topic, determine which difficulty levels a user may see.
   *
   * Level progression is now driven by the quiz feature — a user only sees
   * intermediate/advanced content in a topic after answering the
   * corresponding level-up quiz correctly (recorded in
   * `user_topic_level_unlocks`).
   *
   * Fallback: if a topic has no beginner videos at all we unlock everything
   * so users with a preference for a sparsely-seeded topic don't get an
   * empty feed.
   */
  private async getTopicDifficultyAllowances(
    userId: string,
    preferredTopics: string[],
  ): Promise<Record<string, string[]>> {
    const supabase = this.supabaseService.getAdminClient();

    // Topics that have at least one published beginner video.
    const { data: beginnerVideos } = await supabase
      .from('videos')
      .select('topic')
      .in('topic', preferredTopics)
      .eq('difficulty_level', 'beginner')
      .eq('is_published', true)
      .eq('moderation_status', 'approved');

    const topicsWithBeginner = new Set<string>();
    for (const v of beginnerVideos ?? []) {
      if (v.topic) topicsWithBeginner.add(v.topic);
    }

    // All unlocks for this user across the preferred topics.
    const { data: unlocks } = await supabase
      .from('user_topic_level_unlocks')
      .select('topic, level')
      .eq('user_id', userId)
      .in('topic', preferredTopics);

    const unlocksByTopic = new Map<string, Set<string>>();
    for (const u of unlocks ?? []) {
      if (!u.topic) continue;
      if (!unlocksByTopic.has(u.topic)) unlocksByTopic.set(u.topic, new Set());
      unlocksByTopic.get(u.topic)!.add(u.level);
    }

    const allowances: Record<string, string[]> = {};
    for (const topic of preferredTopics) {
      if (!topicsWithBeginner.has(topic)) {
        // No beginner content exists for this topic → unlock all difficulties
        // so the feed isn't empty during seeding.
        allowances[topic] = ['beginner', 'intermediate', 'advanced'];
        continue;
      }
      const unlocked = unlocksByTopic.get(topic) ?? new Set<string>();
      const diffs: string[] = ['beginner'];
      if (unlocked.has('intermediate')) diffs.push('intermediate');
      if (unlocked.has('advanced')) diffs.push('advanced');
      allowances[topic] = diffs;
    }
    return allowances;
  }

  /**
   * Build a PostgREST OR filter string that restricts the feed to the
   * allowed (topic, difficulty) combinations for this user.
   */
  private buildTopicOrFilter(
    topics: string[],
    allowances: Record<string, string[]>,
  ): string | null {
    if (topics.length === 0) return null;

    const parts = topics.map((topic) => {
      const diffs = allowances[topic] ?? ['beginner'];
      if (diffs.length === 1) {
        return `and(topic.eq.${topic},difficulty_level.eq.${diffs[0]})`;
      }
      return `and(topic.eq.${topic},difficulty_level.in.(${diffs.join(',')}))`;
    });

    return parts.join(',');
  }

  /**
   * Get all active topics
   */
  async getTopics(): Promise<TopicsResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      this.logger.error('Error fetching topics:', error);
      throw error;
    }

    const topicsDtos: TopicDto[] = (topics || []).map((topic) => ({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      iconUrl: topic.icon_url,
      color: topic.color,
      videoCount: topic.video_count,
    }));

    return { topics: topicsDtos };
  }

  /**
   * Like a video
   */
  async likeVideo(userId: string, videoId: string): Promise<ActionResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if video exists
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, like_count')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      throw new NotFoundException('Video not found');
    }

    // Insert like (will fail if already liked due to unique constraint)
    const { error: likeError } = await supabase
      .from('video_likes')
      .insert({ user_id: userId, video_id: videoId });

    if (likeError) {
      if (likeError.code === '23505') {
        // Already liked
        return {
          success: true,
          message: 'Video already liked',
          likeCount: video.like_count,
        };
      }
      throw likeError;
    }

    // Get updated like count
    const { data: updatedVideo } = await supabase
      .from('videos')
      .select('like_count')
      .eq('id', videoId)
      .single();

    return {
      success: true,
      message: 'Video liked successfully',
      likeCount: updatedVideo?.like_count || video.like_count + 1,
    };
  }

  /**
   * Unlike a video
   */
  async unlikeVideo(userId: string, videoId: string): Promise<ActionResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('video_likes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) {
      throw error;
    }

    // Get updated like count
    const { data: video } = await supabase
      .from('videos')
      .select('like_count')
      .eq('id', videoId)
      .single();

    return {
      success: true,
      message: 'Video unliked successfully',
      likeCount: video?.like_count || 0,
    };
  }

  /**
   * Bookmark a video
   */
  async bookmarkVideo(userId: string, videoId: string): Promise<ActionResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if video exists
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, bookmark_count')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      throw new NotFoundException('Video not found');
    }

    // Insert bookmark
    const { error: bookmarkError } = await supabase
      .from('video_bookmarks')
      .insert({ user_id: userId, video_id: videoId });

    if (bookmarkError) {
      if (bookmarkError.code === '23505') {
        return {
          success: true,
          message: 'Video already bookmarked',
          bookmarkCount: video.bookmark_count,
        };
      }
      throw bookmarkError;
    }

    // Get updated bookmark count
    const { data: updatedVideo } = await supabase
      .from('videos')
      .select('bookmark_count')
      .eq('id', videoId)
      .single();

    return {
      success: true,
      message: 'Video bookmarked successfully',
      bookmarkCount: updatedVideo?.bookmark_count || video.bookmark_count + 1,
    };
  }

  /**
   * Remove bookmark from a video
   */
  async unbookmarkVideo(userId: string, videoId: string): Promise<ActionResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('video_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) {
      throw error;
    }

    // Get updated bookmark count
    const { data: video } = await supabase
      .from('videos')
      .select('bookmark_count')
      .eq('id', videoId)
      .single();

    return {
      success: true,
      message: 'Bookmark removed successfully',
      bookmarkCount: video?.bookmark_count || 0,
    };
  }

  /**
   * Record a video view and award XP for the first meaningful watch.
   *
   * XP scale (spec §3.2 req 15: 10–50 XP per watched video):
   *   beginner    → 10 XP
   *   intermediate → 30 XP
   *   advanced     → 50 XP
   *
   * XP is only awarded once per video per user (first watch) and only when
   * the user watched at least 5 seconds of it.
   */
  async recordView(
    userId: string | null,
    videoId: string,
    viewData: RecordViewDto,
  ): Promise<ActionResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    // Determine whether this is the user's first watch BEFORE inserting,
    // so the count stays at 0 and we can safely use == 0 as the first-watch gate.
    let isFirstWatch = false;
    if (userId && viewData.watchDuration >= 5) {
      const { count } = await supabase
        .from('video_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('video_id', videoId);
      isFirstWatch = (count ?? 0) === 0;
    }

    const { error } = await supabase.from('video_views').insert({
      user_id: userId,
      video_id: videoId,
      watch_duration: viewData.watchDuration,
      completed: viewData.completed || false,
    });

    if (error) {
      this.logger.error('Error recording view:', error);
      throw error;
    }

    if (isFirstWatch && userId) {
      try {
        const xpData = await this.awardVideoXp(userId, videoId);
        return { success: true, message: 'View recorded successfully', ...xpData };
      } catch (xpErr) {
        this.logger.warn(`Failed to award video XP for ${videoId}: ${xpErr}`);
      }
    }

    return { success: true, message: 'View recorded successfully' };
  }

  /** Fetch the video difficulty and call add_xp for the appropriate amount. */
  private async awardVideoXp(
    userId: string,
    videoId: string,
  ): Promise<{ xpAwarded: number; newXp: number; newLevel: number; levelUp: boolean }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: video } = await supabase
      .from('videos')
      .select('difficulty_level')
      .eq('id', videoId)
      .single();

    const xpAmount = this.videoXpForDifficulty(video?.difficulty_level);

    const { data, error } = await supabase.rpc('add_xp', {
      user_id: userId,
      xp_amount: xpAmount,
    });

    if (error || !data?.[0]) throw new Error(error?.message ?? 'add_xp returned no data');

    const r = data[0];
    return { xpAwarded: xpAmount, newXp: r.new_xp, newLevel: r.new_level, levelUp: r.level_up };
  }

  /** 10 / 30 / 50 XP for beginner / intermediate / advanced (spec range 10–50). */
  private videoXpForDifficulty(difficulty: string | null | undefined): number {
    if (difficulty === 'intermediate') return 30;
    if (difficulty === 'advanced') return 50;
    return 10;
  }

  /**
   * Get a single video by ID
   */
  async getVideoById(userId: string | null, videoId: string): Promise<VideoDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: video, error } = await supabase
      .from('videos')
      .select(`
        *,
        topicData:topics(id, name, slug),
        creator:creators(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('id', videoId)
      .eq('is_published', true)
      .eq('moderation_status', 'approved')
      .single();

    if (error || !video) {
      throw new NotFoundException('Video not found');
    }

    // Get user's like and bookmark status
    let userLikes = new Set<string>();
    let userBookmarks = new Set<string>();

    if (userId) {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('video_likes')
          .select('video_id')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single(),
        supabase
          .from('video_bookmarks')
          .select('video_id')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single(),
      ]);

      if (likeResult.data) {
        userLikes.add(videoId);
      }
      if (bookmarkResult.data) {
        userBookmarks.add(videoId);
      }
    }

    const resolvedUrl = await this.resolveVideoUrl(video.video_url);
    return this.transformVideoToDto(video, userLikes, userBookmarks, resolvedUrl);
  }

  /**
   * Transform database video to DTO
   */
  private transformVideoToDto(
    video: any,
    userLikes: Set<string>,
    userBookmarks: Set<string>,
    resolvedVideoUrl?: string,
  ): VideoDto {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: resolvedVideoUrl ?? video.video_url,
      thumbnailUrl: video.thumbnail_url,
      duration: video.duration,
      creator: (() => {
        const validUsername =
          video.creator?.username && video.creator.username !== 'unknown'
            ? video.creator.username
            : null;
        if (video.creator && validUsername) {
          return {
            id: video.creator.id,
            username: validUsername,
            displayName: video.creator.display_name || validUsername,
            avatarUrl: video.creator.avatar_url,
            isVerified: video.creator.is_verified ?? false,
          };
        }
        return {
          id: 'scrollio_team',
          username: 'scrollio_team',
          displayName: 'Scrollio Team',
          avatarUrl: null,
          isVerified: true,
        };
      })(),
      stats: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        bookmarks: video.bookmark_count || 0,
        shares: video.share_count || 0,
      },
      topic: video.topic || video.topicData?.name || 'General',
      topicId: video.topicData?.id || null,
      tags: video.tags || [],
      difficulty: video.difficulty_level || 'beginner',
      isLiked: userLikes.has(video.id),
      isBookmarked: userBookmarks.has(video.id),
      createdAt: video.created_at,
    };
  }
}

