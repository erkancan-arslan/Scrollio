/**
 * ActivityTimeline — Chronological list of child activities
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface ActivityEntry {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivityTimelineProps {
  activities: ActivityEntry[];
}

const EVENT_ICONS: Record<string, string> = {
  video_view: '📺',
  quiz_attempt: '📝',
  bookmark_added: '❤️',
  bookmark_removed: '💔',
  drawing_uploaded: '🎨',
  mission_completed: '🎯',
  voice_command: '🎤',
  topics_selected: '📚',
};

const formatRelativeTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const formatEvent = (type: string): string =>
  type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No activity yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.entry}>
          <View style={styles.timelineDot} />
          <Text style={styles.icon}>{EVENT_ICONS[item.event_type] ?? '📌'}</Text>
          <View style={styles.entryInfo}>
            <Text style={styles.entryType}>{formatEvent(item.event_type)}</Text>
            <Text style={styles.entryTime}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderLeftWidth: 2,
    borderLeftColor: kidsColors.border,
    paddingLeft: 16,
    marginLeft: 8,
  },
  timelineDot: {
    position: 'absolute',
    left: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: kidsColors.primary,
  },
  icon: { fontSize: 22, marginRight: 10 },
  entryInfo: { flex: 1 },
  entryType: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600' },
  entryTime: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
});
