/**
 * KidsProfileScreen — Child profile with avatar, metrics, topics, and history
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchProfileThunk,
  fetchMetricsThunk,
  fetchSelectedTopicsThunk,
} from '../store/profileSlice';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ErrorScreen } from '../../shared/components/ErrorScreen';

const AVATAR_EMOJIS: Record<string, string> = {
  fox: '🦊', panda: '🐼', unicorn: '🦄', frog: '🐸',
  lion: '🦁', bunny: '🐰', penguin: '🐧', butterfly: '🦋',
  cat: '🐱', dog: '🐶', dragon: '🐉', octopus: '🐙',
};

export const KidsProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { childProfile } = useActiveChild();
  const { profile, metrics, selectedTopics, isLoading, error } = useAppSelector(
    (s) => s.kidsProfile,
  );
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = () => {
    dispatch(fetchProfileThunk());
    dispatch(fetchMetricsThunk());
    dispatch(fetchSelectedTopicsThunk());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchProfileThunk()),
      dispatch(fetchMetricsThunk()),
      dispatch(fetchSelectedTopicsThunk()),
    ]);
    setRefreshing(false);
  };

  if (isLoading && !profile) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error && !profile) {
    return <ErrorScreen message={error} onRetry={loadData} />;
  }

  const avatarConfig = (childProfile?.avatarConfig ?? {}) as { avatarId?: string; avatarEmoji?: string };
  const avatarEmoji = avatarConfig.avatarEmoji || AVATAR_EMOJIS[avatarConfig.avatarId || ''] || '🦊';

  const level = metrics?.level ?? 1;
  const xp = metrics?.currentXp ?? 0;
  const xpToNext = metrics?.xpToNextLevel ?? 100;
  const xpPercent = xpToNext > 0 ? Math.round((xp / xpToNext) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={kidsColors.primary} />
      }
    >
      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
        </View>
        <Text style={styles.displayName}>
          {childProfile?.displayName ?? 'Learner'}
        </Text>
        <Text style={styles.levelBadge}>Level {level}</Text>
      </View>

      {/* XP Progress Bar */}
      <View style={styles.xpSection}>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {xp} / {xpToNext} XP to Level {level + 1}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard icon="📺" label="Videos" value={metrics?.totalVideosWatched ?? 0} />
        <MetricCard icon="📝" label="Quizzes" value={metrics?.totalQuizzesTaken ?? 0} />
        <MetricCard icon="❤️" label="Bookmarks" value={metrics?.totalBookmarks ?? 0} />
        <MetricCard icon="🏆" label="Rewards" value={metrics?.totalRewards ?? 0} />
      </View>

      {/* Selected Topics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Topics</Text>
        {selectedTopics.length > 0 ? (
          <View style={styles.topicsList}>
            {selectedTopics.map((topic) => (
              <View key={topic.id} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{topic.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No topics selected yet. Choose topics to personalize your feed!
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

// ── MetricCard Component ──

const MetricCard: React.FC<{
  icon: string;
  label: string;
  value: number;
}> = ({ icon, label, value }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { paddingBottom: 100 },
  avatarSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 16 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 56 },
  displayName: { ...kidsTypography.heading2, color: kidsColors.text.primary },
  levelBadge: {
    ...kidsTypography.bodySmall,
    color: kidsColors.xp,
    fontWeight: '700',
    marginTop: 4,
    backgroundColor: kidsColors.xp + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  xpSection: { paddingHorizontal: 24, marginTop: 12, marginBottom: 24 },
  xpBarBg: {
    height: 10,
    backgroundColor: kidsColors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 10,
    backgroundColor: kidsColors.xp,
    borderRadius: 5,
  },
  xpText: {
    ...kidsTypography.caption,
    color: kidsColors.text.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  metricIcon: { fontSize: 28, marginBottom: 4 },
  metricValue: { ...kidsTypography.heading2, color: kidsColors.text.primary },
  metricLabel: { ...kidsTypography.caption, color: kidsColors.text.muted },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 12 },
  topicsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    backgroundColor: kidsColors.primaryLight + '30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  topicChipText: { ...kidsTypography.bodySmall, color: kidsColors.primary, fontWeight: '600' },
  emptyText: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
});
