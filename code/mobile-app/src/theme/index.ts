/**
 * Theme barrel export
 * Centralizes all theme values
 */

export { colors, type Colors } from './colors';
export { spacing, type Spacing } from './spacing';
export { typography, type Typography } from './typography';

// Combined theme object
export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
};

export type Theme = typeof theme;
