/**
 * KidsParentalDashboardScreen — Main parental controls dashboard
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchScreenTimeThunk, fetchActivityThunk, fetchContentFiltersThunk, fetchMediaEngagementThunk, fetchWatchTimeSummaryThunk, fetchQuizPerformanceThunk, fetchWeeklyReportThunk } from '../store/parentalSlice';
import { switchChildThunk } from '../../auth/store/authSlice';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { MultiProfileSwitcher } from '../../profile/components/MultiProfileSwitcher';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { Image } from 'react-native';

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
  return `${Math.round(diffH / 24)}d ago`;
};

const formatEventType = (type: string): string => {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const KidsParentalDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<{ navigate: (s: string) => void }>();
  const { childId, childProfile, childProfiles } = useActiveChild();
  const { screenTime, activities, contentFilters, mediaEngagement, watchTimeSummary, quizPerformance, weeklyReport, isLoading } = useAppSelector((s) => s.kidsParental);

  // If accessed from profile selector, we might not have an active child.
  // Auto-select the first one so we can view their dashboard.
  useEffect(() => {
    if (!childId && childProfiles.length > 0) {
      dispatch(switchChildThunk(childProfiles[0].id));
    }
  }, [childId, childProfiles, dispatch]);

  useEffect(() => {
    if (childId) {
      dispatch(fetchScreenTimeThunk());
      dispatch(fetchActivityThunk());
      dispatch(fetchContentFiltersThunk());
      dispatch(fetchMediaEngagementThunk());
      dispatch(fetchWatchTimeSummaryThunk());
      dispatch(fetchQuizPerformanceThunk());
      dispatch(fetchWeeklyReportThunk());
    }
  }, [dispatch, childId]);

  const handleSwitchChild = (id: string) => {
    dispatch(switchChildThunk(id));
  };

  if (isLoading && !screenTime && !contentFilters) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const usedMinutes = screenTime?.usedMinutesToday ?? 0;
  const limitMinutes = screenTime?.dailyLimitMinutes ?? 60;
  const percentUsed = limitMinutes > 0 ? Math.min(100, Math.round((usedMinutes / limitMinutes) * 100)) : 0;
  const recentActivities = activities.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MultiProfileSwitcher
        profiles={childProfiles}
        activeChildId={childId}
        onSwitch={handleSwitchChild}
      />

      {/* Child Info */}
      <View style={styles.childHeader}>
        <Text style={styles.childName}>{childProfile?.displayName ?? 'Select a Child'}</Text>
        <Text style={styles.childSubtitle}>Parental Dashboard</Text>
      </View>

      {/* Screen Time Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('KidsScreenTime' as never)}
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>⏱️</Text>
          <View>
            <Text style={styles.cardTitle}>Screen Time</Text>
            <Text style={styles.cardSubtitle}>Tap to manage limits</Text>
          </View>
        </View>
        
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentUsed}%`, backgroundColor: percentUsed > 80 ? kidsColors.error : kidsColors.success },
            ]}
          />
        </View>
        
        <View style={styles.statsRow}>
          <Text style={styles.cardValue}>
            <Text style={{ fontWeight: '700' }}>{usedMinutes}m</Text> / {limitMinutes}m today
          </Text>
          <Text style={[styles.cardValue, { color: percentUsed > 80 ? kidsColors.error : kidsColors.success }]}>
            {screenTime?.remainingMinutes ?? 0}m left
          </Text>
        </View>
        <Text style={styles.cardCaption}>
          Allowed hours: {screenTime?.allowedStartTime ?? '08:00'} - {screenTime?.allowedEndTime ?? '20:00'}
        </Text>
      </TouchableOpacity>

      {/* Watch Time Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📅</Text>
          <View>
            <Text style={styles.cardTitle}>Watch Time</Text>
            <Text style={styles.cardSubtitle}>Daily · Weekly · Monthly</Text>
          </View>
        </View>
        <View style={styles.watchTimeRow}>
          <View style={styles.watchTimeCell}>
            <Text style={styles.watchTimeValue}>{watchTimeSummary?.dailyMinutes ?? usedMinutes}m</Text>
            <Text style={styles.watchTimeLabel}>Today</Text>
          </View>
          <View style={styles.watchTimeDivider} />
          <View style={styles.watchTimeCell}>
            <Text style={styles.watchTimeValue}>{watchTimeSummary?.weeklyMinutes ?? 0}m</Text>
            <Text style={styles.watchTimeLabel}>This Week</Text>
          </View>
          <View style={styles.watchTimeDivider} />
          <View style={styles.watchTimeCell}>
            <Text style={styles.watchTimeValue}>{watchTimeSummary?.monthlyMinutes ?? 0}m</Text>
            <Text style={styles.watchTimeLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Weekly Report Card */}
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <View>
            <Text style={styles.weeklyTitle}>📋 This Week's Report</Text>
            <Text style={styles.weeklyRange}>{weeklyReport?.weekLabel ?? '...'}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.weeklyStatsRow}>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>{weeklyReport?.watchMinutes ?? 0}</Text>
            <Text style={styles.weeklyStatLabel}>min watched</Text>
          </View>
          <View style={styles.weeklyStatDivider} />
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>{weeklyReport?.videosWatched ?? 0}</Text>
            <Text style={styles.weeklyStatLabel}>videos</Text>
          </View>
          <View style={styles.weeklyStatDivider} />
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatValue}>{weeklyReport?.quizzesAttempted ?? 0}</Text>
            <Text style={styles.weeklyStatLabel}>quizzes</Text>
          </View>
        </View>

        {/* Quiz topic scores this week */}
        {weeklyReport && weeklyReport.quizTopics.length > 0 && (
          <View style={styles.weeklySection}>
            <Text style={styles.weeklySectionTitle}>Quiz scores this week</Text>
            {weeklyReport.quizTopics.slice(0, 4).map((item) => (
              <View key={item.topic} style={styles.quizRow}>
                <Text style={styles.quizTopic} numberOfLines={1}>{item.topic}</Text>
                <View style={styles.quizBarBg}>
                  <View
                    style={[
                      styles.quizBarFill,
                      {
                        width: `${item.avgScorePct}%`,
                        backgroundColor:
                          item.avgScorePct >= 70
                            ? kidsColors.success
                            : item.avgScorePct >= 40
                            ? '#F59E0B'
                            : kidsColors.error,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.quizPct}>{item.avgScorePct}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Activity breakdown this week */}
        {weeklyReport && Object.keys(weeklyReport.activityBreakdown).length > 0 && (
          <View style={styles.weeklySection}>
            <Text style={styles.weeklySectionTitle}>Activity breakdown</Text>
            <View style={styles.weeklyBadgesRow}>
              {Object.entries(weeklyReport.activityBreakdown).map(([type, count]) => (
                <View key={type} style={styles.weeklyBadge}>
                  <Text style={styles.weeklyBadgeIcon}>{EVENT_ICONS[type] ?? '📌'}</Text>
                  <Text style={styles.weeklyBadgeCount}>{count}</Text>
                  <Text style={styles.weeklyBadgeLabel}>{formatEventType(type)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {weeklyReport &&
          weeklyReport.watchMinutes === 0 &&
          weeklyReport.quizzesAttempted === 0 && (
            <Text style={styles.cardCaption}>No activity recorded this week yet.</Text>
          )}
      </View>

      {/* Quiz Performance Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🧠</Text>
          <View>
            <Text style={styles.cardTitle}>Quiz Performance</Text>
            <Text style={styles.cardSubtitle}>Average score by topic</Text>
          </View>
        </View>
        {quizPerformance.length > 0 ? (
          quizPerformance.slice(0, 5).map((item) => (
            <View key={item.topic} style={styles.quizRow}>
              <Text style={styles.quizTopic} numberOfLines={1}>{item.topic}</Text>
              <View style={styles.quizBarBg}>
                <View
                  style={[
                    styles.quizBarFill,
                    {
                      width: `${item.avgScorePct}%`,
                      backgroundColor: item.avgScorePct >= 70 ? kidsColors.success : item.avgScorePct >= 40 ? '#F59E0B' : kidsColors.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.quizPct}>{item.avgScorePct}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.cardCaption}>No quizzes completed yet.</Text>
        )}
      </View>

      {/* Activity Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('KidsParentalActivity' as never)}
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📊</Text>
          <View>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.cardSubtitle}>{activities.length} total events</Text>
          </View>
        </View>
        
        {recentActivities.length > 0 ? (
          <View style={styles.recentList}>
            {recentActivities.map((act) => (
              <View key={act.id} style={styles.recentItem}>
                <Text style={styles.recentIcon}>{EVENT_ICONS[act.event_type] ?? '📌'}</Text>
                <Text style={styles.recentText} numberOfLines={1}>{formatEventType(act.event_type)}</Text>
                <Text style={styles.recentTime}>{formatTime(act.created_at)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.cardCaption}>No recent activity found.</Text>
        )}
      </TouchableOpacity>

      {/* Content Safety Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('KidsContentSafety' as never)}
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🛡️</Text>
          <View>
            <Text style={styles.cardTitle}>Content Safety</Text>
            <Text style={styles.cardSubtitle}>Manage filters & blocked topics</Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Diff: {contentFilters?.maxDifficulty ?? 'hard'}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{contentFilters?.blockedTopicIds.length ?? 0} Blocked</Text>
          </View>
          <View style={[styles.badge, contentFilters?.safeSearchEnabled ? styles.badgeSuccess : styles.badgeError]}>
            <Text style={[styles.badgeText, contentFilters?.safeSearchEnabled ? styles.badgeTextSuccess : styles.badgeTextError]}>
              Safe Search {contentFilters?.safeSearchEnabled ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Media Engagement Sections */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Media Engagement</Text>
      </View>
      
      {([
        { key: 'watched', title: 'Recently Watched' },
        { key: 'liked', title: 'Liked Videos' },
        { key: 'bookmarked', title: 'Bookmarked' },
      ] as const).map(({ key, title }) => {
        const items: any[] = mediaEngagement ? (mediaEngagement as any)[key] ?? [] : [];
        return (
          <View key={key} style={styles.mediaSection}>
            <Text style={styles.mediaTitle}>{title}</Text>
            {items.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
                {items.map((item: any) => (
                  <View key={item.id} style={styles.mediaItem}>
                    {item.thumbnail_url ? (
                      <Image source={{ uri: item.thumbnail_url }} style={styles.mediaThumb} />
                    ) : (
                      <View style={[styles.mediaThumb, styles.mediaThumbFallback]} />
                    )}
                    <Text style={styles.mediaItemTitle} numberOfLines={2}>{item.title || 'Video'}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.mediaEmptyText}>
                {mediaEngagement ? 'No videos yet.' : 'Loading...'}
              </Text>
            )}
          </View>
        );
      })}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16, paddingBottom: 40 },
  childHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  childName: { ...kidsTypography.heading2, color: kidsColors.text.primary },
  childSubtitle: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIcon: { fontSize: 32, marginRight: 16 },
  cardTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 2 },
  cardSubtitle: { ...kidsTypography.caption, color: kidsColors.text.muted },
  cardValue: { ...kidsTypography.body, color: kidsColors.text.secondary },
  cardCaption: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 8 },
  progressBarBg: { height: 10, backgroundColor: kidsColors.border, borderRadius: 5, marginBottom: 12, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentList: { gap: 8 },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: kidsColors.background, padding: 8, borderRadius: 12 },
  recentIcon: { fontSize: 20, marginRight: 10 },
  recentText: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, flex: 1, fontWeight: '600' },
  recentTime: { ...kidsTypography.caption, color: kidsColors.text.muted },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  badge: { backgroundColor: kidsColors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeSuccess: { backgroundColor: kidsColors.success + '20' },
  badgeError: { backgroundColor: kidsColors.error + '20' },
  badgeText: { ...kidsTypography.caption, color: kidsColors.text.primary, fontWeight: '700' },
  badgeTextSuccess: { color: kidsColors.success },
  badgeTextError: { color: kidsColors.error },
  sectionHeader: { paddingHorizontal: 16, marginTop: 12, marginBottom: 12 },
  sectionTitle: { ...kidsTypography.heading2, color: kidsColors.text.primary },
  mediaSection: { marginBottom: 24 },
  mediaTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginHorizontal: 16, marginBottom: 12 },
  mediaScroll: { paddingHorizontal: 16, gap: 12 },
  mediaItem: { width: 140 },
  mediaThumb: { width: 140, height: 90, borderRadius: 12, backgroundColor: kidsColors.border, marginBottom: 6 },
  mediaThumbFallback: { backgroundColor: kidsColors.border },
  mediaItemTitle: { ...kidsTypography.caption, color: kidsColors.text.primary, fontWeight: 'bold' },
  mediaEmptyText: { ...kidsTypography.caption, color: kidsColors.text.muted, paddingHorizontal: 4, marginTop: 4 },
  watchTimeRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 4 },
  watchTimeCell: { flex: 1, alignItems: 'center' },
  watchTimeDivider: { width: 1, height: 40, backgroundColor: kidsColors.border },
  watchTimeValue: { ...kidsTypography.heading3, color: kidsColors.text.primary, fontWeight: '700' },
  watchTimeLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
  quizRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  quizTopic: { ...kidsTypography.caption, color: kidsColors.text.primary, fontWeight: '600', width: 90 },
  quizBarBg: { flex: 1, height: 8, backgroundColor: kidsColors.border, borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  quizBarFill: { height: 8, borderRadius: 4 },
  quizPct: { ...kidsTypography.caption, color: kidsColors.text.secondary, width: 36, textAlign: 'right', fontWeight: '700' },
  weeklyCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: kidsColors.primary ?? '#6C63FF',
  },
  weeklyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  weeklyTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 2 },
  weeklyRange: { ...kidsTypography.caption, color: kidsColors.text.muted },
  weeklyStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20, paddingVertical: 12, backgroundColor: kidsColors.background, borderRadius: 12 },
  weeklyStat: { flex: 1, alignItems: 'center' },
  weeklyStatValue: { ...kidsTypography.heading2, color: kidsColors.text.primary, fontWeight: '700' },
  weeklyStatLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
  weeklyStatDivider: { width: 1, height: 36, backgroundColor: kidsColors.border },
  weeklySection: { marginBottom: 16 },
  weeklySectionTitle: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '700', marginBottom: 10 },
  weeklyBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weeklyBadge: { alignItems: 'center', backgroundColor: kidsColors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, minWidth: 72 },
  weeklyBadgeIcon: { fontSize: 20, marginBottom: 2 },
  weeklyBadgeCount: { ...kidsTypography.heading3, color: kidsColors.text.primary, fontWeight: '700' },
  weeklyBadgeLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, textAlign: 'center' },
});
