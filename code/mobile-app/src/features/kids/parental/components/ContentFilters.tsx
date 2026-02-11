/**
 * ContentFilters — Controls for content filtering and restrictions
 */

import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'All' },
];

interface ContentFiltersProps {
  safeSearchEnabled: boolean;
  maxDifficulty: string;
  onToggleSafeSearch: (value: boolean) => void;
  onSetDifficulty: (value: string) => void;
}

export const ContentFilters: React.FC<ContentFiltersProps> = ({
  safeSearchEnabled,
  maxDifficulty,
  onToggleSafeSearch,
  onSetDifficulty,
}) => {
  return (
    <View style={styles.container}>
      {/* Safe Search */}
      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <Text style={styles.label}>Safe Search</Text>
          <Text style={styles.desc}>Filter inappropriate content</Text>
        </View>
        <Switch
          value={safeSearchEnabled}
          onValueChange={onToggleSafeSearch}
          trackColor={{ false: kidsColors.border, true: kidsColors.success + '80' }}
          thumbColor={safeSearchEnabled ? kidsColors.success : '#CCC'}
        />
      </View>

      {/* Difficulty */}
      <View style={styles.section}>
        <Text style={styles.label}>Max Difficulty</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_LEVELS.map((level) => (
            <KidsThemedButton
              key={level.value}
              title={level.label}
              variant={maxDifficulty === level.value ? 'primary' : 'outline'}
              onPress={() => onSetDifficulty(level.value)}
              style={styles.diffBtn}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInfo: { flex: 1, marginRight: 12 },
  label: { ...kidsTypography.body, color: kidsColors.text.primary, fontWeight: '600' },
  desc: { ...kidsTypography.caption, color: kidsColors.text.secondary, marginTop: 2 },
  section: { gap: 8 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  diffBtn: { flex: 1 },
});
