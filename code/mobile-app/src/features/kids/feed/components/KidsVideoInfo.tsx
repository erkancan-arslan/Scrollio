/**
 * KidsVideoInfo Component
 * Bottom-left overlay showing video title, description, and topic tag.
 * Mirrors the main feed's VideoInfo component adapted for Kids content.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { KidsFeedItem } from '../types/feed.types';

interface KidsVideoInfoProps {
  item: KidsFeedItem;
  onTopicPress?: (topic: string) => void;
}

export const KidsVideoInfo: React.FC<KidsVideoInfoProps> = ({
  item,
  onTopicPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = item.content.description || '';
  const maxDescriptionLength = 80;
  const shouldTruncate = description.length > maxDescriptionLength;

  const displayDescription = isExpanded
    ? description
    : shouldTruncate
    ? `${description.slice(0, maxDescriptionLength)}...`
    : description;

  const topicName = item.content.topicName || item.content.tags?.[0] || '';

  return (
    <View style={styles.container}>
      {/* Video Title */}
      <Text style={styles.title} numberOfLines={2}>
        {item.content.title}
      </Text>

      {/* Video Description */}
      {description.length > 0 && (
        <TouchableOpacity
          onPress={() => shouldTruncate && setIsExpanded(!isExpanded)}
          activeOpacity={shouldTruncate ? 0.7 : 1}
        >
          <Text style={styles.description}>
            {displayDescription}
            {shouldTruncate && !isExpanded && (
              <Text style={styles.seeMore}> See more</Text>
            )}
          </Text>
        </TouchableOpacity>
      )}

      {/* Topic Tag */}
      {topicName.length > 0 && (
        <TouchableOpacity
          style={styles.topicContainer}
          onPress={() => onTopicPress?.(topicName)}
          activeOpacity={onTopicPress ? 0.7 : 1}
        >
          <View style={styles.topicTag}>
            <Text style={styles.topicIcon}>📚</Text>
            <Text style={styles.topicText}>{topicName}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 80, // Leave space for action buttons
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeMore: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  topicContainer: {
    marginTop: 12,
    flexDirection: 'row',
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  topicText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
