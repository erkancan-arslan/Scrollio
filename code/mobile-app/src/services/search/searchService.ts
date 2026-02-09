/**
 * Search Service
 * Handles user search operations
 */

import { apiClient } from '../api/apiClient';

// Types
export interface UserSearchResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  friendship_status: 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked';
}

export interface SearchUsersResponse {
  users: UserSearchResult[];
  total: number;
}

/**
 * Search Service
 */
class SearchService {
  /**
   * Search for users by display name or email
   */
  async searchUsers(
    query: string,
    limit: number = 20,
  ): Promise<{ success: boolean; data?: SearchUsersResponse; error?: string }> {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: { users: [], total: 0 },
      };
    }

    const response = await apiClient.get<SearchUsersResponse>(
      `/search/users?query=${encodeURIComponent(query)}&limit=${limit}`,
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to search users',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Get user profile by ID
   */
  async getUserById(
    userId: string,
  ): Promise<{ success: boolean; data?: UserSearchResult; error?: string }> {
    const response = await apiClient.get<UserSearchResult>(
      `/search/users/${userId}`,
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch user',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }
}

export const searchService = new SearchService();
