/**
 * LogOutButton — Button to sign out of the kids profile.
 * After logout, resets the Kids stack to the login screen.
 * Uses window.confirm on web (Alert.alert doesn't support callbacks on web).
 */

import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch } from '../../../../store/hooks';
import { logoutThunk } from '../../auth/store/authSlice';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

interface LogOutButtonProps {
  onLogout?: () => void;
}

export const LogOutButton: React.FC<LogOutButtonProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const performLogout = async () => {
    setIsLoading(true);
    try {
      await dispatch(logoutThunk()).unwrap();
      onLogout?.();
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'KidsLogin' }] }),
      );
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Failed to log out. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // window.confirm works synchronously on web
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        performLogout();
      }
    } else {
      // Native: use Alert.alert with callbacks
      const { Alert } = require('react-native');
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: performLogout },
        ],
      );
    }
  };

  return (
    <KidsThemedButton
      title="Log Out"
      variant="danger"
      onPress={handleLogout}
      loading={isLoading}
    />
  );
};
