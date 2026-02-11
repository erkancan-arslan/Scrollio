/**
 * Kids Settings API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface SettingsResponse {
  pushNotificationsEnabled: boolean;
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string | null;
}

/** GET /api/v1/kids/settings */
export const getSettings = async (): Promise<KidsApiResponse<SettingsResponse>> => {
  return kidsApi.get<SettingsResponse>('/kids/settings');
};

/** PATCH /api/v1/kids/settings/notifications */
export const updateNotifications = async (
  prefs: Partial<{
    pushNotificationsEnabled: boolean;
    soundEnabled: boolean;
    dailyReminderEnabled: boolean;
    reminderTime: string | null;
  }>,
): Promise<KidsApiResponse<SettingsResponse>> => {
  return kidsApi.patch<SettingsResponse>('/kids/settings/notifications', prefs);
};
