/**
 * NotificationPrefs — Toggle controls for notification preferences
 */

import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface NotificationPrefsProps {
  pushNotificationsEnabled: boolean;
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  onToggle: (key: string, value: boolean) => void;
}

const SettingRow: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}> = ({ label, description, value, onValueChange }) => (
  <View style={styles.row}>
    <View style={styles.rowInfo}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: kidsColors.border, true: kidsColors.success + '80' }}
      thumbColor={value ? kidsColors.success : '#CCC'}
    />
  </View>
);

export const NotificationPrefs: React.FC<NotificationPrefsProps> = ({
  pushNotificationsEnabled,
  soundEnabled,
  dailyReminderEnabled,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      <SettingRow
        label="Push Notifications"
        description="Receive notifications about new content and achievements"
        value={pushNotificationsEnabled}
        onValueChange={(v) => onToggle('pushNotificationsEnabled', v)}
      />
      <SettingRow
        label="Sound Effects"
        description="Play sounds when completing actions"
        value={soundEnabled}
        onValueChange={(v) => onToggle('soundEnabled', v)}
      />
      <SettingRow
        label="Daily Reminder"
        description="Get a reminder to learn something new each day"
        value={dailyReminderEnabled}
        onValueChange={(v) => onToggle('dailyReminderEnabled', v)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: kidsColors.border,
  },
  rowInfo: { flex: 1, marginRight: 12 },
  rowLabel: { ...kidsTypography.body, color: kidsColors.text.primary, fontWeight: '600' },
  rowDesc: { ...kidsTypography.caption, color: kidsColors.text.secondary, marginTop: 2 },
});
