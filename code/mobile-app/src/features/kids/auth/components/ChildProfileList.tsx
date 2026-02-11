/**
 * ChildProfileList — Grid of child profile cards with add button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import type { ChildProfile } from '../../shared/types';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface ChildProfileListProps {
  profiles: ChildProfile[];
  activeChildId?: string | null;
  onSelect: (profileId: string) => void;
  onCreateNew?: () => void;
}

export const ChildProfileList: React.FC<ChildProfileListProps> = ({
  profiles,
  activeChildId,
  onSelect,
  onCreateNew,
}) => {
  const renderItem = ({ item }: { item: ChildProfile }) => {
    const isActive = item.id === activeChildId;
    const initial = item.displayName?.charAt(0)?.toUpperCase() ?? '?';

    return (
      <TouchableOpacity
        style={[styles.card, isActive && styles.cardActive]}
        onPress={() => onSelect(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.displayName}`}
      >
        <View style={[styles.avatar, isActive && styles.avatarActive]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{item.displayName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
        ListFooterComponent={
          onCreateNew ? (
            <TouchableOpacity style={styles.addCard} onPress={onCreateNew} accessibilityRole="button">
              <Text style={styles.addIcon}>+</Text>
              <Text style={styles.addText}>Add Child</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardActive: { borderColor: kidsColors.primary },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: kidsColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarActive: { backgroundColor: kidsColors.primary },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  name: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600', textAlign: 'center' },
  addCard: {
    backgroundColor: kidsColors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: kidsColors.border,
    borderStyle: 'dashed',
    width: '48%',
  },
  addIcon: { fontSize: 32, color: kidsColors.text.muted, marginBottom: 4 },
  addText: { ...kidsTypography.bodySmall, color: kidsColors.text.muted, fontWeight: '600' },
});
