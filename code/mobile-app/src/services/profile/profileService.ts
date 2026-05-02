/**
 * Profile Service
 * Handles all API requests for user profiles
 */

import { apiClient, ApiResponse } from '../api/apiClient';
import {
  Profile,
  PublicProfile,
  UpdateProfileData,
  FollowResponse,
  XpResponse,
  StreakResponse,
  WeeklyAnalytics,
} from '../../features/profile/types';

/**
 * Profile Service for managing user profiles and interactions
 */
class ProfileService {
  /**
   * Get current user's profile
   */
  async getMyProfile(): Promise<ApiResponse<Profile>> {
    return apiClient.get<Profile>('/profile/me', true);
  }

  /**
   * Get another user's public profile
   */
  async getProfile(userId: string): Promise<ApiResponse<PublicProfile>> {
    return apiClient.get<PublicProfile>(`/profile/${userId}`, true);
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username: string): Promise<ApiResponse<PublicProfile>> {
    return apiClient.get<PublicProfile>(`/profile/username/${username}`, true);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<Profile>> {
    return apiClient.put<Profile>('/profile/me', data, true);
  }

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<ApiResponse<FollowResponse>> {
    return apiClient.post<FollowResponse>(`/profile/${userId}/follow`, undefined, true);
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<ApiResponse<FollowResponse>> {
    return apiClient.delete<FollowResponse>(`/profile/${userId}/follow`, true);
  }

  /**
   * Get user's followers
   */
  async getFollowers(
    userId: string,
    params: { limit?: number; cursor?: string } = {}
  ): Promise<ApiResponse<{ followers: PublicProfile[]; nextCursor?: string }>> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const queryString = queryParams.toString();
    const endpoint = `/profile/${userId}/followers${queryString ? `?${queryString}` : ''}`;

    return apiClient.get(endpoint, false);
  }

  /**
   * Get users that the user follows
   */
  async getFollowing(
    userId: string,
    params: { limit?: number; cursor?: string } = {}
  ): Promise<ApiResponse<{ following: PublicProfile[]; nextCursor?: string }>> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const queryString = queryParams.toString();
    const endpoint = `/profile/${userId}/following${queryString ? `?${queryString}` : ''}`;

    return apiClient.get(endpoint, false);
  }

  /**
   * Add XP to user (internal use - called by backend)
   */
  async addXp(amount: number): Promise<ApiResponse<XpResponse>> {
    return apiClient.post<XpResponse>('/profile/me/xp', { amount }, true);
  }

  /**
   * Update daily streak (internal use - called by backend)
   */
  async updateStreak(): Promise<ApiResponse<StreakResponse>> {
    return apiClient.post<StreakResponse>('/profile/me/streak', undefined, true);
  }

  /**
   * Get weekly analytics for the current user
   */
  async getWeeklyAnalytics(): Promise<ApiResponse<WeeklyAnalytics>> {
    return apiClient.get<WeeklyAnalytics>('/profile/me/weekly-analytics', true);
  }
}

export const profileService = new ProfileService();
