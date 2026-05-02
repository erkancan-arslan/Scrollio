/**
 * WeeklyAnalyticsCard
 * Shows a summary of the user's activity for the current week:
 * videos watched, watch time, quiz accuracy, and topic distribution.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WeeklyAnalytics } from '../types';

interface WeeklyAnalyticsCardProps {
  analytics: WeeklyAnalytics;
}

const BRAND = '#FF8C42';
const MAX_VISIBLE_TOPICS = 5;

function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (start.toDateString() === today.toDateString()) {
    return 'Today only';
  }

  const endDisplay = end > today ? today : end;
  return `${start.toLocaleDateString('en-US', opts)} – ${endDisplay.toLocaleDateString('en-US', opts)}`;
}

export const WeeklyAnalyticsCard: React.FC<WeeklyAnalyticsCardProps> = ({ analytics }) => {
  const [expanded, setExpanded] = useState(false);

  const {
    weekStart,
    videosWatched,
    totalWatchTimeSeconds,
    quizAccuracy,
    quizAttempts,
    topicDistribution,
  } = analytics;

  const visibleTopics = expanded
    ? topicDistribution
    : topicDistribution.slice(0, MAX_VISIBLE_TOPICS);
  const hiddenCount = topicDistribution.length - MAX_VISIBLE_TOPICS;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.dateRange}>{formatDateRange(weekStart)}</Text>
      </View>

      {/* Stats Pills */}
      <View style={styles.pillsRow}>
        <View style={styles.pill}>
          <Text style={styles.pillValue}>{videosWatched}</Text>
          <Text style={styles.pillLabel}>Videos</Text>
        </View>
        <View style={styles.pillDivider} />
        <View style={styles.pill}>
          <Text style={styles.pillValue}>{formatWatchTime(totalWatchTimeSeconds)}</Text>
          <Text style={styles.pillLabel}>Watch time</Text>
        </View>
        <View style={styles.pillDivider} />
        <View style={styles.pill}>
          {quizAccuracy !== null ? (
            <Text style={styles.pillValue}>{quizAccuracy}%</Text>
          ) : (
            <Text style={[styles.pillValue, styles.pillValueMuted]}>—</Text>
          )}
          <Text style={styles.pillLabel}>
            {quizAccuracy !== null ? `Quiz (${quizAttempts})` : 'No quizzes'}
          </Text>
        </View>
      </View>

      {/* Topic Distribution */}
      {topicDistribution.length > 0 ? (
        <View style={styles.topicsSection}>
          <Text style={styles.topicsSectionTitle}>Topics this week</Text>
          {visibleTopics.map((item) => (
            <View key={item.topic} style={styles.topicRow}>
              <Text style={styles.topicName} numberOfLines={1}>
                {item.topic}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${item.percentage}%` }]} />
              </View>
              <Text style={styles.topicPct}>{item.percentage}%</Text>
            </View>
          ))}
          {!expanded && hiddenCount > 0 && (
            <TouchableOpacity onPress={() => setExpanded(true)} style={styles.moreBtn}>
              <Text style={styles.moreBtnText}>and {hiddenCount} more</Text>
            </TouchableOpacity>
          )}
          {expanded && hiddenCount > 0 && (
            <TouchableOpacity onPress={() => setExpanded(false)} style={styles.moreBtn}>
              <Text style={styles.moreBtnText}>Show less</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.emptyTopics}>No videos watched this week yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateRange: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  pillsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8D6',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pillDivider: {
    width: 1,
    backgroundColor: '#FFE8D6',
  },
  pillValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND,
    marginBottom: 2,
  },
  pillValueMuted: {
    color: '#BBBBBB',
  },
  pillLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '500',
  },
  topicsSection: {
    gap: 10,
  },
  topicsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicName: {
    width: 90,
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: BRAND,
    borderRadius: 4,
  },
  topicPct: {
    width: 36,
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'right',
  },
  moreBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  moreBtnText: {
    fontSize: 12,
    color: BRAND,
    fontWeight: '600',
  },
  emptyTopics: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
