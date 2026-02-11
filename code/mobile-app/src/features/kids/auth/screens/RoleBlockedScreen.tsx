import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { upgradeRoleThunk, logoutThunk } from '../store/authSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

export const KidsRoleBlockedScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.kidsAuth);

  const handleUpgrade = () => {
    dispatch(upgradeRoleThunk('parent'));
  };

  const handleGoBack = () => {
    dispatch(logoutThunk());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>Parent Account Required</Text>
      <Text style={styles.message}>
        Scrollio Kids is designed for parents and their children. You need a
        parent account to access this section.
      </Text>

      <KidsThemedButton
        title="Upgrade to Parent Account"
        onPress={handleUpgrade}
        loading={isLoading}
        style={styles.button}
      />

      <KidsThemedButton
        title="Go Back"
        onPress={handleGoBack}
        variant="outline"
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: kidsColors.background,
    padding: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    ...kidsTypography.heading2,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
    lineHeight: 24,
  },
  button: {
    marginBottom: 12,
    minWidth: 260,
  },
});
