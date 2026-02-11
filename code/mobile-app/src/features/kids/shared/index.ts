// Types
export { UserRole } from './types';
export type { ChildProfile, PaginatedResponse, ApiResult } from './types';

// Components
export {
  SafeAreaWrapper,
  LoadingSpinner,
  ErrorBoundary,
  KidsThemedButton,
  EmptyState,
  ErrorScreen,
} from './components';

// Hooks
export { useSupabase, useNetworkStatus, useActiveChild } from './hooks';

// Utils
export { kidsApi, getItem, setItem, removeItem, clearAll } from './utils';
export type { KidsApiResponse } from './utils';
export {
  isValidPin,
  isValidDisplayName,
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  isValidDateOfBirth,
  getAge,
} from './utils';

// Constants
export { kidsColors, kidsTypography, kidsConfig } from './constants';
