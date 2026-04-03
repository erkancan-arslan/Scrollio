/**
 * VideoActions Component
 * Right-side action buttons (like, comment, bookmark, share) for feed videos
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VideoStats, VideoCreator } from '../types';
import { formatCount } from '../data/mockVideos';

interface VideoActionsProps {
  creator: VideoCreator;
  stats: VideoStats;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onCreatorPress: () => void;
}

export const VideoActions: React.FC<VideoActionsProps> = ({
  creator,
  stats,
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onCreatorPress,
}) => {
  const likeScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;

  const animateBounce = useCallback((anim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.3, useNativeDriver: true, speed: 50, bounciness: 10 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
  }, []);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateBounce(likeScale);
    onLike();
  }, [onLike, animateBounce, likeScale]);

  const handleBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateBounce(bookmarkScale);
    onBookmark();
  }, [onBookmark, animateBounce, bookmarkScale]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare();
  }, [onShare]);

  const handleComment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComment();
  }, [onComment]);

  return (
    <View style={styles.container}>
      {/* Creator Avatar */}
      <TouchableOpacity style={styles.avatarContainer} onPress={onCreatorPress} activeOpacity={0.8}>
        <Image source={{ uri: creator.avatarUrl }} style={styles.avatar} />
        <View style={styles.followBadge}>
          <Text style={styles.followBadgeText}>+</Text>
        </View>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.9}>
        <Animated.View style={[styles.iconContainer, isLiked && styles.iconContainerLiked, { transform: [{ scale: likeScale }] }]}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? '#FF4D67' : '#FFFFFF'}
          />
        </Animated.View>
        <Text style={styles.actionCount}>{formatCount(stats.likes)}</Text>
      </TouchableOpacity>

      {/* Comment Button */}
      <TouchableOpacity style={styles.actionButton} onPress={handleComment} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.comments)}</Text>
      </TouchableOpacity>

      {/* Bookmark Button */}
      <TouchableOpacity style={styles.actionButton} onPress={handleBookmark} activeOpacity={0.9}>
        <Animated.View style={[styles.iconContainer, isBookmarked && styles.iconContainerBookmarked, { transform: [{ scale: bookmarkScale }] }]}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#FFD700' : '#FFFFFF'}
          />
        </Animated.View>
        <Text style={styles.actionCount}>{formatCount(stats.bookmarks)}</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Ionicons name="arrow-redo-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.actionCount}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  actionButton: {
    alignItems: 'center',
    marginVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainerLiked: {
    backgroundColor: 'rgba(255, 77, 103, 0.2)',
  },
  iconContainerBookmarked: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
