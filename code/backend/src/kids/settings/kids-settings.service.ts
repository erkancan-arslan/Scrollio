import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateSettingsDto } from './dto';

@Injectable()
export class KidsSettingsService {
  private readonly logger = new Logger(KidsSettingsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get notification / app settings for a child profile.
   */
  async getSettings(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data } = await admin
      .from('kids_notification_settings')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!data) {
      // Return defaults
      return {
        pushNotificationsEnabled: true,
        soundEnabled: true,
        dailyReminderEnabled: false,
        reminderTime: null,
      };
    }

    return {
      pushNotificationsEnabled: data.push_notifications_enabled ?? true,
      soundEnabled: data.sound_enabled ?? true,
      dailyReminderEnabled: data.daily_reminder_enabled ?? false,
      reminderTime: data.reminder_time ?? null,
    };
  }

  /**
   * Update notification settings for a child profile.
   */
  async updateNotifications(childId: string, dto: UpdateSettingsDto) {
    const admin = this.supabaseService.getAdminClient();

    const row: Record<string, unknown> = {
      child_profile_id: childId,
      updated_at: new Date().toISOString(),
    };

    if (dto.pushNotificationsEnabled !== undefined) {
      row.push_notifications_enabled = dto.pushNotificationsEnabled;
    }
    if (dto.soundEnabled !== undefined) {
      row.sound_enabled = dto.soundEnabled;
    }
    if (dto.dailyReminderEnabled !== undefined) {
      row.daily_reminder_enabled = dto.dailyReminderEnabled;
    }
    if (dto.reminderTime !== undefined) {
      row.reminder_time = dto.reminderTime;
    }

    const { error } = await admin
      .from('kids_notification_settings')
      .upsert(row, { onConflict: 'child_profile_id' });

    if (error) {
      this.logger.error(`updateNotifications error: ${error.message}`);
    }

    return this.getSettings(childId);
  }
}
