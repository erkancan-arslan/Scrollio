/**
 * FeedScreen - TikTok-style vertical video feed
 * Main screen after user signs in
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  ViewToken,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import {
  FeedVideoItem,
  FeedOptionsButton,
  ShareToFriendsModal,
  CoreQuizOverlay,
  XpToast,
} from '../components';
import { Video, FeedState, QuizLevel } from '../types';
import { mockVideos } from '../data/mockVideos';
import { feedService, coreQuizApi } from '../../../services';
import { colors } from '../../../theme';
import { AppDispatch } from '../../../store/store';
import { applyXpAward, applyPlaygroundCoins } from '../../profile/store/profileSlice';

interface PendingQuiz {
  topic: string;
  level: QuizLevel;
}


interface XpToastState {
  xpAwarded: number;
  levelUp: boolean;
  coinsAwarded?: number;
}

export const FeedScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();

  // We measure the FlatList's actual viewport with onLayout instead of
  // computing it from windowHeight - tabBarHeight. The computed value can be
  // off by a pixel or two (and silently rounds), which causes the LAST item
  // to land slightly off-snap because there's no content past it to clamp
  // the scroll. Using the measured value guarantees viewport === itemHeight.
  const fallbackHeight = Math.max(1, windowHeight - tabBarHeight);
  const [measuredHeight, setMeasuredHeight] = useState(fallbackHeight);
  const itemHeight = measuredHeight;

  // Transient XP toast shown after earning XP from a watched video
  const [xpToast, setXpToast] = useState<XpToastState | null>(null);

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
  // Stable ref — always points to the latest fetchFeed without being a dep.
  // This prevents useFocusEffect from re-firing every time feedState changes.
  const fetchFeedRef = useRef<((refresh?: boolean) => Promise<void>) | null>(null);

  // Watch tracking
  const activeVideoStartTime = useRef<number | null>(null);
  const activeVideoId = useRef<string | null>(null);

  // Playback options state
  const [isMuted, setIsMuted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Video selected for "Share to a friend" sheet (null = sheet hidden).
  const [shareVideo, setShareVideo] = useState<Video | null>(null);

  // Pending level-up quiz (null = no quiz open). When set, the overlay is
  // shown, the underlying video is paused, and no additional quiz checks
  // fire until the current one resolves.
  const [pendingQuiz, setPendingQuiz] = useState<PendingQuiz | null>(null);
  const quizCheckInFlight = useRef(false);
  // Topics for which we've already confirmed there is no pending quiz,
  // so we don't spam `/feed/quiz/status` on every completed video.
  const topicsWithoutPendingQuiz = useRef<Set<string>>(new Set());

  // Fetch feed from API
  const fetchFeed = useCallback(async (refresh = false) => {
    // Prevent concurrent refresh calls from stacking up
    if (refresh && isLoadingMore.current) return;

    if (refresh) {
      setFeedState((prev) => ({ ...prev, refreshing: true }));
    } else if (!feedState.hasMore) {
      return;
    }

    isLoadingMore.current = true;

    try {
      const cursor = refresh ? undefined : feedState.nextCursor || undefined;
      const response = await feedService.getFeed({ limit: 10, cursor });

      if (response.data) {
        const newVideos = response.data.videos;
        setFeedState((prev) => {
          const existingIds = new Set(prev.videos.map((v) => v.id));
          const uniqueNew = refresh
            ? newVideos
            : newVideos.filter((v) => !existingIds.has(v.id));
          return {
            ...prev,
            videos: refresh ? uniqueNew : [...prev.videos, ...uniqueNew],
            nextCursor: response.data!.nextCursor,
            hasMore: response.data!.hasMore,
            loading: false,
            refreshing: false,
            error: null,
          };
        });
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

  // Keep the ref in sync with the latest fetchFeed without making it a dep
  // of useFocusEffect (which would cause useFocusEffect to re-fire on every
  // feedState update while the screen is focused).
  useEffect(() => {
    fetchFeedRef.current = fetchFeed;
  }, [fetchFeed]);

  // Initial load
  useEffect(() => {
    fetchFeed(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh feed whenever this tab comes into focus (e.g. after changing topics
  // in Profile). The stable empty-dep callback ensures this only fires on real
  // focus transitions, not on every feedState/fetchFeed recreation.
  useFocusEffect(
    useCallback(() => {
      fetchFeedRef.current?.(true);
      topicsWithoutPendingQuiz.current.clear();
    }, []),
  );

  // After any completed view we ask the server if the user now owes a
  // level-up quiz for that topic. We never re-check a topic we've already
  // confirmed is clean — the server tells us as soon as the last video at
  // the current level is watched.
  const checkQuizForTopic = useCallback(
    async (topic: string | null | undefined) => {
      if (!topic) return;
      if (pendingQuiz) return;
      if (quizCheckInFlight.current) return;
      if (topicsWithoutPendingQuiz.current.has(topic)) return;

      quizCheckInFlight.current = true;
      try {
        const res = await coreQuizApi.getStatus(topic);
        const status = res.data;
        if (!status) return;

        if (status.autoUnlocked) {
          // Server auto-unlocked (empty pool) — refetch so new-level
          // videos show up, but don't surface a quiz.
          topicsWithoutPendingQuiz.current.add(topic);
          fetchFeed(true);
          return;
        }

        if (status.pendingQuizLevel && status.hasQuestions) {
          setPendingQuiz({ topic, level: status.pendingQuizLevel });
        } else {
          topicsWithoutPendingQuiz.current.add(topic);
        }
      } catch {
        // Non-blocking — ignore quiz errors
      } finally {
        quizCheckInFlight.current = false;
      }
    },
    [pendingQuiz, fetchFeed],
  );

  // Record view for a video that is leaving the viewport
  const recordVideoView = useCallback(
    (videoId: string, startTime: number, topic?: string | null) => {
      const watchDuration = Math.round((Date.now() - startTime) / 1000);
      feedService
        .recordView(videoId, watchDuration, false)
        .then((res) => {
          if (watchDuration >= 2) checkQuizForTopic(topic);

          // Show XP toast and update profile state if XP was awarded
          const data = res.data;
          if (data?.xpAwarded && data.newXp != null && data.newLevel != null) {
            dispatch(applyXpAward({
              xpAwarded: data.xpAwarded,
              newXp: data.newXp,
              newLevel: data.newLevel,
              levelUp: data.levelUp ?? false,
            }));
            setXpToast({
              xpAwarded: data.xpAwarded,
              levelUp: data.levelUp ?? false,
              coinsAwarded: data.coinsAwarded,
            });
          }
          if (data?.playgroundCoins != null && (data?.coinsAwarded ?? 0) > 0) {
            dispatch(applyPlaygroundCoins({ playgroundCoins: data.playgroundCoins }));
          }
        })
        .catch(() => {});
    },
    [checkQuizForTopic, dispatch],
  );

  // Record view when navigating away from the feed tab
  useEffect(() => {
    if (!isFocused && activeVideoId.current && activeVideoStartTime.current !== null) {
      const watched = feedState.videos.find((v) => v.id === activeVideoId.current);
      recordVideoView(activeVideoId.current, activeVideoStartTime.current, watched?.topic);
      activeVideoStartTime.current = null;
    } else if (isFocused && activeVideoId.current) {
      activeVideoStartTime.current = Date.now();
    }
  }, [isFocused, recordVideoView, feedState.videos]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Handle load more when reaching end
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore.current && feedState.hasMore && !feedState.loading) {
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

  // Handle share action — opens the "Share to a friend" sheet for this video.
  // We snapshot the current Video object (not just the id) so the sheet can
  // render a thumbnail/title preview without a refetch.
  const handleShare = useCallback(
    (videoId: string) => {
      const v = feedState.videos.find((video) => video.id === videoId);
      if (v) setShareVideo(v);
    },
    [feedState.videos],
  );

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

  // Fires every time a video plays through to the end, regardless of auto-advance.
  // Ensures the last video in the feed (which can't be swiped away) still records
  // a watch and triggers the quiz check.
  const handleVideoComplete = useCallback((videoId: string) => {
    if (activeVideoStartTime.current === null) return;
    const video = feedState.videos.find((v) => v.id === videoId);
    recordVideoView(videoId, activeVideoStartTime.current, video?.topic);
    // Reset so a subsequent swipe doesn't double-count the same session.
    activeVideoStartTime.current = Date.now();
  }, [feedState.videos, recordVideoView]);


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
          const prevId = activeVideoId.current;
          const prevVideo = feedState.videos.find((v) => v.id === prevId);
          recordVideoView(prevId, activeVideoStartTime.current, prevVideo?.topic);
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
        isActive={index === currentIndex && isFocused && !pendingQuiz}
        isMuted={isMuted}
        onLike={handleLike}
        onComment={handleComment}
        onBookmark={handleBookmark}
        onShare={handleShare}
        onCreatorPress={handleCreatorPress}
        onTopicPress={handleTopicPress}
        onVideoEnd={autoAdvance ? handleVideoEnd : undefined}
        onVideoComplete={handleVideoComplete}
        itemHeight={itemHeight}
      />
    ),
    [
      currentIndex,
      isFocused,
      isMuted,
      autoAdvance,
      pendingQuiz,
      handleLike,
      handleComment,
      handleBookmark,
      handleShare,
      handleCreatorPress,
      handleTopicPress,
      handleVideoEnd,
      handleVideoComplete,
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
    <View
      style={styles.container}
      onLayout={(e) => {
        // Use the measured viewport as the canonical itemHeight. This avoids
        // pixel-level drift between (windowHeight - tabBarHeight) and the
        // actual layout React Navigation gives us, which is what was leaving
        // the last video half-snapped with the previous one peeking in.
        const h = Math.round(e.nativeEvent.layout.height);
        if (h > 0 && h !== measuredHeight) setMeasuredHeight(h);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Options Button */}
      <FeedOptionsButton
        isMuted={isMuted}
        autoAdvance={autoAdvance}
        onToggleMute={handleToggleMute}
        onToggleAutoAdvance={handleToggleAutoAdvance}
      />

      {/* Video Feed.
          pagingEnabled snaps to the FlatList's own viewport size — and since
          each FeedVideoItem is rendered at exactly itemHeight (== measured
          viewport), every snap lands cleanly on a single video, including
          the last one. This is more reliable than snapToInterval, which
          can drift when the computed itemHeight doesn't match the actual
          rendered viewport. */}
      <FlatList
        ref={flatListRef}
        data={feedState.videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={1}
        bounces={false}
        overScrollMode="never"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={feedState.refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Share-to-friend bottom sheet */}
      <ShareToFriendsModal
        visible={shareVideo !== null}
        video={shareVideo}
        onClose={() => setShareVideo(null)}
      />

      {/* XP toast — floats above the feed when a video XP award is received */}
      {xpToast && (
        <View style={styles.xpToastContainer} pointerEvents="none">
          <XpToast
            xpAwarded={xpToast.xpAwarded}
            levelUp={xpToast.levelUp}
            coinsAwarded={xpToast.coinsAwarded}
            onDismiss={() => setXpToast(null)}
          />
        </View>
      )}

      {/* Level-up quiz overlay */}
      {pendingQuiz && (
        <CoreQuizOverlay
          visible
          topic={pendingQuiz.topic}
          level={pendingQuiz.level}
          onClose={(result) => {
            setPendingQuiz(null);
            if (result.unlockedLevel) {
              // Clear the cache entry so the next video in that topic
              // can re-check (the user has progressed).
              topicsWithoutPendingQuiz.current.delete(pendingQuiz.topic);
              // Refetch so new-level videos enter the stream.
              fetchFeed(true);
            }
          }}
        />
      )}
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
  xpToastContainer: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
});

