import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';

interface Props {
  progressPercent: number;
  currentStep?: string;
}

export const ProgressCard: React.FC<Props> = ({ progressPercent, currentStep }) => {
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Progress</Text>
        <Text style={styles.percent}>{clampedProgress}%</Text>
      </View>
      <View style={styles.barOuter}>
        <View style={[styles.barInner, { width: `${clampedProgress}%` }]} />
      </View>
      {currentStep && (
        <Text style={styles.step}>{formatStep(currentStep)}</Text>
      )}
    </View>
  );
};

function formatStep(step: string): string {
  return step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: adminColors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  percent: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: adminColors.primary,
  },
  barOuter: {
    height: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barInner: {
    height: 8,
    backgroundColor: adminColors.primary,
    borderRadius: 4,
  },
  step: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
