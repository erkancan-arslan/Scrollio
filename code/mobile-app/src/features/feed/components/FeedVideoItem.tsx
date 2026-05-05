/**
 * FeedVideoItem Component
 * Full-screen video item for the TikTok-style feed
 */

import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
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
  /** Fires every time the video plays through to the end, regardless of auto-advance. */
  onVideoComplete?: (videoId: string) => void;
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
  onVideoComplete,
  itemHeight,
}) {
  const { width } = Dimensions.get('window');
  // Each item now fills the full screen (so pagingEnabled snaps cleanly),
  // which means the bottom of the item sits behind the absolute tab bar.
  // Pull bottom UI overlays above the tab bar by its full reported height
  // (which already includes the iOS safe-area inset).
  //
  // We read the tab-bar height from context directly (instead of the
  // `useBottomTabBarHeight` hook) so this component can also be rendered
  // OUTSIDE the bottom-tab navigator — e.g. inside `VideoPlayerScreen`,
  // which is pushed as a stack screen when a friend taps a shared video
  // in chat. The hook throws there; the context returns `undefined` and
  // we fall back to 0.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
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
  // Ref mirror of isActive — always current inside native event listeners,
  // avoids stale closure issues when expo-video fires events asynchronously.
  const isActiveRef = useRef(isActive);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keep UI elements above the (absolute) tab bar so they aren't clipped
  const bottomOffset = useMemo(() => 16 + tabBarHeight, [tabBarHeight]);

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

  // Keep the ref in sync so native event listeners always see the current value
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

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
    // Disable native looping whenever we need the playToEnd event (auto-advance or
    // completion tracking). We replay manually when auto-advance is off.
    player.loop = !onVideoEnd && !onVideoComplete;
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

  // Listen for video end — needed for auto-advance and/or completion tracking
  useEffect(() => {
    if (!onVideoEnd && !onVideoComplete) {
      player.loop = true;
      return;
    }

    player.loop = false;

    const subscription = player.addListener('playToEnd', () => {
      onVideoComplete?.(video.id);
      if (onVideoEnd) {
        onVideoEnd();
      } else {
        // No auto-advance — replay so the video keeps looping visually,
        // but we still got to fire onVideoComplete above.
        player.replay();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, onVideoEnd, onVideoComplete, video.id]);

  // Listen for buffering/error state and playback stalls
  useEffect(() => {
    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'error') {
        console.error('Video playback error:', status.error);
      } else if (status.status === 'loading' && !isLoading) {
        setIsBuffering(true);
      } else if (status.status === 'readyToPlay') {
        setIsBuffering(false);
        // Prevent the native layer from auto-starting when a non-active
        // video finishes buffering/loading (expo-video race condition).
        if (!isActiveRef.current) {
          player.pause();
        }
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      // If the native layer started playback but this item is not active,
      // force-pause immediately. Handles all expo-video auto-start races.
      if (event.isPlaying && !isActiveRef.current) {
        player.pause();
        return;
      }
      if (isActiveRef.current && wasPlayingRef.current && !event.isPlaying && !player.currentTime) {
        setIsBuffering(true);
      } else if (event.isPlaying) {
        setIsBuffering(false);
      }
      wasPlayingRef.current = event.isPlaying;
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

  const handleReplay = useCallback(() => {
    player.replay();
    player.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    revealUI();
  }, [player, revealUI]);

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
          {/* The outer item is full-screen so pagingEnabled snaps cleanly,
              but the video frame itself ends `tabBarHeight` above the bottom
              so burnt-in subtitles stay visible above the tab bar. */}
          <VideoView
            player={player}
            style={[styles.video, { bottom: tabBarHeight }]}
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
            <TouchableOpacity
              style={styles.replayButton}
              onPress={handleReplay}
              activeOpacity={0.75}
              accessibilityLabel="Replay video"
            >
              <Text style={styles.replayIcon}>↩</Text>
            </TouchableOpacity>
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
    alignItems: 'center',
  },
  replayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  replayIcon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});

