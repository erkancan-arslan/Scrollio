/**
 * AvatarEditor — Visual avatar selection/customization component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

const AVATAR_OPTIONS = [
  { key: 'bear', emoji: '🐻' },
  { key: 'cat', emoji: '🐱' },
  { key: 'dog', emoji: '🐶' },
  { key: 'fox', emoji: '🦊' },
  { key: 'lion', emoji: '🦁' },
  { key: 'panda', emoji: '🐼' },
  { key: 'rabbit', emoji: '🐰' },
  { key: 'unicorn', emoji: '🦄' },
  { key: 'dragon', emoji: '🐲' },
  { key: 'owl', emoji: '🦉' },
  { key: 'penguin', emoji: '🐧' },
  { key: 'koala', emoji: '🐨' },
];

interface AvatarEditorProps {
  selectedKey?: string;
  onSelect: (key: string) => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({
  selectedKey,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose an Avatar</Text>
      <View style={styles.grid}>
        {AVATAR_OPTIONS.map((opt) => {
          const isSelected = opt.key === selectedKey;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onSelect(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={opt.key}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { ...kidsTypography.heading3, color: kidsColors.text.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  optionSelected: {
    borderColor: kidsColors.primary,
    backgroundColor: kidsColors.primary + '15',
  },
  emoji: { fontSize: 32 },
});
