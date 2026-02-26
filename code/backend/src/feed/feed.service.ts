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
import { FeedQueryDto, BookmarkedFeedQueryDto } from './dto/feed-query.dto';
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

  /**
   * Get personalized feed for a user
   */
  async getFeed(userId: string | null, query: FeedQueryDto): Promise<FeedResponseDto> {
    const supabase = this.supabaseService.getAdminClient();
    const limit = query.limit || 10;

    // Build query
    let dbQuery = supabase
      .from('videos')
      .select(`
        *,
        topic:topics(id, name, slug),
        creator:creators(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('is_published', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Filter by topic if specified
    if (query.topicId) {
      dbQuery = dbQuery.eq('topic_id', query.topicId);
    }

    // Filter by difficulty if specified
    if (query.difficulty) {
      dbQuery = dbQuery.eq('difficulty_level', query.difficulty);
    }

    // Cursor-based pagination
    if (query.cursor) {
      // Get the created_at of the cursor video
      const { data: cursorVideo } = await supabase
        .from('videos')
        .select('created_at')
        .eq('id', query.cursor)
        .single();

      if (cursorVideo) {
        dbQuery = dbQuery.lt('created_at', cursorVideo.created_at);
      }
    }

    const { data: videos, error } = await dbQuery;

    if (error) {
      this.logger.error('Error fetching feed:', error);
      throw error;
    }

    // Check if there are more videos
    const hasMore = videos && videos.length > limit;
    const videosToReturn = hasMore ? videos.slice(0, limit) : videos || [];

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
      nextCursor: hasMore && videosToReturn.length > 0
        ? videosToReturn[videosToReturn.length - 1].id
        : null,
      hasMore,
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
          topic:topics(id, name, slug),
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

    const validBookmarks = bookmarksToReturn.filter((b) => b.video);

    const resolvedUrls = await Promise.all(
      validBookmarks.map((b) => this.resolveVideoUrl(b.video.video_url)),
    );
    const urlMap = new Map(validBookmarks.map((b, i) => [b.video_id, resolvedUrls[i]]));

    const videosDtos: VideoDto[] = validBookmarks
      .map((b) => this.transformVideoToDto(b.video, userLikes, userBookmarks, urlMap.get(b.video_id)));

    return {
      videos: videosDtos,
      nextCursor: hasMore && bookmarksToReturn.length > 0
        ? bookmarksToReturn[bookmarksToReturn.length - 1].video_id
        : null,
      hasMore,
    };
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
   * Record a video view
   */
  async recordView(
    userId: string | null,
    videoId: string,
    viewData: RecordViewDto,
  ): Promise<ActionResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

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

    return {
      success: true,
      message: 'View recorded successfully',
    };
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
        topic:topics(id, name, slug),
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
      creator: video.creator
        ? {
            id: video.creator.id,
            username: video.creator.username,
            displayName: video.creator.display_name,
            avatarUrl: video.creator.avatar_url,
            isVerified: video.creator.is_verified,
          }
        : {
            id: 'unknown',
            username: 'unknown',
            displayName: 'Unknown Creator',
            avatarUrl: null,
            isVerified: false,
          },
      stats: {
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        bookmarks: video.bookmark_count || 0,
        shares: video.share_count || 0,
      },
      topic: video.topic?.name || 'General',
      topicId: video.topic?.id || null,
      tags: video.tags || [],
      difficulty: video.difficulty_level || 'beginner',
      isLiked: userLikes.has(video.id),
      isBookmarked: userBookmarks.has(video.id),
      createdAt: video.created_at,
    };
  }
}

