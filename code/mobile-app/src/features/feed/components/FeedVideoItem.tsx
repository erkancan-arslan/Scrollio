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
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video } from '../types';
import { VideoActions } from './VideoActions';
import { VideoInfo } from './VideoInfo';

interface FeedVideoItemProps {
  video: Video;
  isActive: boolean;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onBookmark: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onCreatorPress: (creatorId: string) => void;
  onTopicPress: (topic: string) => void;
  itemHeight: number;
}

export const FeedVideoItem: React.FC<FeedVideoItemProps> = ({
  video,
  isActive,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onCreatorPress,
  onTopicPress,
  itemHeight,
}) => {
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  
  // Calculate bottom offset for content to not overlap with any UI
  const bottomOffset = useMemo(() => 16 + insets.bottom, [insets.bottom]);

  // Create video player with expo-video
  const player = useVideoPlayer(video.videoUrl, (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Play/pause based on whether video is active in viewport
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Handle first frame render to hide loading
  const handleFirstFrameRender = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handlePress = useCallback(() => {
    if (player.playing) {
      player.pause();
      setShowPauseIcon(true);
      setTimeout(() => setShowPauseIcon(false), 800);
    } else {
      player.play();
    }
  }, [player]);

  const handleDoubleTap = useCallback(() => {
    if (!video.isLiked) {
      onLike(video.id);
    }
  }, [video.id, video.isLiked, onLike]);

  // Double tap detection
  const lastTap = useRef<number>(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    } else {
      // Single tap - toggle play/pause with delay to check for double tap
      setTimeout(() => {
        if (Date.now() - lastTap.current >= DOUBLE_TAP_DELAY) {
          handlePress();
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  }, [handleDoubleTap, handlePress]);

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

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
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

          {/* Gradient Overlay for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />

          {/* Video Info (Bottom Left) */}
          <View style={[styles.infoContainer, { bottom: bottomOffset }]}>
            <VideoInfo
              video={video}
              onCreatorPress={() => onCreatorPress(video.creator.id)}
              onTopicPress={() => onTopicPress(video.topic)}
            />
          </View>

          {/* Action Buttons (Right Side) */}
          <View style={[styles.actionsContainer, { bottom: bottomOffset }]}>
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
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

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

