/**
 * CharacterPreview — Displays a character avatar with name and description
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface CharacterPreviewProps {
  name: string;
  emoji?: string;
  description?: string;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  name,
  emoji = '🧑‍🚀',
  description,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, padding: 16 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: kidsColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 48 },
  name: { ...kidsTypography.heading3, color: kidsColors.text.primary },
  desc: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, textAlign: 'center' },
});
