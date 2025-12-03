/**
 * Color palette for Scrollio
 * Following brain/04-development/standards/coding-style.md
 */

export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#4DA2FF',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#E8E8E8',

  // Text colors
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    disabled: '#CCCCCC',
    inverse: '#FFFFFF',
  },

  // UI colors
  border: '#E0E0E0',
  divider: '#F0F0F0',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // Gamification colors
  xp: '#FFD700',
  level: '#FF6B6B',
  achievement: '#9B59B6',

  // Dark mode (for future)
  dark: {
    background: '#000000',
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    text: {
      primary: '#FFFFFF',
      secondary: '#EBEBF5',
      tertiary: '#8E8E93',
    },
  },
} as const;

export type Colors = typeof colors;
