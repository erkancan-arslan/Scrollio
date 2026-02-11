import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../constants/colors';
import { kidsTypography } from '../constants/typography';
import { KidsThemedButton } from './KidsThemedButton';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Oops!',
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
}) => {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.icon}>😥</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <KidsThemedButton
          title={retryLabel}
          onPress={onRetry}
          variant="primary"
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
    backgroundColor: kidsColors.background,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    ...kidsTypography.heading2,
    color: kidsColors.error,
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
