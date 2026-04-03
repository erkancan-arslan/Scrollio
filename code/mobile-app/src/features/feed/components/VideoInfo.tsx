/**
 * VideoInfo Component
 * Bottom overlay showing video title, description, creator info, and topic
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Video } from '../types';

interface VideoInfoProps {
  video: Video;
  onCreatorPress: () => void;
  onTopicPress: () => void;
}

export const VideoInfo: React.FC<VideoInfoProps> = ({
  video,
  onCreatorPress,
  onTopicPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxDescriptionLength = 80;
  const description = video.description || '';
  const shouldTruncate = description.length > maxDescriptionLength;

  const displayDescription = isExpanded
    ? description
    : shouldTruncate
    ? `${description.slice(0, maxDescriptionLength)}...`
    : description;

  return (
    <View style={styles.container}>
      {/* Creator Username */}
      <TouchableOpacity onPress={onCreatorPress}>
        <View style={styles.creatorRow}>
          <Text style={styles.username}>
            @{video.creator?.username && video.creator.username !== 'unknown' ? video.creator.username : 'scrollio_team'}
          </Text>
          {(video.creator?.isVerified || !video.creator?.username || video.creator.username === 'unknown') && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Video Title */}
      <Text style={styles.title}>{video.title}</Text>

      {/* Video Description */}
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

      {/* Topic Tag */}
      <TouchableOpacity style={styles.topicContainer} onPress={onTopicPress}>
        <View style={styles.topicTag}>
          <Text style={styles.topicIcon}>📚</Text>
          <Text style={styles.topicText}>{video.topic}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: 80, // Leave space for action buttons
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    backgroundColor: '#4DA2FF',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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


