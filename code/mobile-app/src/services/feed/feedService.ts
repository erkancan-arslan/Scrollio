/**
 * Feed Service
 * Handles all API requests for the video feed
 */

import { apiClient, ApiResponse } from '../api/apiClient';
import {
  FeedResponse,
  TopicsResponse,
  ActionResponse,
  FeedQueryParams,
  Video,
} from '../../features/feed/types';

/**
 * Feed Service for fetching videos and handling user interactions
 */
class FeedService {
  /**
   * Get video feed with optional filters
   */
  async getFeed(params: FeedQueryParams = {}): Promise<ApiResponse<FeedResponse>> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.topicId) queryParams.append('topicId', params.topicId);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);

    const queryString = queryParams.toString();
    const endpoint = `/feed${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<FeedResponse>(endpoint, true);
  }

  /**
   * Get user's bookmarked videos
   */
  async getBookmarkedFeed(
    params: { limit?: number; cursor?: string } = {}
  ): Promise<ApiResponse<FeedResponse>> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const queryString = queryParams.toString();
    const endpoint = `/feed/bookmarks${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<FeedResponse>(endpoint, true);
  }

  /**
   * Get all active topics
   */
  async getTopics(): Promise<ApiResponse<TopicsResponse>> {
    return apiClient.get<TopicsResponse>('/feed/topics', false);
  }

  /**
   * Get a single video by ID
   */
  async getVideo(videoId: string): Promise<ApiResponse<Video>> {
    return apiClient.get<Video>(`/feed/videos/${videoId}`, true);
  }

  /**
   * Like a video
   */
  async likeVideo(videoId: string): Promise<ApiResponse<ActionResponse>> {
    return apiClient.post<ActionResponse>(`/feed/videos/${videoId}/like`, undefined, true);
  }

  /**
   * Unlike a video
   */
  async unlikeVideo(videoId: string): Promise<ApiResponse<ActionResponse>> {
    return apiClient.delete<ActionResponse>(`/feed/videos/${videoId}/like`, true);
  }

  /**
   * Bookmark a video
   */
  async bookmarkVideo(videoId: string): Promise<ApiResponse<ActionResponse>> {
    return apiClient.post<ActionResponse>(`/feed/videos/${videoId}/bookmark`, undefined, true);
  }

  /**
   * Remove bookmark from a video
   */
  async unbookmarkVideo(videoId: string): Promise<ApiResponse<ActionResponse>> {
    return apiClient.delete<ActionResponse>(`/feed/videos/${videoId}/bookmark`, true);
  }

  /**
   * Record a video view
   */
  async recordView(
    videoId: string,
    watchDuration: number,
    completed: boolean
  ): Promise<ApiResponse<ActionResponse>> {
    return apiClient.post<ActionResponse>(
      `/feed/videos/${videoId}/view`,
      { watchDuration, completed },
      true
    );
  }
}

export const feedService = new FeedService();


