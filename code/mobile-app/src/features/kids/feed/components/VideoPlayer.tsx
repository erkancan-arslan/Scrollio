/**
 * VideoCard — Full-screen video card for the feed
 * Uses expo-video for playback with overlay controls
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { BookmarkButton } from './BookmarkButton';
import type { KidsFeedItem } from '../types/feed.types';

interface VideoCardProps {
  item: KidsFeedItem;
  isActive: boolean;
  height: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VideoCard: React.FC<VideoCardProps> = ({ item, isActive, height }) => {
  const videoSource = item.content.videoUrl || '';

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = false;
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

  useEffect(() => {
    if (isActive && videoSource) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, videoSource, player]);

  // If no video URL, show a thumbnail/placeholder card
  if (!videoSource) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderEmoji}>📚</Text>
          <Text style={styles.placeholderTitle}>{item.content.title}</Text>
          <Text style={styles.placeholderDesc}>
            {item.content.description || 'Educational content'}
          </Text>
          {item.content.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {item.content.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Overlay Info */}
        <View style={styles.overlay}>
          <View style={styles.bottomInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {item.content.title}
            </Text>
            {item.content.tags[0] ? (
              <View style={styles.topicBadge}>
                <Text style={styles.topicText}>{item.content.tags[0]}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.sideActions}>
            <BookmarkButton
              contentId={item.contentId}
              isBookmarked={item.isBookmarked}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.bottomInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.content.title}
          </Text>
          {item.content.tags[0] ? (
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{item.content.tags[0]}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sideActions}>
          <BookmarkButton
            contentId={item.contentId}
            isBookmarked={item.isBookmarked}
          />
          {item.hasQuiz ? (
            <View style={styles.quizIndicator}>
              <Text style={styles.quizIcon}>📝</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  placeholderCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: kidsColors.background,
    padding: 32,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    ...kidsTypography.heading2,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderDesc: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: kidsColors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    ...kidsTypography.caption,
    color: kidsColors.primary,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  videoTitle: {
    ...kidsTypography.heading3,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topicBadge: {
    backgroundColor: kidsColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  topicText: {
    ...kidsTypography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sideActions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 16,
  },
  quizIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizIcon: {
    fontSize: 22,
  },
});
