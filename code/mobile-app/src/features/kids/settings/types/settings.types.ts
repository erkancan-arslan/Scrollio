/**
 * Kids Settings Feature Types
 * Type definitions for kids app settings and notification preferences
 */

export interface KidsSettings {
  id: string;
  childProfileId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  autoPlayVideos: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  notificationPrefs: KidsNotificationPrefs;
  createdAt: string;
  updatedAt: string;
}

export interface KidsNotificationPrefs {
  id: string;
  childProfileId: string;
  dailyReminder: boolean;
  dailyReminderTime: string;
  newContentAlerts: boolean;
  quizReminders: boolean;
  streakReminders: boolean;
  missionAlerts: boolean;
  rewardNotifications: boolean;
  parentMessages: boolean;
  createdAt: string;
  updatedAt: string;
}
