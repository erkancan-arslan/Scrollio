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
import { fetchScreenTimeThunk, fetchActivityThunk, fetchContentFiltersThunk, fetchMediaEngagementThunk } from '../store/parentalSlice';
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
  const { screenTime, activities, contentFilters, mediaEngagement, isLoading } = useAppSelector((s) => s.kidsParental);

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
      
      {['watched', 'liked', 'bookmarked'].map((type) => {
        const items = mediaEngagement ? (mediaEngagement as any)[type] : [];
        const title = type === 'watched' ? 'Recently Watched' : type === 'liked' ? 'Liked Videos' : 'Bookmarked';
        if (!items || items.length === 0) return null;
        return (
          <View key={type} style={styles.mediaSection}>
            <Text style={styles.mediaTitle}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
              {items.map((item: any) => (
                <View key={item.id} style={styles.mediaItem}>
                  <Image source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/150' }} style={styles.mediaThumb} />
                  <Text style={styles.mediaItemTitle} numberOfLines={2}>{item.title || 'Video'}</Text>
                </View>
              ))}
            </ScrollView>
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
  mediaItemTitle: { ...kidsTypography.caption, color: kidsColors.text.primary, fontWeight: 'bold' },
});
