/**
 * RoleBlockedMessage — Displays a message when user lacks required role
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface RoleBlockedMessageProps {
  requiredRole?: string;
  message?: string;
}

export const RoleBlockedMessage: React.FC<RoleBlockedMessageProps> = ({
  requiredRole = 'parent',
  message,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.message}>
        {message ?? `A ${requiredRole} account is required to access Kids features. Please upgrade your account to continue.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 32, gap: 12 },
  icon: { fontSize: 56 },
  title: { ...kidsTypography.heading2, color: kidsColors.text.primary, textAlign: 'center' },
  message: { ...kidsTypography.body, color: kidsColors.text.secondary, textAlign: 'center', lineHeight: 22 },
});
