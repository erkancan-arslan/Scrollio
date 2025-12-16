/**
 * FeedScreen - TikTok-style vertical video feed
 * Main screen after user signs in
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  StatusBar,
  ViewToken,
  Dimensions,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FeedVideoItem } from '../components';
import { Video } from '../types';
import { mockVideos } from '../data/mockVideos';

export const FeedScreen: React.FC = () => {
  const { height: windowHeight } = Dimensions.get('window');
  const tabBarHeight = useBottomTabBarHeight();
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Calculate the exact height for each video item
  // Subtract tab bar height so content doesn't overflow behind it
  const itemHeight = useMemo(() => {
    const calculated = windowHeight - tabBarHeight;
    return calculated > 0 ? calculated : windowHeight;
  }, [windowHeight, tabBarHeight]);

  // Handle like action
  const handleLike = useCallback((videoId: string) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) =>
        video.id === videoId
          ? {
              ...video,
              isLiked: !video.isLiked,
              stats: {
                ...video.stats,
                likes: video.isLiked
                  ? video.stats.likes - 1
                  : video.stats.likes + 1,
              },
            }
          : video
      )
    );
  }, []);

  // Handle bookmark action
  const handleBookmark = useCallback((videoId: string) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) =>
        video.id === videoId
          ? {
              ...video,
              isBookmarked: !video.isBookmarked,
              stats: {
                ...video.stats,
                bookmarks: video.isBookmarked
                  ? video.stats.bookmarks - 1
                  : video.stats.bookmarks + 1,
              },
            }
          : video
      )
    );
  }, []);

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

  // Track viewable items for auto-play
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Render each video item
  const renderItem = useCallback(
    ({ item, index }: { item: Video; index: number }) => (
      <FeedVideoItem
        video={item}
        isActive={index === currentIndex}
        onLike={handleLike}
        onComment={handleComment}
        onBookmark={handleBookmark}
        onShare={handleShare}
        onCreatorPress={handleCreatorPress}
        onTopicPress={handleTopicPress}
        itemHeight={itemHeight}
      />
    ),
    [
      currentIndex,
      handleLike,
      handleComment,
      handleBookmark,
      handleShare,
      handleCreatorPress,
      handleTopicPress,
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Video Feed */}
      <FlatList
        ref={flatListRef}
        data={videos}
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
        initialNumToRender={2}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

