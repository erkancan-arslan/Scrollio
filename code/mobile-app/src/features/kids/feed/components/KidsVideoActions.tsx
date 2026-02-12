/**
 * KidsVideoActions Component
 * Right-side action buttons (like, bookmark, share) for kids feed videos.
 * Mirrors the main feed's VideoActions but without Comment button.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface KidsVideoActionsProps {
  likeCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  hasQuiz: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const KidsVideoActions: React.FC<KidsVideoActionsProps> = ({
  likeCount,
  bookmarkCount,
  isLiked,
  isBookmarked,
  hasQuiz,
  onLike,
  onBookmark,
  onShare,
}) => {
  return (
    <View style={styles.container}>
      {/* Like Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onLike}>
        <View style={[styles.iconContainer, isLiked && styles.iconContainerActive]}>
          <Text style={[styles.icon, isLiked && styles.iconActive]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
        </View>
        <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
      </TouchableOpacity>

      {/* Bookmark Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
        <View style={[styles.iconContainer, isBookmarked && styles.iconContainerActive]}>
          <Text style={[styles.icon, isBookmarked && styles.iconActive]}>
            {isBookmarked ? '🔖' : '📑'}
          </Text>
        </View>
        <Text style={styles.actionCount}>{formatCount(bookmarkCount)}</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onShare}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>↗️</Text>
        </View>
        <Text style={styles.actionCount}>Share</Text>
      </TouchableOpacity>

      {/* Quiz Indicator */}
      {hasQuiz && (
        <View style={styles.quizIndicator}>
          <Text style={styles.quizIcon}>📝</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
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
  quizIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  quizIcon: {
    fontSize: 22,
  },
});
