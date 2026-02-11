/**
 * LearningHistory — Scrollable list of recently viewed content
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface HistoryEntry {
  id: string;
  title?: string;
  contentType?: string;
  watchedAt?: string;
}

interface LearningHistoryProps {
  history: HistoryEntry[];
}

const formatTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.round((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.round(diffH / 24)}d ago`;
};

export const LearningHistory: React.FC<LearningHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No learning history yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.entry}>
          <Text style={styles.typeIcon}>
            {item.contentType === 'video' ? '📺' : '📄'}
          </Text>
          <View style={styles.entryInfo}>
            <Text style={styles.entryTitle} numberOfLines={1}>
              {item.title ?? 'Untitled'}
            </Text>
            <Text style={styles.entryTime}>{formatTime(item.watchedAt)}</Text>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  empty: { padding: 16, alignItems: 'center' },
  emptyText: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: kidsColors.border,
    gap: 10,
  },
  typeIcon: { fontSize: 22 },
  entryInfo: { flex: 1 },
  entryTitle: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600' },
  entryTime: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
});
