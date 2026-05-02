import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  UpdateProfileDto,
  ProfileDto,
  PublicProfileDto,
  FollowResponseDto,
  XpResponseDto,
  StreakResponseDto,
  WeeklyAnalyticsDto,
} from './dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get the current user's profile
   */
  async getMyProfile(userId: string): Promise<ProfileDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      this.logger.error('Error fetching profile:', error);
      throw new NotFoundException('Profile not found');
    }

    // Get follower/following counts
    const [followerResult, followingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    return this.transformToProfileDto(
      profile,
      followerResult.count || 0,
      followingResult.count || 0,
    );
  }

  /**
   * Get another user's public profile
   */
  async getProfile(userId: string | null, profileId: string): Promise<PublicProfileDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      throw new NotFoundException('Profile not found');
    }

    // Get follower/following counts and check if current user follows
    const [followerResult, followingResult, isFollowingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', profileId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', profileId),
      userId
        ? supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', profileId)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    return this.transformToPublicProfileDto(
      profile,
      followerResult.count || 0,
      followingResult.count || 0,
      !!isFollowingResult.data,
    );
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(userId: string | null, username: string): Promise<PublicProfileDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) {
      throw new NotFoundException('Profile not found');
    }

    // Get follower/following counts
    const [followerResult, followingResult, isFollowingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', profile.id),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', profile.id),
      userId
        ? supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', profile.id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    return this.transformToPublicProfileDto(
      profile,
      followerResult.count || 0,
      followingResult.count || 0,
      !!isFollowingResult.data,
    );
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileDto): Promise<ProfileDto> {
    const supabase = this.supabaseService.getAdminClient();

    // Check username uniqueness if updating
    if (updateData.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updateData.username)
        .neq('id', userId)
        .single();

      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    // Transform camelCase to snake_case for database
    const dbData: Record<string, any> = {};
    if (updateData.username !== undefined) dbData.username = updateData.username;
    if (updateData.displayName !== undefined) dbData.display_name = updateData.displayName;
    if (updateData.avatarUrl !== undefined) dbData.avatar_url = updateData.avatarUrl;
    if (updateData.bio !== undefined) dbData.bio = updateData.bio;
    if (updateData.ageGroup !== undefined) dbData.age_group = updateData.ageGroup;

    // Merge preferences with existing values so a partial update (e.g. only
    // setting preferredTopics) never wipes out the other preference fields.
    if (updateData.preferences !== undefined) {
      const { data: current } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      const existingPrefs = current?.preferences ?? {};
      dbData.preferences = { ...existingPrefs, ...updateData.preferences };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating profile:', error);
      throw error;
    }

    // Get updated counts
    const [followerResult, followingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    return this.transformToProfileDto(
      profile,
      followerResult.count || 0,
      followingResult.count || 0,
    );
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, targetUserId: string): Promise<FollowResponseDto> {
    if (userId === targetUserId) {
      throw new ConflictException('Cannot follow yourself');
    }

    const supabase = this.supabaseService.getAdminClient();

    // Check if target user exists
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (!targetProfile) {
      throw new NotFoundException('User not found');
    }

    // Insert follow
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: userId, following_id: targetUserId });

    if (error) {
      if (error.code === '23505') {
        // Already following
        const { count } = await supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', targetUserId);

        return {
          success: true,
          message: 'Already following this user',
          followerCount: count || 0,
        };
      }
      throw error;
    }

    // Get updated follower count
    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    return {
      success: true,
      message: 'Successfully followed user',
      followerCount: count || 0,
    };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, targetUserId: string): Promise<FollowResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);

    if (error) {
      throw error;
    }

    // Get updated follower count
    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    return {
      success: true,
      message: 'Successfully unfollowed user',
      followerCount: count || 0,
    };
  }

  /**
   * Add XP to user
   */
  async addXp(userId: string, xpAmount: number): Promise<XpResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.rpc('add_xp', {
      user_id: userId,
      xp_amount: xpAmount,
    });

    if (error) {
      this.logger.error('Error adding XP:', error);
      throw error;
    }

    const result = data[0];
    return {
      success: true,
      xpAdded: xpAmount,
      newXp: result.new_xp,
      newLevel: result.new_level,
      levelUp: result.level_up,
    };
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string): Promise<StreakResponseDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.rpc('update_user_streak', {
      user_id: userId,
    });

    if (error) {
      this.logger.error('Error updating streak:', error);
      throw error;
    }

    const result = data[0];
    return {
      success: true,
      streakDays: result.new_streak,
      streakMaintained: result.streak_maintained,
    };
  }

  /**
   * Get user's followers
   */
  async getFollowers(
    profileId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ users: PublicProfileDto[]; total: number }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: follows, error, count } = await supabase
      .from('user_follows')
      .select('follower_id, profiles!user_follows_follower_id_fkey(*)', { count: 'exact' })
      .eq('following_id', profileId)
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const users = (follows || []).map((f: any) =>
      this.transformToPublicProfileDto(f.profiles, 0, 0, false),
    );

    return { users, total: count || 0 };
  }

  /**
   * Get users that a profile is following
   */
  async getFollowing(
    profileId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ users: PublicProfileDto[]; total: number }> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: follows, error, count } = await supabase
      .from('user_follows')
      .select('following_id, profiles!user_follows_following_id_fkey(*)', { count: 'exact' })
      .eq('follower_id', profileId)
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const users = (follows || []).map((f: any) =>
      this.transformToPublicProfileDto(f.profiles, 0, 0, false),
    );

    return { users, total: count || 0 };
  }

  /**
   * Get weekly analytics for the current user
   */
  async getWeeklyAnalytics(userId: string): Promise<WeeklyAnalyticsDto> {
    const supabase = this.supabaseService.getAdminClient();
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [viewsResult, quizzesResult] = await Promise.all([
      supabase
        .from('video_views')
        .select('video_id, watch_duration, videos(topic)')
        .eq('user_id', userId)
        .gte('created_at', sinceIso),
      supabase
        .from('core_quiz_attempts')
        .select('is_correct')
        .eq('user_id', userId)
        .gte('attempted_at', sinceIso),
    ]);

    const views = viewsResult.data ?? [];
    const uniqueVideos = new Set(views.map((v) => v.video_id));
    const totalWatchTimeSeconds = views.reduce((s, v) => s + (v.watch_duration ?? 0), 0);

    const topicCounts: Record<string, number> = {};
    for (const v of views) {
      const topic = (v.videos as any)?.topic;
      if (topic) topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
    }
    const totalTopicViews = Object.values(topicCounts).reduce((s, n) => s + n, 0);
    const topicDistribution = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([topic, count]) => ({
        topic,
        videosWatched: count,
        percentage: totalTopicViews > 0 ? Math.round((count / totalTopicViews) * 100) : 0,
      }));

    const attempts = quizzesResult.data ?? [];
    const correct = attempts.filter((q) => q.is_correct).length;
    const quizAccuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : null;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      videosWatched: uniqueVideos.size,
      totalWatchTimeSeconds,
      quizAccuracy,
      quizAttempts: attempts.length,
      topicDistribution,
    };
  }

  /**
   * Transform database profile to ProfileDto
   */
  private transformToProfileDto(
    profile: any,
    followerCount: number,
    followingCount: number,
  ): ProfileDto {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      ageGroup: profile.age_group,
      level: profile.level || 1,
      xp: profile.xp || 0,
      totalVideosWatched: profile.total_videos_watched || 0,
      totalWatchTime: profile.total_watch_time || 0,
      totalQuizzesCompleted: profile.total_quizzes_completed || 0,
      averageQuizScore: profile.average_quiz_score || 0,
      streakDays: profile.streak_days || 0,
      longestStreak: profile.longest_streak || 0,
      lastActiveDate: profile.last_active_date,
      preferences: profile.preferences || {
        notifications: true,
        darkMode: false,
        autoPlay: true,
        topicDifficulties: {},
        preferredTopics: [],
      },
      isCreator: profile.is_creator || false,
      isVerified: profile.is_verified || false,
      isPremium: profile.is_premium || false,
      followerCount,
      followingCount,
      createdAt: profile.created_at,
    };
  }

  /**
   * Transform database profile to PublicProfileDto
   */
  private transformToPublicProfileDto(
    profile: any,
    followerCount: number,
    followingCount: number,
    isFollowing: boolean,
  ): PublicProfileDto {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      level: profile.level || 1,
      xp: profile.xp || 0,
      totalVideosWatched: profile.total_videos_watched || 0,
      streakDays: profile.streak_days || 0,
      isCreator: profile.is_creator || false,
      isVerified: profile.is_verified || false,
      followerCount,
      followingCount,
      isFollowing,
    };
  }
}

