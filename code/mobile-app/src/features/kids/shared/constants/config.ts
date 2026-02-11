/**
 * Kids module configuration.
 * API base URL, feature flags, and constants.
 */

export const kidsConfig = {
  // API — Kids endpoints are served under /kids/* via the global /api/v1 prefix.
  // The base URL is resolved dynamically by the kidsApi client (shared/utils/api.ts).
  apiPrefix: '/kids',
  apiVersion: 'v1',

  // Feature flags
  features: {
    voiceEnabled: false,
    quizzesEnabled: true,
    playgroundEnabled: true,
    bookmarksEnabled: true,
    parentalDashboard: true,
    offlineMode: false,
  },

  // Limits
  limits: {
    maxChildProfiles: 5,
    pinLength: 4,
    maxDisplayNameLength: 30,
    minDisplayNameLength: 2,
    feedPageSize: 20,
    maxBookmarks: 500,
  },

  // Timeouts (in ms)
  timeouts: {
    apiRequest: 15000,
    pinAutoLock: 300000, // 5 minutes
    sessionRefresh: 3600000, // 1 hour
  },
} as const;

export type KidsConfig = typeof kidsConfig;
