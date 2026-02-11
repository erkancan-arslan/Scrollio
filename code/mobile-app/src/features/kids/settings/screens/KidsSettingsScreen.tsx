/**
 * KidsSettingsScreen — App settings, notifications, and navigation to parental controls
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../../../store/hooks';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { getSettings, updateNotifications } from '../services/settingsApi';
import { NotificationPrefs } from '../components/NotificationPrefs';
import { SettingsMenu } from '../components/SettingsMenu';
import { LogOutButton } from '../components/LogOutButton';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

interface SettingsData {
  pushNotificationsEnabled: boolean;
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string | null;
}

export const KidsSettingsScreen: React.FC = () => {
  const navigation = useNavigation<{ navigate: (s: string) => void }>();
  const { childProfile } = useActiveChild();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const res = await getSettings();
    if (res.data) {
      setSettings(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (key: string, value: boolean) => {
    // Optimistic update
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    const res = await updateNotifications({ [key]: value });
    if (res.error) {
      // Revert
      setSettings((prev) => prev ? { ...prev, [key]: !value } : prev);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };

  const handleNavigate = (screen: string) => {
    if (screen === 'parental') {
      navigation.navigate('KidsParentalDashboard' as never);
    } else if (screen === 'topics') {
      navigation.navigate('KidsProfile' as never);
    } else if (screen === 'avatar') {
      navigation.navigate('KidsProfile' as never);
    }
  };

  if (isLoading && !settings) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>
            {childProfile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{childProfile?.displayName ?? 'Child'}</Text>
      </View>

      {/* Navigation Menu */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Menu</Text>
        <SettingsMenu onNavigate={handleNavigate} />
      </View>

      {/* Notification Preferences */}
      {settings && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <NotificationPrefs
            pushNotificationsEnabled={settings.pushNotificationsEnabled}
            soundEnabled={settings.soundEnabled}
            dailyReminderEnabled={settings.dailyReminderEnabled}
            onToggle={handleToggle}
          />
        </View>
      )}

      {/* Log Out */}
      <View style={styles.logoutSection}>
        <LogOutButton />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: kidsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 36, color: '#FFF', fontWeight: 'bold' },
  name: { ...kidsTypography.heading2, color: kidsColors.text.primary },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 8 },
  logoutSection: { marginTop: 16 },
});
