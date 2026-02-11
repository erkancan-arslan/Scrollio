/**
 * ColorPalette — Color selection row for the drawing tool
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';

const COLORS = [
  '#000000', '#FF6B35', '#4ECDC4', '#FFD93D', '#FF6B9D',
  '#C44DFF', '#6BCB77', '#4D96FF', '#FF6B6B', '#FFFFFF',
];

interface ColorPaletteProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      {COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.dot,
            { backgroundColor: color },
            selectedColor === color && styles.dotSelected,
          ]}
          onPress={() => onSelect(color)}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedColor === color }}
          accessibilityLabel={`Color ${color}`}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dotSelected: {
    borderColor: kidsColors.text.primary,
    borderWidth: 3,
  },
});
