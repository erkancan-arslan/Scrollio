import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../constants/colors';
import { kidsTypography } from '../constants/typography';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  color = kidsColors.primary,
  fullScreen = true,
}) => {
  return (
    <View style={[styles.container, !fullScreen && styles.inline]}>
      <ActivityIndicator
        size={size}
        color={color}
        accessibilityLabel="Loading"
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: kidsColors.background,
  },
  inline: {
    flex: 0,
    padding: 24,
    backgroundColor: 'transparent',
  },
  message: {
    marginTop: 12,
    ...kidsTypography.body,
    color: kidsColors.primary,
    fontWeight: '600',
  },
});
