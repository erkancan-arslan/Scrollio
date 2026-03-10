import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { StatusBadge } from './StatusBadge';
import { ReferenceVideo } from '../types/admin.types';

interface Props {
  video: ReferenceVideo;
  onPress: () => void;
}

export const ReferenceVideoCard: React.FC<Props> = ({ video, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {video.thumbnail_url ? (
        <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumb]}>
          <Text style={styles.placeholderText}>🎬</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{video.title}</Text>
        <View style={styles.row}>
          <Text style={styles.meta}>{video.language.toUpperCase()}</Text>
          {video.audience_tag && (
            <Text style={styles.meta}> · {video.audience_tag}</Text>
          )}
          {video.persona_name && (
            <Text style={styles.meta}> · {video.persona_name}</Text>
          )}
        </View>
        <StatusBadge status={video.status} size="sm" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: adminColors.background,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  thumbnail: {
    width: 72,
    height: 54,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
  },
  placeholderThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});
