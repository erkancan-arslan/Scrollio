/**
 * RewardBadge — Visual badge for earned rewards
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface RewardBadgeProps {
  title: string;
  icon?: string;
  isEarned?: boolean;
}

export const RewardBadge: React.FC<RewardBadgeProps> = ({
  title,
  icon = '⭐',
  isEarned = true,
}) => {
  return (
    <View style={[styles.badge, !isEarned && styles.locked]}>
      <Text style={styles.icon}>{isEarned ? icon : '🔒'}</Text>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 80,
    height: 90,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  locked: { opacity: 0.4 },
  icon: { fontSize: 32, marginBottom: 4 },
  title: { ...kidsTypography.caption, color: kidsColors.text.muted, textAlign: 'center' },
});
