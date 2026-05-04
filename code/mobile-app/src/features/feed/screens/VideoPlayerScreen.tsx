/**
 * VideoPlayerScreen
 *
 * Standalone video viewer used when a user taps a shared post in chat. Loads
 * a single video by id and renders it with the same `FeedVideoItem` used in
 * the main feed, so users get the full like / bookmark / comment experience
 * (and the player auto-plays just like in the feed).
 *
 * Route: `VideoPlayer` { videoId: string }
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useIsFocused,
} from '@react-navigation/native';
import { Video } from '../types';
import { feedService } from '../../../services';
import { FeedVideoItem, ShareToFriendsModal } from '../components';
import { colors } from '../../../theme';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store/store';
import { applyXpAward, applyPlaygroundCoins } from '../../profile/store/profileSlice';

type VideoPlayerRouteProp = RouteProp<RootStackParamList, 'VideoPlayer'>;

export const VideoPlayerScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute<VideoPlayerRouteProp>();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { videoId } = route.params;
  const { height: windowHeight } = Dimensions.get('window');

  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [shareVideo, setShareVideo] = useState<Video | null>(null);

  const loadVideo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await feedService.getVideo(videoId);
    setIsLoading(false);

    if (res.data) {
      setVideo(res.data);
    } else {
      setError(res.error || 'Video not found');
    }
  }, [videoId]);

  useEffect(() => {
    void loadVideo();
  }, [loadVideo]);

  // Record a view once the user lands on this screen. Best-effort.
  useEffect(() => {
    if (!video) return;
    const startedAt = Date.now();
    return () => {
      const watched = Math.round((Date.now() - startedAt) / 1000);
      feedService
        .recordView(video.id, watched, false)
        .then((res) => {
          const data = res.data;
          if (data?.xpAwarded && data.newXp != null && data.newLevel != null) {
            dispatch(
              applyXpAward({
                xpAwarded: data.xpAwarded,
                newXp: data.newXp,
                newLevel: data.newLevel,
                levelUp: data.levelUp ?? false,
              }),
            );
          }
          if (data?.playgroundCoins != null && (data?.coinsAwarded ?? 0) > 0) {
            dispatch(applyPlaygroundCoins({ playgroundCoins: data.playgroundCoins }));
          }
        })
        .catch(() => {});
    };
  }, [video]);

  // --- Like (optimistic) -------------------------------------------------
  const handleLike = useCallback(
    async (id: string) => {
      if (!video || video.id !== id) return;
      const wasLiked = video.isLiked;

      setVideo((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              stats: {
                ...prev.stats,
                likes: prev.isLiked ? prev.stats.likes - 1 : prev.stats.likes + 1,
              },
            }
          : prev,
      );

      try {
        const res = wasLiked
          ? await feedService.unlikeVideo(id)
          : await feedService.likeVideo(id);
        if (!res.data?.success) throw new Error('like failed');
      } catch {
        // Revert
        setVideo((prev) =>
          prev
            ? {
                ...prev,
                isLiked: wasLiked,
                stats: {
                  ...prev.stats,
                  likes: wasLiked ? prev.stats.likes + 1 : prev.stats.likes - 1,
                },
              }
            : prev,
        );
      }
    },
    [video],
  );

  // --- Bookmark (optimistic) --------------------------------------------
  const handleBookmark = useCallback(
    async (id: string) => {
      if (!video || video.id !== id) return;
      const wasBookmarked = video.isBookmarked;

      setVideo((prev) =>
        prev
          ? {
              ...prev,
              isBookmarked: !prev.isBookmarked,
              stats: {
                ...prev.stats,
                bookmarks: prev.isBookmarked
                  ? prev.stats.bookmarks - 1
                  : prev.stats.bookmarks + 1,
              },
            }
          : prev,
      );

      try {
        const res = wasBookmarked
          ? await feedService.unbookmarkVideo(id)
          : await feedService.bookmarkVideo(id);
        if (!res.data?.success) throw new Error('bookmark failed');
      } catch {
        setVideo((prev) =>
          prev
            ? {
                ...prev,
                isBookmarked: wasBookmarked,
                stats: {
                  ...prev.stats,
                  bookmarks: wasBookmarked
                    ? prev.stats.bookmarks + 1
                    : prev.stats.bookmarks - 1,
                },
              }
            : prev,
        );
      }
    },
    [video],
  );

  const handleShare = useCallback(() => {
    if (video) setShareVideo(video);
  }, [video]);

  const handleComment = useCallback(() => {
    // TODO: comments modal — same as FeedScreen placeholder
  }, []);

  const handleCreatorPress = useCallback(() => {
    // TODO: navigate to creator profile
  }, []);

  const handleTopicPress = useCallback(() => {
    // TODO: navigate to topic feed
  }, []);

  if (isLoading) {
    return (
      <View style={styles.statusContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  if (error || !video) {
    return (
      <View style={styles.statusContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Ionicons name="alert-circle-outline" size={48} color="#FFF" />
        <Text style={styles.errorText}>{error || 'Video unavailable'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadVideo}>
          <Ionicons name="refresh" size={16} color="#FFF" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryBtn, styles.backBtn]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FeedVideoItem
        video={video}
        isActive={isFocused}
        isMuted={isMuted}
        onLike={handleLike}
        onComment={handleComment}
        onBookmark={handleBookmark}
        onShare={handleShare}
        onCreatorPress={handleCreatorPress}
        onTopicPress={handleTopicPress}
        itemHeight={windowHeight}
      />

      {/* Floating header — back + mute. The feed UI fades after a few seconds
          so we keep these controls always-visible with a translucent bg. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setIsMuted((m) => !m)}
          hitSlop={8}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={22}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <ShareToFriendsModal
        visible={shareVideo !== null}
        video={shareVideo}
        onClose={() => setShareVideo(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
    marginTop: 16,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
