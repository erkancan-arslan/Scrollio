/**
 * MultiProfileSwitcher — Horizontal bar to switch between child profiles
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { ChildProfile } from '../../shared/types';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface MultiProfileSwitcherProps {
  profiles: ChildProfile[];
  activeChildId: string | null;
  onSwitch: (childId: string) => void;
}

export const MultiProfileSwitcher: React.FC<MultiProfileSwitcherProps> = ({
  profiles,
  activeChildId,
  onSwitch,
}) => {
  if (profiles.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {profiles.map((profile) => {
        const isActive = profile.id === activeChildId;
        const initial = profile.displayName?.charAt(0)?.toUpperCase() ?? '?';
        return (
          <TouchableOpacity
            key={profile.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSwitch(profile.id)}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${profile.displayName}`}
          >
            <View style={[styles.avatar, isActive && styles.avatarActive]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
              {profile.displayName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 10, paddingVertical: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: kidsColors.primary, backgroundColor: kidsColors.primary + '10' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: kidsColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: { backgroundColor: kidsColors.primary },
  avatarText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  name: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '600' },
  nameActive: { color: kidsColors.primary },
});
