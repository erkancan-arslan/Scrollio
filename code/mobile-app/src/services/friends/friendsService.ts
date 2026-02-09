/**
 * Friends Service
 * Handles friend requests and friend management
 */

import { apiClient } from '../api/apiClient';

// Types
export interface FriendProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  last_active_date: string | null;
  friendship_id: string;
  created_at: string;
}

export interface PendingRequest {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  requested_at: string;
  friendship_id: string;
}

export interface FriendsListResponse {
  friends: FriendProfile[];
  total: number;
}

export interface PendingRequestsResponse {
  requests: PendingRequest[];
  total: number;
}

/**
 * Friends Service
 */
class FriendsService {
  /**
   * Get list of friends
   */
  async getFriends(): Promise<{
    success: boolean;
    data?: FriendsListResponse;
    error?: string;
  }> {
    const response = await apiClient.get<FriendsListResponse>('/friends');

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch friends',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(): Promise<{
    success: boolean;
    data?: PendingRequestsResponse;
    error?: string;
  }> {
    const response = await apiClient.get<PendingRequestsResponse>(
      '/friends/requests/pending',
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch pending requests',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Get sent friend requests
   */
  async getSentRequests(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    const response = await apiClient.get<any>('/friends/requests/sent');

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch sent requests',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(
    friendId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post<any>('/friends/request', {
      friendId,
    });

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to send friend request',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(
    friendshipId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.patch<any>(
      `/friends/request/${friendshipId}`,
      {
        friendshipId,
        status: 'accepted',
      },
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to accept friend request',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(
    friendshipId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.patch<any>(
      `/friends/request/${friendshipId}`,
      {
        friendshipId,
        status: 'rejected',
      },
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to reject friend request',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Remove a friend or cancel a request
   */
  async removeFriend(
    friendshipId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.delete<any>(`/friends/${friendshipId}`);

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to remove friend',
      };
    }

    return {
      success: true,
    };
  }
}

export const friendsService = new FriendsService();
