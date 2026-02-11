/**
 * KidsFeedScreen — Kids content feed with swipeable video cards
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ViewToken,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchFeedThunk,
  trackViewThunk,
  setCurrentIndex,
  fetchQuizThunk,
  dismissQuiz,
} from '../store/feedSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorScreen } from '../../shared/components/ErrorScreen';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { VideoCard } from '../components/VideoPlayer';
import { QuizOverlay } from '../components/QuizOverlay';
import { BookmarkButton } from '../components/BookmarkButton';
import type { KidsFeedItem } from '../types/feed.types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = SCREEN_HEIGHT;

export const KidsFeedScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    items,
    currentIndex,
    isLoading,
    error,
    hasMore,
    page,
    showQuiz,
    activeQuiz,
    quizResult,
    videosWatchedSinceQuiz,
  } = useAppSelector((s) => s.kidsFeed);

  const flatListRef = useRef<FlatList>(null);
  const [refreshing, setRefreshing] = useState(false);
  const watchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchSecondsRef = useRef(0);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
  }, [dispatch]);

  // Track watch time for current video
  useEffect(() => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
    }
    watchSecondsRef.current = 0;

    if (items.length > 0 && currentIndex < items.length) {
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
  }, [currentIndex, items, dispatch]);

  // Trigger quiz every 5 videos
  useEffect(() => {
    if (videosWatchedSinceQuiz >= 5 && items.length > 0) {
      const currentItem = items[currentIndex];
      if (currentItem?.hasQuiz) {
        dispatch(fetchQuizThunk(currentItem.contentId));
      }
    }
  }, [videosWatchedSinceQuiz, currentIndex, items, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
    setRefreshing(false);
  }, [dispatch]);

  const handleEndReached = useCallback(() => {
    if (!isLoading && hasMore) {
      dispatch(fetchFeedThunk({ page: page + 1, limit: 10 }));
    }
  }, [dispatch, isLoading, hasMore, page]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        dispatch(setCurrentIndex(viewableItems[0].index));
      }
    },
    [dispatch],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: KidsFeedItem; index: number }) => (
      <VideoCard
        item={item}
        isActive={index === currentIndex}
        height={ITEM_HEIGHT}
      />
    ),
    [currentIndex],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  if (isLoading && items.length === 0) {
    return <LoadingSpinner message="Loading videos..." />;
  }

  if (error && items.length === 0) {
    return (
      <ErrorScreen
        message={error}
        onRetry={() => dispatch(fetchFeedThunk({ page: 1, limit: 10 }))}
      />
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <EmptyState
        title="No Videos Yet"
        message="Select some topics in your profile to see personalized content!"
        icon="📺"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={kidsColors.primary}
          />
        }
        ListFooterComponent={
          isLoading && items.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator color={kidsColors.primary} />
            </View>
          ) : null
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  footer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
