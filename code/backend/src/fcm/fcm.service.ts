import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Register FCM token for a user
   */
  async registerToken(
    userId: string,
    token: string,
    deviceId?: string,
    deviceType?: string,
  ) {
    try {
      const supabase = this.supabaseService.getClient();

      // Upsert token (update if exists, insert if not)
      const { data, error } = await supabase
        .from('fcm_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            device_id: deviceId,
            device_type: deviceType,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: 'token',
          },
        )
        .select()
        .single();

      if (error) {
        this.logger.error('Error registering FCM token:', error);
        throw new Error(`Failed to register token: ${error.message}`);
      }

      return {
        success: true,
        tokenId: data.id,
      };
    } catch (error) {
      this.logger.error('Register token error:', error);
      throw error;
    }
  }

  /**
   * Unregister FCM token
   */
  async unregisterToken(token: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase.from('fcm_tokens').delete().eq('token', token);

      if (error) {
        this.logger.error('Error unregistering FCM token:', error);
        throw new Error(`Failed to unregister token: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Unregister token error:', error);
      throw error;
    }
  }

  /**
   * Get all tokens for a user
   */
  async getUserTokens(userId: string): Promise<string[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) {
        this.logger.error('Error fetching user tokens:', error);
        return [];
      }

      return data?.map((t) => t.token) || [];
    } catch (error) {
      this.logger.error('Get user tokens error:', error);
      return [];
    }
  }

  /**
   * Send push notification to user
   * NOTE: This is a placeholder. Firebase Admin SDK integration needed.
   * See CHAT_IMPLEMENTATION_GUIDE.md for full implementation.
   */
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      const tokens = await this.getUserTokens(userId);

      if (tokens.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${userId}`);
        return { success: false, reason: 'No tokens' };
      }

      // TODO: Implement Firebase Admin SDK
      // See: code/backend/src/firebase/firebase-admin.service.ts (to be created)
      // 
      // Example:
      // import { messaging } from '../firebase/firebase-admin.service';
      // await messaging.sendEachForMulticast({
      //   tokens,
      //   notification: { title, body },
      //   data,
      // });

      this.logger.log(
        `[PLACEHOLDER] Would send notification to ${tokens.length} devices`,
      );
      this.logger.log(`Title: ${title}, Body: ${body}`);

      return {
        success: true,
        sentToDevices: tokens.length,
      };
    } catch (error) {
      this.logger.error('Send notification error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired/invalid tokens
   */
  async cleanupOldTokens() {
    try {
      const supabase = this.supabaseService.getClient();

      // Delete tokens not used in 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .lt('last_used_at', thirtyDaysAgo.toISOString());

      if (error) {
        this.logger.error('Error cleaning up old tokens:', error);
      } else {
        this.logger.log('Successfully cleaned up old FCM tokens');
      }
    } catch (error) {
      this.logger.error('Cleanup tokens error:', error);
    }
  }
}
