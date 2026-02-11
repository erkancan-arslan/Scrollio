/**
 * SavedContents — Grid/list of bookmarked content items
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface SavedItem {
  id: string;
  title?: string;
  thumbnailUrl?: string;
}

interface SavedContentsProps {
  items: SavedItem[];
}

export const SavedContents: React.FC<SavedContentsProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📑</Text>
        <Text style={styles.emptyText}>No saved content yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailIcon}>📺</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title ?? 'Saved Item'}</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  empty: { padding: 24, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
  row: { gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  thumbnail: {
    height: 80,
    backgroundColor: kidsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: { fontSize: 28 },
  title: { ...kidsTypography.caption, color: kidsColors.text.primary, padding: 8, fontWeight: '600' },
});
