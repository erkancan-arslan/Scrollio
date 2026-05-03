/**
 * KidsActivityMonitorScreen — Activity timeline view
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchActivityThunk } from '../store/parentalSlice';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { EmptyState } from '../../shared/components/EmptyState';

const EVENT_ICONS: Record<string, string> = {
  video_view: '📺',
  quiz_attempt: '📝',
  bookmark_added: '❤️',
  bookmark_removed: '💔',
  drawing_uploaded: '🎨',
  mission_completed: '🎯',
  topics_selected: '📚',
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
};

const formatEventType = (type: string): string => {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const KidsActivityMonitorScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activities, isLoading } = useAppSelector((s) => s.kidsParental);
  const { childId } = useActiveChild();

  useEffect(() => {
    if (childId) {
      dispatch(fetchActivityThunk());
    }
  }, [dispatch, childId]);

  if (isLoading && activities.length === 0) {
    return <LoadingSpinner message="Loading activity..." />;
  }

  if (activities.length === 0) {
    return <EmptyState title="No Activity" message="No activity recorded yet." icon="📊" />;
  }

  const renderItem = ({ item }: { item: typeof activities[0] }) => (
    <View style={styles.entry}>
      <Text style={styles.icon}>{EVENT_ICONS[item.event_type] ?? '📌'}</Text>
      <View style={styles.entryInfo}>
        <Text style={styles.entryType}>{formatEventType(item.event_type)}</Text>
        <Text style={styles.entryTime}>{formatTime(item.created_at)}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.content}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  icon: { fontSize: 28, marginRight: 12 },
  entryInfo: { flex: 1 },
  entryType: { ...kidsTypography.body, color: kidsColors.text.primary, fontWeight: '600' },
  entryTime: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
});
