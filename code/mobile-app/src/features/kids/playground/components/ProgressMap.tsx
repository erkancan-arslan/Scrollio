/**
 * ProgressMap — Visual level/XP progress display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface ProgressMapProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export const ProgressMap: React.FC<ProgressMapProps> = ({
  level,
  xp,
  xpToNextLevel,
}) => {
  const percent = xpToNextLevel > 0 ? Math.round((xp / xpToNextLevel) * 100) : 0;

  // Show milestone markers for achieved levels
  const milestones = Array.from({ length: Math.min(level, 10) }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {/* Level badge */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelNumber}>{level}</Text>
        <Text style={styles.levelLabel}>Level</Text>
      </View>

      {/* XP progress bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.xpLabel}>{xp} / {xpToNextLevel} XP</Text>
      </View>

      {/* Milestone markers */}
      <View style={styles.milestoneRow}>
        {milestones.map((m) => (
          <View key={m} style={styles.milestone}>
            <Text style={styles.milestoneIcon}>⭐</Text>
            <Text style={styles.milestoneLabel}>{m}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  levelBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: kidsColors.xp,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  levelLabel: { ...kidsTypography.caption, color: '#FFF', fontWeight: '600', marginTop: -2 },
  barContainer: { width: '100%' },
  barBg: { height: 10, backgroundColor: kidsColors.border, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: kidsColors.xp, borderRadius: 5 },
  xpLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, textAlign: 'right', marginTop: 4 },
  milestoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  milestone: { alignItems: 'center' },
  milestoneIcon: { fontSize: 18 },
  milestoneLabel: { ...kidsTypography.caption, color: kidsColors.text.muted },
});
