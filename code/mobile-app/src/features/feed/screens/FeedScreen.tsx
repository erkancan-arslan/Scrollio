/**
 * FeedScreen - TikTok-style vertical video feed
 * Main screen after user signs in
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  ViewToken,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { FeedVideoItem, FeedOptionsButton } from '../components';
import { Video, FeedState } from '../types';
import { mockVideos } from '../data/mockVideos';
import { feedService } from '../../../services';
import { colors } from '../../../theme';

export const FeedScreen: React.FC = () => {
  const { height: windowHeight } = Dimensions.get('window');
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  
  // Feed state
  const [feedState, setFeedState] = useState<FeedState>({
    videos: [],
    currentIndex: 0,
    loading: true,
    refreshing: false,
    error: null,
    nextCursor: null,
    hasMore: true,
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLoadingMore = useRef(false);

  // Watch tracking
  const activeVideoStartTime = useRef<number | null>(null);
  const activeVideoId = useRef<string | null>(null);

  // Playback options state
  const [isMuted, setIsMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  
  // Calculate the exact height for each video item
  // Subtract tab bar height so content doesn't overflow behind it
  const itemHeight = useMemo(() => {
    const calculated = windowHeight - tabBarHeight;
    return calculated > 0 ? calculated : windowHeight;
  }, [windowHeight, tabBarHeight]);

  // Fetch feed from API
  const fetchFeed = useCallback(async (refresh = false) => {
    if (refresh) {
      setFeedState((prev) => ({ ...prev, refreshing: true }));
    } else if (!feedState.hasMore || isLoadingMore.current) {
      return;
    }

    try {
      const cursor = refresh ? undefined : feedState.nextCursor || undefined;
      const response = await feedService.getFeed({ limit: 10, cursor });

      if (response.data) {
        setFeedState((prev) => ({
          ...prev,
          videos: refresh
            ? response.data!.videos
            : [...prev.videos, ...response.data!.videos],
          nextCursor: response.data!.nextCursor,
          hasMore: response.data!.hasMore,
          loading: false,
          refreshing: false,
          error: null,
        }));
      } else {
        // Fallback to mock data if API fails
        console.log('API failed, using mock data:', response.error);
        setFeedState((prev) => ({
          ...prev,
          videos: mockVideos,
          loading: false,
          refreshing: false,
          error: null,
          hasMore: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      // Fallback to mock data on error
      setFeedState((prev) => ({
        ...prev,
        videos: mockVideos,
        loading: false,
        refreshing: false,
        error: null,
        hasMore: false,
      }));
    } finally {
      isLoadingMore.current = false;
    }
  }, [feedState.nextCursor, feedState.hasMore]);

  // Initial fetch
  useEffect(() => {
    fetchFeed(true);
  }, []);

  // Record view when navigating away from the feed tab
  useEffect(() => {
    if (!isFocused && activeVideoId.current && activeVideoStartTime.current !== null) {
      recordVideoView(activeVideoId.current, activeVideoStartTime.current);
      activeVideoStartTime.current = null;
    } else if (isFocused && activeVideoId.current) {
      activeVideoStartTime.current = Date.now();
    }
  }, [isFocused, recordVideoView]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Handle load more when reaching end
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore.current && feedState.hasMore && !feedState.loading) {
      isLoadingMore.current = true;
      fetchFeed(false);
    }
  }, [fetchFeed, feedState.hasMore, feedState.loading]);

  // Handle like action with optimistic update
  const handleLike = useCallback(async (videoId: string) => {
    const video = feedState.videos.find((v) => v.id === videoId);
    if (!video) return;

    const wasLiked = video.isLiked;

    // Optimistic update
    setFeedState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId
          ? {
              ...v,
              isLiked: !v.isLiked,
              stats: {
                ...v.stats,
                likes: v.isLiked ? v.stats.likes - 1 : v.stats.likes + 1,
              },
            }
          : v
      ),
    }));

    // API call
    try {
      const response = wasLiked
        ? await feedService.unlikeVideo(videoId)
        : await feedService.likeVideo(videoId);

      if (!response.data?.success) {
        // Revert on failure
        setFeedState((prev) => ({
          ...prev,
          videos: prev.videos.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  isLiked: wasLiked,
                  stats: {
                    ...v.stats,
                    likes: wasLiked ? v.stats.likes + 1 : v.stats.likes - 1,
                  },
                }
              : v
          ),
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [feedState.videos]);

  // Handle bookmark action with optimistic update
  const handleBookmark = useCallback(async (videoId: string) => {
    const video = feedState.videos.find((v) => v.id === videoId);
    if (!video) return;

    const wasBookmarked = video.isBookmarked;

    // Optimistic update
    setFeedState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId
          ? {
              ...v,
              isBookmarked: !v.isBookmarked,
              stats: {
                ...v.stats,
                bookmarks: v.isBookmarked
                  ? v.stats.bookmarks - 1
                  : v.stats.bookmarks + 1,
              },
            }
          : v
      ),
    }));

    // API call
    try {
      const response = wasBookmarked
        ? await feedService.unbookmarkVideo(videoId)
        : await feedService.bookmarkVideo(videoId);

      if (!response.data?.success) {
        // Revert on failure
        setFeedState((prev) => ({
          ...prev,
          videos: prev.videos.map((v) =>
            v.id === videoId
              ? {
                  ...v,
                  isBookmarked: wasBookmarked,
                  stats: {
                    ...v.stats,
                    bookmarks: wasBookmarked
                      ? v.stats.bookmarks + 1
                      : v.stats.bookmarks - 1,
                  },
                }
              : v
          ),
        }));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }, [feedState.videos]);

  // Handle comment action (placeholder for now)
  const handleComment = useCallback((videoId: string) => {
    console.log('Open comments for video:', videoId);
    // TODO: Open comments modal
  }, []);

  // Handle share action (placeholder for now)
  const handleShare = useCallback((videoId: string) => {
    console.log('Share video:', videoId);
    // TODO: Open share sheet
  }, []);

  // Handle creator profile navigation
  const handleCreatorPress = useCallback((creatorId: string) => {
    console.log('Navigate to creator profile:', creatorId);
    // TODO: Navigate to creator profile
  }, []);

  // Handle topic navigation
  const handleTopicPress = useCallback((topic: string) => {
    console.log('Navigate to topic:', topic);
    // TODO: Navigate to topic feed
  }, []);

  // Handle mute toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Handle auto-advance toggle
  const handleToggleAutoAdvance = useCallback(() => {
    setAutoAdvance((prev) => !prev);
  }, []);

  // Handle video end (auto-advance to next video)
  const handleVideoEnd = useCallback(() => {
    if (autoAdvance && currentIndex < feedState.videos.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }
  }, [autoAdvance, currentIndex, feedState.videos.length]);

  // Record view for a video that is leaving the viewport
  const recordVideoView = useCallback((videoId: string, startTime: number) => {
    const watchDuration = Math.round((Date.now() - startTime) / 1000);
    // Fire-and-forget — do not block UI
    feedService.recordView(videoId, watchDuration, false).catch(() => {});
  }, []);

  // Track viewable items for auto-play and watch time recording
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        const newVideoId = feedState.videos[newIndex]?.id ?? null;

        // Record the view for the video that just left the viewport
        if (
          activeVideoId.current &&
          activeVideoStartTime.current !== null &&
          activeVideoId.current !== newVideoId
        ) {
          recordVideoView(activeVideoId.current, activeVideoStartTime.current);
        }

        // Start tracking the new active video
        activeVideoId.current = newVideoId;
        activeVideoStartTime.current = Date.now();

        setCurrentIndex(newIndex);
      }
    },
    [feedState.videos, recordVideoView]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  // Render each video item
  const renderItem = useCallback(
    ({ item, index }: { item: Video; index: number }) => (
      <FeedVideoItem
        video={item}
        isActive={index === currentIndex && isFocused}
        isMuted={isMuted}
        onLike={handleLike}
        onComment={handleComment}
        onBookmark={handleBookmark}
        onShare={handleShare}
        onCreatorPress={handleCreatorPress}
        onTopicPress={handleTopicPress}
        onVideoEnd={autoAdvance ? handleVideoEnd : undefined}
        itemHeight={itemHeight}
      />
    ),
    [
      currentIndex,
      isFocused,
      isMuted,
      autoAdvance,
      handleLike,
      handleComment,
      handleBookmark,
      handleShare,
      handleCreatorPress,
      handleTopicPress,
      handleVideoEnd,
      itemHeight,
    ]
  );

  // Get item layout for optimized scrolling - CRITICAL for smooth scrolling
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  // Render footer (loading indicator for infinite scroll)
  const renderFooter = useCallback(() => {
    if (!feedState.hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [feedState.hasMore]);

  // Show loading state on initial load
  if (feedState.loading && feedState.videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  // Show error state
  if (feedState.error && feedState.videos.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={styles.errorText}>{feedState.error}</Text>
        <Text style={styles.retryText} onPress={() => fetchFeed(true)}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Options Button */}
      <FeedOptionsButton
        isMuted={isMuted}
        autoAdvance={autoAdvance}
        onToggleMute={handleToggleMute}
        onToggleAutoAdvance={handleToggleAutoAdvance}
      />

      {/* Video Feed */}
      <FlatList
        ref={flatListRef}
        data={feedState.videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        bounces={false}
        overScrollMode="never"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={feedState.refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

