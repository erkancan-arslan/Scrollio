/**
 * ChildProfileCard — Card displaying child profile summary
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface ChildProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface ChildProfileCardProps {
  child: ChildProfile;
  isActive?: boolean;
  onSelect?: () => void;
}

export const ChildProfileCard: React.FC<ChildProfileCardProps> = ({
  child,
  isActive = false,
  onSelect,
}) => {
  const initial = child.displayName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Select ${child.displayName}`}
    >
      <View style={[styles.avatar, isActive && styles.avatarActive]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
        {child.displayName}
      </Text>
      {isActive && <Text style={styles.activeIndicator}>Active</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: kidsColors.primary,
    backgroundColor: kidsColors.primary + '10',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: kidsColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarActive: {
    backgroundColor: kidsColors.primary,
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  name: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600', textAlign: 'center' },
  nameActive: { color: kidsColors.primary },
  activeIndicator: { ...kidsTypography.caption, color: kidsColors.success, marginTop: 4, fontWeight: '700' },
});
