/**
 * ProfileScreen - User profile with stats and video collections
 * Displays user information, statistics, and tabs for bookmarks/likes/watched videos
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { authService } from '../../../services';
import { AppDispatch, RootState } from '../../../store/store';
import {
  fetchMyProfile,
  fetchBookmarkedVideos,
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
  } = useSelector((state: RootState) => state.profile);

  // Load profile on mount
  useEffect(() => {
    dispatch(fetchMyProfile());
    dispatch(fetchBookmarkedVideos({ limit: 20 }));
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = useCallback((tab: ProfileTab) => {
    dispatch(setActiveTab(tab));

    // Load data for the selected tab
    if (tab === 'bookmarks' && bookmarkedVideos.length === 0) {
      dispatch(fetchBookmarkedVideos({ limit: 20 }));
    }
    // TODO: Add handlers for likes and watched tabs when implemented
  }, [dispatch, bookmarkedVideos.length]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchMyProfile());
    if (activeTab === 'bookmarks') {
      dispatch(fetchBookmarkedVideos({ limit: 20 }));
    }
    // TODO: Add refresh for other tabs
  }, [dispatch, activeTab]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (activeTab === 'bookmarks' && hasMoreBookmarks && !bookmarksLoading && bookmarksCursor) {
      dispatch(fetchBookmarkedVideos({
        limit: 20,
        cursor: bookmarksCursor,
        loadMore: true,
      }));
    }
    // TODO: Add load more for other tabs
  }, [dispatch, activeTab, hasMoreBookmarks, bookmarksLoading, bookmarksCursor]);

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
        return []; // TODO: Implement liked videos
      case 'watched':
        return []; // TODO: Implement watched videos
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
        return false; // TODO: Implement
      case 'watched':
        return false; // TODO: Implement
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
        return null; // TODO: Implement
      case 'watched':
        return null; // TODO: Implement
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
            refreshing={profileLoading || bookmarksLoading}
            onRefresh={handleRefresh}
            tintColor="#FF8C42"
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Profile Stats */}
        <ProfileStats profile={profile} />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          bookmarkCount={bookmarkedVideos.length}
          likeCount={0} // TODO: Implement
          watchedCount={0} // TODO: Implement
        />

        {/* Video Grid without header */}
        <VideoGrid
          videos={getCurrentTabVideos()}
          loading={getCurrentTabLoading()}
          error={getCurrentTabError()}
          onVideoPress={handleVideoPress}
          onLoadMore={handleLoadMore}
          hasMore={activeTab === 'bookmarks' ? hasMoreBookmarks : false}
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
});
