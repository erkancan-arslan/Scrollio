/**
 * KidsVideoItem Component
 * Full-screen video item for the Kids TikTok-style feed.
 * Ported from the main feed's FeedVideoItem with Kids-specific adaptations:
 * - No creator avatar (kids content is system-curated)
 * - Like, Bookmark, Share actions (no Comment)
 * - Quiz indicator badge
 * - Same tap/double-tap, UI auto-hide, gradient, loading/buffering behavior
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KidsVideoActions } from './KidsVideoActions';
import { KidsVideoInfo } from './KidsVideoInfo';
import type { KidsFeedItem } from '../types/feed.types';

const UI_HIDE_DELAY = 4000; // Hide UI after 4 seconds

// Global cache to track which videos have already loaded their first frame
const loadedVideosCache = new Set<string>();

interface KidsVideoItemProps {
  item: KidsFeedItem;
  isActive: boolean;
  isMuted: boolean;
  onLike: (contentId: string) => void;
  onBookmark: (contentId: string) => void;
  onShare: (contentId: string) => void;
  onTopicPress?: (topic: string) => void;
  onVideoEnd?: () => void;
  itemHeight: number;
}

export const KidsVideoItem = React.memo<KidsVideoItemProps>(function KidsVideoItem({
  item,
  isActive,
  isMuted,
  onLike,
  onBookmark,
  onShare,
  onTopicPress,
  onVideoEnd,
  itemHeight,
}) {
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const videoUrl = item.content.videoUrl || '';

  // Check cache to see if this video has already loaded
  const [isLoading, setIsLoading] = useState(() => !loadedVideosCache.has(videoUrl));
  const [isBuffering, setIsBuffering] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Animation value for UI fade
  const uiOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingRef = useRef(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate bottom offset for content
  const bottomOffset = useMemo(() => 16 + insets.bottom, [insets.bottom]);

  // Clear hide timer
  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Start hide timer
  const startHideTimer = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setShowUI(false);
      Animated.timing(uiOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, UI_HIDE_DELAY);
  }, [clearHideTimer, uiOpacity]);

  // Show UI with animation
  const revealUI = useCallback(() => {
    setShowUI(true);
    Animated.timing(uiOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    startHideTimer();
  }, [uiOpacity, startHideTimer]);

  // Start timer when video becomes active
  useEffect(() => {
    if (isActive) {
      startHideTimer();
    } else {
      clearHideTimer();
      // Show UI when video is not active
      setShowUI(true);
      uiOpacity.setValue(1);
    }
    return () => clearHideTimer();
  }, [isActive, startHideTimer, clearHideTimer, uiOpacity]);

  // Create video player with expo-video
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = !onVideoEnd;
    player.muted = isMuted;
    player.pause();
  });

  // Release the native player on unmount to prevent memory leaks (expo-video v3 bug).
  // Guard with try-catch: if the native object was already destroyed (e.g. by a
  // re-render cycle), calling pause/release on the stale JS reference throws
  // NativeSharedObjectNotFoundException.
  useEffect(() => {
    return () => {
      try {
        player.pause();
        player.release();
      } catch {
        // Native player already released — nothing to do
      }
    };
  }, [player]);

  // Update muted state when prop changes
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // Listen for video end when auto-advance is enabled
  useEffect(() => {
    if (!onVideoEnd) {
      player.loop = true;
      return;
    }

    player.loop = false;

    const subscription = player.addListener('playToEnd', () => {
      onVideoEnd();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onVideoEnd]);

  // Listen for buffering state changes
  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'loading' && !isLoading) {
        setIsBuffering(true);
      } else if (status.status === 'readyToPlay') {
        setIsBuffering(false);
      }
    });

    const playingSubscription = player.addListener('playingChange', (isPlaying) => {
      if (isActive && wasPlayingRef.current && !isPlaying.isPlaying && !player.currentTime) {
        setIsBuffering(true);
      } else if (isPlaying.isPlaying) {
        setIsBuffering(false);
      }
      wasPlayingRef.current = isPlaying.isPlaying;
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
    };
  }, [player, isActive, isLoading]);

  // Play/pause based on whether video is active in viewport
  useEffect(() => {
    if (isActive && videoUrl) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, videoUrl, player]);

  // Handle first frame render to hide loading and cache the loaded video
  const handleFirstFrameRender = useCallback(() => {
    if (videoUrl) {
      loadedVideosCache.add(videoUrl);
    }
    setIsLoading(false);
  }, [videoUrl]);

  const handleDoubleTap = useCallback(() => {
    if (!item.isLiked) {
      onLike(item.contentId);
    }
    revealUI();
  }, [item.contentId, item.isLiked, onLike, revealUI]);

  // Single tap behavior
  const handleSingleTap = useCallback(() => {
    if (showUI) {
      // UI is visible - pause/play the video
      if (player.playing) {
        player.pause();
        setShowPauseIcon(true);
        pauseIconTimerRef.current = setTimeout(() => setShowPauseIcon(false), 800);
        clearHideTimer();
        setShowUI(false);
        Animated.timing(uiOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        player.play();
        startHideTimer();
      }
    } else {
      // UI is hidden - show UI and start timer
      revealUI();
    }
  }, [showUI, player, clearHideTimer, uiOpacity, revealUI, startHideTimer]);

  // Cancel pending tap/pause-icon timers on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (pauseIconTimerRef.current) clearTimeout(pauseIconTimerRef.current);
    };
  }, []);

  // Double tap detection
  const lastTap = useRef<number>(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      handleDoubleTap();
    } else {
      tapTimerRef.current = setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
          handleSingleTap();
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  }, [handleDoubleTap, handleSingleTap]);

  // Placeholder when no video URL
  if (!videoUrl) {
    return (
      <View style={[styles.container, { width, height: itemHeight }]}>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderEmoji}>📚</Text>
          <Text style={styles.placeholderTitle}>{item.content.title}</Text>
          <Text style={styles.placeholderDesc}>
            {item.content.description || 'Educational content'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height: itemHeight }]}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.videoContainer}>
          {/* Video Player */}
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
            onFirstFrameRender={handleFirstFrameRender}
          />

          {/* Initial Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {/* Buffering Indicator */}
          {!isLoading && isBuffering && (
            <View style={styles.bufferingOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}

          {/* Pause Icon Overlay */}
          {showPauseIcon && (
            <View style={styles.pauseOverlay}>
              <View style={styles.pauseIconContainer}>
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              </View>
            </View>
          )}

          {/* Gradient Overlay - animated with UI */}
          <Animated.View style={{ opacity: uiOpacity }} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              locations={[0, 0.5, 1]}
              style={styles.gradientOverlay}
            />
          </Animated.View>

          {/* Video Info (Bottom Left) - animated */}
          <Animated.View
            style={[styles.infoContainer, { bottom: bottomOffset, opacity: uiOpacity }]}
            pointerEvents={showUI ? 'auto' : 'none'}
          >
            <KidsVideoInfo
              item={item}
              onTopicPress={onTopicPress}
            />
          </Animated.View>

          {/* Action Buttons (Right Side) - animated */}
          <Animated.View
            style={[styles.actionsContainer, { bottom: bottomOffset, opacity: uiOpacity }]}
            pointerEvents={showUI ? 'auto' : 'none'}
          >
            <KidsVideoActions
              likeCount={item.content.likeCount}
              bookmarkCount={item.content.bookmarkCount}
              isLiked={item.isLiked}
              isBookmarked={item.isBookmarked}
              hasQuiz={item.hasQuiz}
              onLike={() => onLike(item.contentId)}
              onBookmark={() => onBookmark(item.contentId)}
              onShare={() => onShare(item.contentId)}
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 32,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bufferingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15,
    marginTop: -15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 8,
  },
  pauseBar: {
    width: 8,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 350,
  },
  infoContainer: {
    position: 'absolute',
    left: 16,
    right: 80,
    zIndex: 10,
  },
  actionsContainer: {
    position: 'absolute',
    right: 8,
    zIndex: 10,
  },
});
