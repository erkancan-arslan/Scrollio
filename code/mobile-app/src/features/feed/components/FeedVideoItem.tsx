/**
 * FeedVideoItem Component
 * Full-screen video item for the TikTok-style feed
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
import * as Haptics from 'expo-haptics';
import { Video } from '../types';
import { VideoActions } from './VideoActions';
import { VideoInfo } from './VideoInfo';

const UI_HIDE_DELAY = 4000; // Hide UI after 4 seconds

// Global cache to track which videos have already loaded their first frame
// This persists across component remounts
const loadedVideosCache = new Set<string>();

interface FeedVideoItemProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onBookmark: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onCreatorPress: (creatorId: string) => void;
  onTopicPress: (topic: string) => void;
  onVideoEnd?: () => void;
  itemHeight: number;
}

export const FeedVideoItem = React.memo<FeedVideoItemProps>(function FeedVideoItem({
  video,
  isActive,
  isMuted,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onCreatorPress,
  onTopicPress,
  onVideoEnd,
  itemHeight,
}) {
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  // Check cache to see if this video has already loaded - skip loading indicator if so
  const [isLoading, setIsLoading] = useState(() => !loadedVideosCache.has(video.videoUrl));
  const [isBuffering, setIsBuffering] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showFloatingHeart, setShowFloatingHeart] = useState(false);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const heartY = useRef(new Animated.Value(0)).current;
  
  // Animation value for UI fade
  const uiOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingRef = useRef(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Calculate bottom offset for content to not overlap with any UI
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
  const player = useVideoPlayer(video.videoUrl, (player) => {
    player.loop = !onVideoEnd; // Only loop if no onVideoEnd handler (auto-advance disabled)
    player.muted = isMuted;
    // IMPORTANT: Start paused - only play when isActive
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

  // Note: Preloading removed to reduce memory usage and prevent crashes
  // HLS streaming is already fast enough without preloading

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

  // Listen for buffering/error state and playback stalls
  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'error') {
        console.error('Video playback error:', status.error);
      } else if (status.status === 'loading' && !isLoading) {
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
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Handle first frame render to hide loading and cache the loaded video
  const handleFirstFrameRender = useCallback(() => {
    loadedVideosCache.add(video.videoUrl);
    setIsLoading(false);
  }, [video.videoUrl]);

  const handleDoubleTap = useCallback(() => {
    if (!video.isLiked) {
      onLike(video.id);
    }
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Floating heart animation
    heartScale.setValue(0);
    heartOpacity.setValue(1);
    heartY.setValue(0);
    setShowFloatingHeart(true);
    Animated.parallel([
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }),
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(heartOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(heartY, { toValue: -80, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => setShowFloatingHeart(false));
    // Show UI briefly when liking
    revealUI();
  }, [video.id, video.isLiked, onLike, revealUI, heartScale, heartOpacity, heartY]);

  // Single tap behavior
  const handleSingleTap = useCallback(() => {
    if (showUI) {
      // UI is visible - pause/play the video
      if (player.playing) {
        player.pause();
        setShowPauseIcon(true);
        pauseIconTimerRef.current = setTimeout(() => setShowPauseIcon(false), 800);
        // Hide UI when pausing
        clearHideTimer();
        setShowUI(false);
        Animated.timing(uiOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Video is paused, resume playing
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
      // Single tap - toggle UI with delay to check for double tap
      tapTimerRef.current = setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
          handleSingleTap();
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  }, [handleDoubleTap, handleSingleTap]);

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

          {/* Buffering Indicator (smaller, for mid-playback stalls) */}
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

          {/* Floating Heart on double-tap */}
          {showFloatingHeart && (
            <Animated.View
              style={[
                styles.floatingHeart,
                {
                  opacity: heartOpacity,
                  transform: [{ scale: heartScale }, { translateY: heartY }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.floatingHeartText}>❤️</Text>
            </Animated.View>
          )}

          {/* Gradient Overlay for better text visibility - animated with UI */}
          <Animated.View style={{ opacity: uiOpacity }}>
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
            <VideoInfo
              video={video}
              onCreatorPress={() => onCreatorPress(video.creator.id)}
              onTopicPress={() => onTopicPress(video.topic)}
            />
          </Animated.View>

          {/* Action Buttons (Right Side) - animated */}
          <Animated.View 
            style={[styles.actionsContainer, { bottom: bottomOffset, opacity: uiOpacity }]}
            pointerEvents={showUI ? 'auto' : 'none'}
          >
            <VideoActions
              creator={video.creator}
              stats={video.stats}
              isLiked={video.isLiked}
              isBookmarked={video.isBookmarked}
              onLike={() => onLike(video.id)}
              onComment={() => onComment(video.id)}
              onBookmark={() => onBookmark(video.id)}
              onShare={() => onShare(video.id)}
              onCreatorPress={() => onCreatorPress(video.creator.id)}
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
  floatingHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    zIndex: 20,
  },
  floatingHeartText: {
    fontSize: 80,
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

