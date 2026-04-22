/**
 * SettingsMenu — Navigation menu for settings sections
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'mascot', label: 'My friend (mascot)', icon: '🐾' },
  { key: 'topics', label: 'My topics', icon: '📚' },
  { key: 'avatar', label: 'Change Avatar', icon: '🧑‍🎨' },
];

interface SettingsMenuProps {
  onNavigate: (screen: string) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.menuItem}
          onPress={() => onNavigate(item.key)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 0 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: kidsColors.border,
  },
  menuIcon: { fontSize: 24, marginRight: 12 },
  menuLabel: { ...kidsTypography.body, color: kidsColors.text.primary, fontWeight: '500', flex: 1 },
  chevron: { fontSize: 24, color: kidsColors.text.muted },
});
