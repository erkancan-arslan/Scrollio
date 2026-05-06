/**
 * KidsFeedScreen - TikTok-style vertical video feed for Kids
 * Mirrors the main FeedScreen with:
 * - FlatList-based paging with snap-to-item
 * - Tab bar height calculation for accurate item sizing
 * - isFocused check for play/pause on tab switch
 * - Mute / auto-advance options via KidsFeedOptionsButton
 * - Like, bookmark, share actions with optimistic updates
 * - Quiz overlay triggered every 5 videos
 * - Watch time tracking
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
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchFeedThunk,
  trackViewThunk,
  setCurrentIndex,
  fetchQuizThunk,
  dismissQuiz,
  toggleBookmarkLocal,
  toggleLikeLocal,
  resetFeed,
} from '../store/feedSlice';
import { isJobInFlight } from '../../drawing-video/store/drawingVideoSlice';
import { kidsColors } from '../../shared/constants/colors';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorScreen } from '../../shared/components/ErrorScreen';
import { KidsVideoItem } from '../components/KidsVideoItem';
import { KidsFeedOptionsButton } from '../components/KidsFeedOptionsButton';
import { QuizOverlay } from '../components/QuizOverlay';
import { kidsApi } from '../../shared/utils/api';
import type { KidsFeedItem } from '../types/feed.types';
import { KidsDrawingCountdownOverlay } from '../../drawing-video/components/KidsDrawingCountdownOverlay';

export const KidsFeedScreen: React.FC = () => {
  const { height: windowHeight } = Dimensions.get('window');
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();

  const {
    items,
    currentIndex,
    isLoading,
    error,
    hasMore,
    page,
    emptyReason,
    showQuiz,
    activeQuiz,
    quizResult,
    videosWatchedSinceQuiz,
  } = useAppSelector((s) => s.kidsFeed);

  const activeChildProfileId = useAppSelector((s) => s.kidsAuth.activeChildProfileId);
  const latestJob = useAppSelector((s) => s.kidsDrawingVideo.latestJob);

  const flatListRef = useRef<FlatList>(null);
  const prevJobInFlightRef = useRef<boolean>(isJobInFlight(latestJob));
  const [refreshing, setRefreshing] = useState(false);
  const isLoadingMore = useRef(false);

  // Playback options state
  const [isMuted, setIsMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Watch time tracking
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchSecondsRef = useRef(0);

  // Calculate the exact height for each video item
  // Subtract tab bar height so content doesn't overflow behind it
  const itemHeight = useMemo(() => {
    const calculated = windowHeight - tabBarHeight;
    return calculated > 0 ? calculated : windowHeight;
  }, [windowHeight, tabBarHeight]);

  // Load kids_content feed only when a child is selected (X-Child-Profile-Id). Reset when switching profiles.
  useEffect(() => {
    if (!activeChildProfileId) return;
    dispatch(resetFeed());
    dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
  }, [dispatch, activeChildProfileId]);

  // When a drawing-video job transitions from in-flight → ready, reload the
  // feed from page 1 so the newly-pinned video appears at the top automatically.
  useEffect(() => {
    const nowInFlight = isJobInFlight(latestJob);
    const wasInFlight = prevJobInFlightRef.current;
    prevJobInFlightRef.current = nowInFlight;

    if (wasInFlight && !nowInFlight && latestJob?.status === 'ready') {
      dispatch(fetchFeedThunk({ page: 1, limit: 10 })).then(() => {
        dispatch(setCurrentIndex(0));
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      });
    }
  }, [latestJob, dispatch]);

  // Track watch time for current video
  useEffect(() => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
    }
    watchSecondsRef.current = 0;

    if (items.length > 0 && currentIndex < items.length && isFocused) {
      watchTimerRef.current = setInterval(() => {
        watchSecondsRef.current += 5;
        const item = items[currentIndex];
        if (item && watchSecondsRef.current > 0) {
          dispatch(
            trackViewThunk({
              contentId: item.contentId,
              watchedSeconds: watchSecondsRef.current,
            }),
          );
        }
      }, 5000);
    }

    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [currentIndex, items, dispatch, isFocused]);

  // Trigger quiz every 5 videos
  useEffect(() => {
    if (videosWatchedSinceQuiz >= 5 && items.length > 0) {
      const currentItem = items[currentIndex];
      if (currentItem?.hasQuiz) {
        dispatch(fetchQuizThunk(currentItem.contentId));
      }
    }
  }, [videosWatchedSinceQuiz, currentIndex, items, dispatch]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
    setRefreshing(false);
  }, [dispatch]);

  // Handle load more when reaching end
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore.current && hasMore && !isLoading) {
      isLoadingMore.current = true;
      dispatch(fetchFeedThunk({ page: page + 1, limit: 10 })).finally(() => {
        isLoadingMore.current = false;
      });
    }
  }, [dispatch, hasMore, isLoading, page]);

  // Handle like action with optimistic update
  const handleLike = useCallback(
    async (contentId: string) => {
      dispatch(toggleLikeLocal(contentId));

      const res = await kidsApi.post(`/kids/like/toggle`, { contentId });
      if (res.error) {
        dispatch(toggleLikeLocal(contentId));
      }
    },
    [dispatch],
  );

  // Handle bookmark action with optimistic update
  const handleBookmark = useCallback(
    async (contentId: string) => {
      dispatch(toggleBookmarkLocal(contentId));

      const res = await kidsApi.post(`/kids/bookmark/toggle`, { contentId });
      if (res.error) {
        dispatch(toggleBookmarkLocal(contentId));
      }
    },
    [dispatch],
  );

  // Handle share action (placeholder)
  const handleShare = useCallback((contentId: string) => {
    console.log('Share kids video:', contentId);
    // TODO: Open share sheet
  }, []);

  // Handle topic press
  const handleTopicPress = useCallback((topic: string) => {
    console.log('Navigate to kids topic:', topic);
    // TODO: Navigate to topic-filtered feed
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
    if (autoAdvance && currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }
  }, [autoAdvance, currentIndex, items.length]);

  // Track viewable items for auto-play
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        dispatch(setCurrentIndex(viewableItems[0].index));
      }
    },
    [dispatch],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const emptyStateCopy = useMemo(() => {
    switch (emptyReason) {
      case 'no_mascot':
        return {
          title: 'Pick a mascot',
          message:
            'Choose bird, cat, or dragon in your profile so videos match your friend.',
          icon: '🐾',
        };
      case 'no_topics':
        return {
          title: 'Choose topics',
          message: 'Select at least one topic in your profile so we can personalize the feed.',
          icon: '📚',
        };
      case 'no_matching_content':
        return {
          title: 'Nothing to watch yet',
          message:
            'No kids video matches your mascot, age, and topics right now. Publish one from admin, or check that video topic tags use the same names as the topics you selected.',
          icon: '📺',
        };
      default:
        return {
          title: 'No videos yet',
          message:
            'Pull to refresh, or check your mascot, topics, and age in your profile.',
          icon: '📺',
        };
    }
  }, [emptyReason]);

  // Render each video item
  const renderItem = useCallback(
    ({ item, index }: { item: KidsFeedItem; index: number }) => (
      <KidsVideoItem
        item={item}
        isActive={index === currentIndex && isFocused}
        isMuted={isMuted}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onShare={handleShare}
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
      handleBookmark,
      handleShare,
      handleTopicPress,
      handleVideoEnd,
      itemHeight,
    ],
  );

  // Get item layout for optimized scrolling
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight],
  );

  // Render footer (loading indicator for infinite scroll)
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={kidsColors.primary} />
      </View>
    );
  }, [hasMore]);

  // Show loading state on initial load
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.shell}>
        {isFocused ? <KidsDrawingCountdownOverlay /> : null}
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <ActivityIndicator size="large" color={kidsColors.primary} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error && items.length === 0) {
    return (
      <View style={styles.shell}>
        {isFocused ? <KidsDrawingCountdownOverlay /> : null}
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ErrorScreen
          message={error}
          onRetry={() => dispatch(fetchFeedThunk({ page: 1, limit: 10 }))}
        />
      </View>
    );
  }

  // Show empty state
  if (!isLoading && items.length === 0) {
    return (
      <View style={styles.shell}>
        {isFocused ? <KidsDrawingCountdownOverlay /> : null}
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <EmptyState
          title={emptyStateCopy.title}
          message={emptyStateCopy.message}
          icon={emptyStateCopy.icon}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused ? <KidsDrawingCountdownOverlay /> : null}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Options Button */}
      <KidsFeedOptionsButton
        isMuted={isMuted}
        autoAdvance={autoAdvance}
        onToggleMute={handleToggleMute}
        onToggleAutoAdvance={handleToggleAutoAdvance}
      />

      {/* Video Feed */}
      <FlatList
        ref={flatListRef}
        data={items}
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={kidsColors.primary}
            colors={[kidsColors.primary]}
          />
        }
      />

      {/* Quiz Overlay */}
      {showQuiz && activeQuiz ? (
        <QuizOverlay
          quiz={activeQuiz}
          result={quizResult}
          onDismiss={() => dispatch(dismissQuiz())}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  /** Wrapper so absolute countdown overlay is scoped to this screen only. */
  shell: {
    flex: 1,
  },
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
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
