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
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { KidsTabCompositeNavigation } from '../../../../navigation/KidsNavigator';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { useAppDispatch } from '../../../../store/hooks';
import { verifyPinThunk } from '../../auth/store/authSlice';
import { PinPad } from '../../auth/components/PinPad';
import { getSettings, updateNotifications } from '../services/settingsApi';
import { NotificationPrefs } from '../components/NotificationPrefs';
import { SettingsMenu } from '../components/SettingsMenu';
import { LogOutButton } from '../components/LogOutButton';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

interface SettingsData {
  pushNotificationsEnabled: boolean;
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string | null;
}

export const KidsSettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<KidsTabCompositeNavigation>();
  const dispatch = useAppDispatch();
  const { childProfile, childId } = useActiveChild();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

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
    if (screen === 'topics') {
      navigation.navigate('KidsTopicPreferences');
    } else if (screen === 'mascot') {
      if (!childId) {
        Alert.alert('No profile', 'Select a child profile first.');
        return;
      }
      navigation.navigate('KidsCharacterSelect', { childId, afterSave: 'go-back' });
    } else if (screen === 'avatar') {
      navigation.navigate('KidsProfile');
    }
  };

  const handleParentalPress = () => {
    setShowPinModal(true);
    setPinError(null);
  };

  const handlePinComplete = async (pin: string) => {
    try {
      const result = await dispatch(verifyPinThunk(pin)).unwrap();
      if (result.valid) {
        setShowPinModal(false);
        navigation.navigate('KidsParentalDashboard');
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } catch {
      setPinError('Failed to verify PIN.');
    }
  };

  if (isLoading && !settings) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  const contentPaddingBottom = 80 + insets.bottom;
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}>
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

      {/* Parental Controls Shortcut */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Parental Settings</Text>
        <KidsThemedButton
          title="🔒 Parent Dashboard"
          onPress={handleParentalPress}
          variant="outline"
        />
      </View>

      {/* Log Out */}
      <View style={styles.logoutSection}>
        <LogOutButton />
      </View>

      {/* PIN Modal */}
      <Modal visible={showPinModal} animationType="slide" transparent={false} onRequestClose={() => setShowPinModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: kidsColors.background }}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPinModal(false)}>
             <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
          <PinPad
            title="Parent Dashboard"
            subtitle="Enter your PIN to access parental controls"
            onComplete={handlePinComplete}
            error={pinError}
          />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16 },
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
  closeBtn: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  closeBtnText: {
    ...kidsTypography.heading3,
    color: kidsColors.primary,
  },
});
