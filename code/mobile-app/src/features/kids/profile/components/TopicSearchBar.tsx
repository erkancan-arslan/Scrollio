/**
 * TopicSearchBar — Search input for filtering topics
 */

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface TopicSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const TopicSearchBar: React.FC<TopicSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search topics...',
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={kidsColors.text.muted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...kidsTypography.body,
    color: kidsColors.text.primary,
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
});
