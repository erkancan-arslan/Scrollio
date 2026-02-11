/**
 * AnimationPlayer — Placeholder for playing character animations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface AnimationPlayerProps {
  animationUrl?: string;
  placeholder?: string;
}

export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  animationUrl,
  placeholder = 'Animation will play here',
}) => {
  return (
    <View style={styles.container}>
      {animationUrl ? (
        <Text style={styles.placeholder}>Playing: {animationUrl}</Text>
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: kidsColors.border,
    borderStyle: 'dashed',
  },
  placeholder: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
});
