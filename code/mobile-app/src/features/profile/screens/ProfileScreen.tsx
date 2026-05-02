/**
 * ProfileScreen - User profile with stats and video collections
 * Displays user information, statistics, and tabs for bookmarks/likes/watched videos
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { authService } from '../../../services';
import { AppDispatch, RootState } from '../../../store/store';
import {
  fetchMyProfile,
  fetchBookmarkedVideos,
  fetchLikedVideos,
  fetchWatchedVideos,
  fetchWeeklyAnalytics,
  setActiveTab,
  clearProfile,
} from '../store/profileSlice';
import { ProfileTab } from '../types';
import { Video } from '../../feed/types';
import {
  ProfileHeader,
  ProfileStats,
  ProfileTabs,
  VideoGrid,
  WeeklyAnalyticsCard,
} from '../components';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const {
    profile,
    profileLoading,
    profileError,
    activeTab,
    bookmarkedVideos,
    bookmarksLoading,
    bookmarksError,
    hasMoreBookmarks,
    bookmarksCursor,
    likedVideos,
    likesLoading,
    likesError,
    hasMoreLikes,
    likesCursor,
    watchedVideos,
    watchedLoading,
    watchedError,
    hasMoreWatched,
    watchedCursor,
    weeklyAnalytics,
    weeklyAnalyticsLoading,
  } = useSelector((state: RootState) => state.profile);

  // Load video lists once on mount (these don't change from other screens)
  useEffect(() => {
    dispatch(fetchBookmarkedVideos({ limit: 20 }));
    dispatch(fetchLikedVideos({ limit: 20 }));
    dispatch(fetchWatchedVideos({ limit: 20 }));
  }, [dispatch]);

  // Re-fetch profile every time this tab is focused so that XP earned on the
  // Feed tab and topic changes from ManageTopicsScreen are always reflected.
  // A single fetch per focus is enough — the old double-fetch (useEffect +
  // useFocusEffect) was removed to prevent stale snapshots overwriting fresh
  // applyXpAward updates.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyProfile());
      dispatch(fetchWeeklyAnalytics());
    }, [dispatch]),
  );

  // Handle tab change — lazy-load if data hasn't been fetched yet
  const handleTabChange = useCallback((tab: ProfileTab) => {
    dispatch(setActiveTab(tab));

    if (tab === 'bookmarks' && bookmarkedVideos.length === 0) {
      dispatch(fetchBookmarkedVideos({ limit: 20 }));
    }
    if (tab === 'likes' && likedVideos.length === 0) {
      dispatch(fetchLikedVideos({ limit: 20 }));
    }
    if (tab === 'watched' && watchedVideos.length === 0) {
      dispatch(fetchWatchedVideos({ limit: 20 }));
    }
  }, [dispatch, bookmarkedVideos.length, likedVideos.length, watchedVideos.length]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchMyProfile());
    dispatch(fetchWeeklyAnalytics());
    if (activeTab === 'bookmarks') {
      dispatch(fetchBookmarkedVideos({ limit: 20 }));
    } else if (activeTab === 'likes') {
      dispatch(fetchLikedVideos({ limit: 20 }));
    } else if (activeTab === 'watched') {
      dispatch(fetchWatchedVideos({ limit: 20 }));
    }
  }, [dispatch, activeTab]);

  // Handle load more (pagination)
  const handleLoadMore = useCallback(() => {
    if (activeTab === 'bookmarks' && hasMoreBookmarks && !bookmarksLoading && bookmarksCursor) {
      dispatch(fetchBookmarkedVideos({ limit: 20, cursor: bookmarksCursor, loadMore: true }));
    } else if (activeTab === 'likes' && hasMoreLikes && !likesLoading && likesCursor) {
      dispatch(fetchLikedVideos({ limit: 20, cursor: likesCursor, loadMore: true }));
    } else if (activeTab === 'watched' && hasMoreWatched && !watchedLoading && watchedCursor) {
      dispatch(fetchWatchedVideos({ limit: 20, cursor: watchedCursor, loadMore: true }));
    }
  }, [dispatch, activeTab, hasMoreBookmarks, bookmarksLoading, bookmarksCursor, hasMoreLikes, likesLoading, likesCursor, hasMoreWatched, watchedLoading, watchedCursor]);

  // Handle video press
  const handleVideoPress = useCallback((video: Video) => {
    // TODO: Navigate to video player or full screen video view
    console.log('Video pressed:', video.id);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
            dispatch(clearProfile());
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          },
        },
      ]
    );
  };

  // Get videos for current tab
  const getCurrentTabVideos = (): Video[] => {
    switch (activeTab) {
      case 'bookmarks':
        return bookmarkedVideos;
      case 'likes':
        return likedVideos;
      case 'watched':
        return watchedVideos;
      default:
        return [];
    }
  };

  // Get loading state for current tab
  const getCurrentTabLoading = (): boolean => {
    switch (activeTab) {
      case 'bookmarks':
        return bookmarksLoading;
      case 'likes':
        return likesLoading;
      case 'watched':
        return watchedLoading;
      default:
        return false;
    }
  };

  // Get error for current tab
  const getCurrentTabError = (): string | null => {
    switch (activeTab) {
      case 'bookmarks':
        return bookmarksError;
      case 'likes':
        return likesError;
      case 'watched':
        return watchedError;
      default:
        return null;
    }
  };

  // Get empty message for current tab
  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'bookmarks':
        return 'No bookmarked videos yet.\nBookmark videos to watch them later!';
      case 'likes':
        return 'No liked videos yet.\nLike videos you enjoy!';
      case 'watched':
        return 'No watch history yet.\nStart watching to see your history!';
      default:
        return 'No videos yet';
    }
  };

  if (profileError && !profile) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchMyProfile())}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  if (profileLoading && !profile) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        {/* Loading skeleton or spinner */}
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Sign Out button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={profileLoading || bookmarksLoading || likesLoading || watchedLoading}
            onRefresh={handleRefresh}
            tintColor="#FF8C42"
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Profile Stats */}
        <ProfileStats profile={profile} />

        {/* Weekly Analytics */}
        {weeklyAnalyticsLoading && !weeklyAnalytics ? (
          <View style={styles.analyticsSkeletonCard} />
        ) : weeklyAnalytics ? (
          <WeeklyAnalyticsCard analytics={weeklyAnalytics} />
        ) : null}

        {/* My Interests */}
        <View style={styles.interestsCard}>
          <View style={styles.interestsHeader}>
            <Text style={styles.interestsTitle}>My Interests</Text>
            <TouchableOpacity
              style={styles.editTopicsBtn}
              onPress={() =>
                navigation.navigate('ManageTopics', {
                  currentTopics: profile.preferences?.preferredTopics ?? [],
                })
              }
            >
              <Ionicons name="pencil-outline" size={14} color="#FF8C42" />
              <Text style={styles.editTopicsBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {(profile.preferences?.preferredTopics ?? []).length === 0 ? (
            <Text style={styles.interestsEmpty}>No topics selected yet.</Text>
          ) : (
            <View style={styles.topicChips}>
              {(profile.preferences?.preferredTopics ?? []).map((topic) => (
                <View key={topic} style={styles.topicChip}>
                  <Text style={styles.topicChipText}>{topic}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          bookmarkCount={bookmarkedVideos.length}
          likeCount={likedVideos.length}
          watchedCount={profile.totalVideosWatched}
        />

        {/* Video Grid without header */}
        <VideoGrid
          videos={getCurrentTabVideos()}
          loading={getCurrentTabLoading()}
          error={getCurrentTabError()}
          onVideoPress={handleVideoPress}
          onLoadMore={handleLoadMore}
          hasMore={activeTab === 'bookmarks' ? hasMoreBookmarks : activeTab === 'likes' ? hasMoreLikes : hasMoreWatched}
          emptyMessage={getEmptyMessage()}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3ED',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerSpacer: {
    width: 24,
  },
  signOutButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50, // Add padding at bottom for scrolling
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F3ED',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F3ED',
    padding: 40,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF8C42',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  analyticsSkeletonCard: {
    backgroundColor: '#EFEFEF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    height: 180,
  },

  // My Interests section
  interestsCard: {
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
  interestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  editTopicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  editTopicsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8C42',
  },
  interestsEmpty: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
  topicChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#FFF2E8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFD4B3',
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8C42',
  },
});

