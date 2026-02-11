/**
 * Kids-specific color palette.
 * Bright, playful colors designed for children's interface.
 */

export const kidsColors = {
  // Primary palette
  primary: '#FF6B35',
  primaryLight: '#FF8C5A',
  primaryDark: '#E55A2B',

  // Secondary palette
  secondary: '#4ECDC4',
  secondaryLight: '#7EDDD6',
  secondaryDark: '#3BA89F',

  // Accent colors
  accent: '#FFD93D',
  accentPink: '#FF6B9D',
  accentPurple: '#C44DFF',
  accentGreen: '#6BCB77',
  accentBlue: '#4D96FF',

  // Backgrounds
  background: '#FFF8F0',
  backgroundCard: '#FFFFFF',
  backgroundDark: '#2D2D2D',

  // Text
  text: {
    primary: '#2D2D2D',
    secondary: '#666666',
    muted: '#888888',
    inverse: '#FFFFFF',
    link: '#4D96FF',
  },

  // Status
  success: '#6BCB77',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4D96FF',

  // Gamification
  xp: '#FFD700',
  streak: '#FF6B35',
  badge: '#C44DFF',
  level: '#4ECDC4',

  // Borders & Dividers
  border: '#E8E0D8',
  divider: '#F0E8E0',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export type KidsColors = typeof kidsColors;
