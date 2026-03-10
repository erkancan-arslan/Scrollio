import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { StatusBadge } from './StatusBadge';
import { GeneratedVideo } from '../types/admin.types';

interface Props {
  video: GeneratedVideo;
  onPress: () => void;
}

export const GeneratedVideoCard: React.FC<Props> = ({ video, onPress }) => {
  const isPublished = video.feed_items?.some((fi) => fi.is_published);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{video.title}</Text>
        <StatusBadge status={video.status} size="sm" />
      </View>
      <Text style={styles.topic} numberOfLines={1}>{video.topic}</Text>
      <View style={styles.footer}>
        <View style={[styles.targetBadge, video.content_target === 'kids' && styles.targetKids]}>
          <Text style={styles.targetText}>{video.content_target.toUpperCase()}</Text>
        </View>
        <Text style={styles.meta}>{video.language.toUpperCase()}</Text>
        <View style={[styles.publishBadge, isPublished && styles.publishedBadge]}>
          <Text style={[styles.publishText, isPublished && styles.publishedText]}>
            {isPublished ? 'LIVE' : 'UNPUBLISHED'}
          </Text>
        </View>
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
  publishBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publishedBadge: {
    backgroundColor: '#C8E6C9',
  },
  publishText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
  },
  publishedText: {
    color: '#2E7D32',
  },
});
