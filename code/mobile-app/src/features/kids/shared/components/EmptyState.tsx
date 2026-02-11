import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../constants/colors';
import { kidsTypography } from '../constants/typography';
import { KidsThemedButton } from './KidsThemedButton';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = '📭',
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <KidsThemedButton
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.button}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    ...kidsTypography.heading2,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    marginTop: 8,
  },
});
