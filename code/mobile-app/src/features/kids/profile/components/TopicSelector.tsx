/**
 * TopicSelector — Grid of selectable topic chips
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface Topic {
  id: string;
  name: string;
  icon?: string;
}

interface TopicSelectorProps {
  topics: Topic[];
  selectedIds: string[];
  onToggle: (topicId: string) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedIds,
  onToggle,
}) => {
  const renderItem = ({ item }: { item: Topic }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => onToggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={item.name}
      >
        {item.icon ? <Text style={styles.chipIcon}>{item.icon}</Text> : null}
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={topics}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  row: { gap: 8, marginBottom: 8 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: kidsColors.border,
    gap: 6,
  },
  chipSelected: {
    borderColor: kidsColors.primary,
    backgroundColor: kidsColors.primary + '15',
  },
  chipIcon: { fontSize: 18 },
  chipText: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '600' },
  chipTextSelected: { color: kidsColors.primary },
});
