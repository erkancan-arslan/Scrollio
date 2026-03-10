import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { StatusBadge } from './StatusBadge';
import { GenerationJob } from '../types/admin.types';

interface Props {
  job: GenerationJob;
  onPress: () => void;
}

export const GenerationJobCard: React.FC<Props> = ({ job, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
        <StatusBadge status={job.status} size="sm" />
      </View>
      <Text style={styles.topic} numberOfLines={1}>{job.topic}</Text>
      <View style={styles.footer}>
        <View style={[styles.targetBadge, job.content_target === 'kids' && styles.targetKids]}>
          <Text style={styles.targetText}>{job.content_target.toUpperCase()}</Text>
        </View>
        <Text style={styles.meta}>{job.language.toUpperCase()}</Text>
        {job.status === 'processing' && (
          <Text style={styles.progress}>{job.progress_percent}%</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  topic: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  targetBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetKids: {
    backgroundColor: '#FFF3E0',
  },
  targetText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  progress: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: adminColors.primary,
  },
});
