import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserSearchResult, SearchUsersResponse } from './dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Search for users by display name or email
   */
  async searchUsers(
    userId: string,
    searchTerm: string,
    limit: number = 20,
  ): Promise<SearchUsersResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      // Call the Supabase RPC function to search users
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        requesting_user_id: userId,
        result_limit: limit,
      });

      if (error) {
        this.logger.error('Error searching users:', error);
        throw new Error(`Failed to search users: ${error.message}`);
      }

      const users: UserSearchResult[] = data || [];

      return {
        users,
        total: users.length,
      };
    } catch (error) {
      this.logger.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string, targetUserId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, level, xp, last_active_date')
        .eq('id', targetUserId)
        .single();

      if (error) {
        this.logger.error('Error fetching user:', error);
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      // Get friendship status
      const { data: statusData } = await supabase.rpc('get_friendship_status', {
        requesting_user_id: userId,
        target_user_id: targetUserId,
      });

      return {
        ...data,
        friendship_status: statusData || 'none',
      };
    } catch (error) {
      this.logger.error('Get user by ID error:', error);
      throw error;
    }
  }
}
