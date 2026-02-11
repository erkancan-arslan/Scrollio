/**
 * BookmarkButton — Toggleable bookmark icon with optimistic update
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useAppDispatch } from '../../../../store/hooks';
import { toggleBookmarkLocal } from '../store/feedSlice';
import { kidsApi } from '../../shared/utils/api';

interface BookmarkButtonProps {
  contentId: string;
  isBookmarked: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  contentId,
  isBookmarked,
}) => {
  const dispatch = useAppDispatch();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleToggle = async () => {
    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Optimistic update
    dispatch(toggleBookmarkLocal(contentId));

    // API call
    const res = await kidsApi.post('/kids/bookmark/toggle', { contentId });
    if (res.error) {
      // Revert on failure
      dispatch(toggleBookmarkLocal(contentId));
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      accessibilityRole="button"
    >
      <Animated.Text
        style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}
      >
        {isBookmarked ? '❤️' : '🤍'}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
});
