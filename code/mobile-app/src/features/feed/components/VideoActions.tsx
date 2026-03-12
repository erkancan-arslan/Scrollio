/**
 * VideoActions Component
 * Right-side action buttons (like, comment, bookmark, share) for feed videos
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={[styles.iconContainer, isLiked && styles.iconContainerLiked]}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? '#FF4D67' : '#FFFFFF'}
          />
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.likes)}</Text>
      </TouchableOpacity>

      {/* Comment Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onComment}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.comments)}</Text>
      </TouchableOpacity>

      {/* Bookmark Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
        <View style={[styles.iconContainer, isBookmarked && styles.iconContainerBookmarked]}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#FFD700' : '#FFFFFF'}
          />
        </View>
        <Text style={styles.actionCount}>{formatCount(stats.bookmarks)}</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onShare}>
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
