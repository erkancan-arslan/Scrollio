/**
 * DailyMission — Single mission card with progress and reward info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface DailyMissionProps {
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  isCompleted: boolean;
}

export const DailyMission: React.FC<DailyMissionProps> = ({
  title,
  description,
  target,
  current,
  xpReward,
  isCompleted,
}) => {
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <View style={[styles.card, isCompleted && styles.cardDone]}>
      <View style={styles.info}>
        <Text style={styles.title}>
          {isCompleted ? '✅ ' : ''}{title}
        </Text>
        <Text style={styles.desc}>{description}</Text>
        <View style={styles.progressRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{current}/{target}</Text>
        </View>
      </View>
      <View style={styles.reward}>
        <Text style={styles.xpValue}>+{xpReward}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardDone: { opacity: 0.6 },
  info: { flex: 1 },
  title: { ...kidsTypography.body, fontWeight: '700', color: kidsColors.text.primary, marginBottom: 4 },
  desc: { ...kidsTypography.caption, color: kidsColors.text.secondary, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 6, backgroundColor: kidsColors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: kidsColors.success, borderRadius: 3 },
  progressText: { ...kidsTypography.caption, color: kidsColors.text.muted, width: 36 },
  reward: { justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  xpValue: { ...kidsTypography.heading3, color: kidsColors.xp },
  xpLabel: { ...kidsTypography.caption, color: kidsColors.xp },
});
