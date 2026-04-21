import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  FriendsListResponse,
  PendingRequestsResponse,
  FriendProfile,
  PendingRequest,
} from './dto';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

  /**
   * Get list of accepted friends
   */
  async getFriendsList(userId: string): Promise<FriendsListResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.rpc('get_friends_list', {
        requesting_user_id: userId,
      });

      if (error) {
        this.logger.error('Error fetching friends list:', error);
        throw new Error(`Failed to fetch friends: ${error.message}`);
      }

      const friends: FriendProfile[] = data || [];

      return {
        friends,
        total: friends.length,
      };
    } catch (error) {
      this.logger.error('Get friends list error:', error);
      throw error;
    }
  }

  /**
   * Get pending friend requests
   */
  async getPendingRequests(userId: string): Promise<PendingRequestsResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.rpc('get_pending_requests', {
        requesting_user_id: userId,
      });

      if (error) {
        this.logger.error('Error fetching pending requests:', error);
        throw new Error(`Failed to fetch pending requests: ${error.message}`);
      }

      const requests: PendingRequest[] = data || [];

      return {
        requests,
        total: requests.length,
      };
    } catch (error) {
      this.logger.error('Get pending requests error:', error);
      throw error;
    }
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(userId: string, friendId: string) {
    try {
      if (userId === friendId) {
        throw new BadRequestException('Cannot send friend request to yourself');
      }

      const supabase = this.supabaseService.getAdminClient();

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
        .limit(1);

      if (existing && existing.length > 0) {
        const friendship = existing[0];
        if (friendship.status === 'accepted') {
          throw new ConflictException('Already friends with this user');
        } else if (friendship.status === 'pending') {
          throw new ConflictException('Friend request already pending');
        } else if (friendship.status === 'blocked') {
          throw new BadRequestException('Cannot send friend request');
        }
      }

      // Create friend request
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error sending friend request:', error);
        throw new Error(`Failed to send friend request: ${error.message}`);
      }

      return {
        success: true,
        friendship: data,
      };
    } catch (error) {
      this.logger.error('Send friend request error:', error);
      throw error;
    }
  }

  /**
   * Accept or reject a friend request
   */
  async respondToFriendRequest(
    userId: string,
    friendshipId: string,
    status: 'accepted' | 'rejected',
  ) {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Verify the user is the recipient of the request
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('*')
        .eq('id', friendshipId)
        .eq('friend_id', userId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !friendship) {
        throw new NotFoundException('Friend request not found');
      }

      // Update the friendship status
      const { data, error } = await supabase
        .from('friendships')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) {
        this.logger.error('Error responding to friend request:', error);
        throw new Error(`Failed to respond to friend request: ${error.message}`);
      }

      return {
        success: true,
        friendship: data,
      };
    } catch (error) {
      this.logger.error('Respond to friend request error:', error);
      throw error;
    }
  }

  /**
   * Remove a friend or cancel a friend request
   */
  async removeFriend(userId: string, friendshipId: string) {
    try {
      const supabase = this.supabaseService.getAdminClient();

      // Verify the user is part of this friendship
      const { data: friendship, error: fetchError } = await supabase
        .from('friendships')
        .select('*')
        .eq('id', friendshipId)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .single();

      if (fetchError || !friendship) {
        throw new NotFoundException('Friendship not found');
      }

      // Delete the friendship
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        this.logger.error('Error removing friend:', error);
        throw new Error(`Failed to remove friend: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Remove friend error:', error);
      throw error;
    }
  }

  /**
   * Get sent friend requests (requests I sent to others).
   *
   * NOTE: We can't use PostgREST's inline embed `profiles:friend_id (...)`
   * here because `friendships.friend_id` references `auth.users(id)` — not
   * `profiles(id)` — so PostgREST has no foreign-key edge to follow and
   * fails with PGRST200 ("Could not find a relationship between
   * 'friendships' and 'friend_id' in the schema cache"). Instead we do two
   * cheap queries and join in JS. The response shape stays identical so
   * the mobile normalization layer keeps working.
   */
  async getSentRequests(userId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: rows, error } = await supabase
        .from('friendships')
        .select('id, friend_id, requested_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        this.logger.error('Error fetching sent requests:', error);
        throw new Error(`Failed to fetch sent requests: ${error.message}`);
      }

      const friendships = rows || [];
      if (friendships.length === 0) {
        return { requests: [], total: 0 };
      }

      const friendIds = friendships.map((r) => r.friend_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, level, xp')
        .in('id', friendIds);

      if (profilesError) {
        this.logger.error('Error fetching profiles for sent requests:', profilesError);
        throw new Error(
          `Failed to fetch profiles for sent requests: ${profilesError.message}`,
        );
      }

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const requests = friendships.map((row) => ({
        id: row.id,
        friend_id: row.friend_id,
        requested_at: row.requested_at,
        profiles: profileMap.get(row.friend_id) || null,
      }));

      return {
        requests,
        total: requests.length,
      };
    } catch (error) {
      this.logger.error('Get sent requests error:', error);
      throw error;
    }
  }
}
