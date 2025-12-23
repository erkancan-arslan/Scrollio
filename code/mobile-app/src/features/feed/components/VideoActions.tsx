/**
 * VideoActions Component
 * Right-side action buttons (like, comment, bookmark) for feed videos
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
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
  return (
    <View style={styles.container}>
      {/* Creator Avatar */}
      <TouchableOpacity style={styles.avatarContainer} onPress={onCreatorPress}>
        <Image source={{ uri: creator.avatarUrl }} style={styles.avatar} />
        <View style={styles.followBadge}>
          <Text style={styles.followBadgeText}>+</Text>
        </View>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onLike}>
        <View style={[styles.iconContainer, isLiked && styles.iconContainerActive]}>
          <Text style={[styles.icon, isLiked && styles.iconActive]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.likes)}</Text>
      </TouchableOpacity>

      {/* Comment Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onComment}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💬</Text>
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.comments)}</Text>
      </TouchableOpacity>

      {/* Bookmark Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
        <View style={[styles.iconContainer, isBookmarked && styles.iconContainerActive]}>
          <Text style={[styles.icon, isBookmarked && styles.iconActive]}>
            {isBookmarked ? '🔖' : '📑'}
          </Text>
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.bookmarks)}</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onShare}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>↗️</Text>
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
  iconContainerActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  icon: {
    fontSize: 26,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
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


