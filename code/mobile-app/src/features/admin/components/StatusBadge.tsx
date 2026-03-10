import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#E0E0E0', text: '#666666' },
  queued: { bg: '#BBDEFB', text: '#1565C0' },
  processing: { bg: '#FFE0B2', text: '#E65100' },
  published: { bg: '#C8E6C9', text: '#2E7D32' },
  failed: { bg: '#FFCDD2', text: '#C62828' },
  ready: { bg: '#C8E6C9', text: '#2E7D32' },
  active: { bg: '#C8E6C9', text: '#2E7D32' },
  hidden: { bg: '#E0E0E0', text: '#666666' },
  archived: { bg: '#D7CCC8', text: '#4E342E' },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const colorSet = STATUS_COLORS[status] || STATUS_COLORS.draft;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: colorSet.text }, isSmall && styles.textSmall]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  textSmall: {
    fontSize: 10,
  },
});
