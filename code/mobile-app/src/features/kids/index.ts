/**
 * Kids Feature — Main barrel export
 * Re-exports screens from all kids sub-features
 * (Using named exports to avoid ambiguous re-export conflicts)
 */

// Feed
export { KidsFeedScreen } from './feed';

// Playground
export { KidsPlaygroundScreen } from './playground';

// Profile
export { KidsProfileScreen } from './profile';

// Parental
export {
  KidsParentalDashboardScreen,
  KidsActivityMonitorScreen,
  KidsContentSafetyScreen,
  KidsScreenTimeScreen,
} from './parental';

// Settings — no screens, components only
export { SettingsMenu, NotificationPrefs, LogOutButton } from './settings';
