/**
 * Profile Redux Slice
 * Manages profile state including user profile data, bookmarks, likes, and watch history
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profileService } from '../../../services/profile/profileService';
import { feedService } from '../../../services/feed/feedService';
import { Profile, ProfileTab, WeeklyAnalytics } from '../types';
import { Video } from '../../feed/types';

interface ProfileState {
  // Current user's profile
  profile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;

  // Active tab
  activeTab: ProfileTab;

  // Bookmarked videos
  bookmarkedVideos: Video[];
  bookmarksLoading: boolean;
  bookmarksError: string | null;
  bookmarksCursor: string | null;
  hasMoreBookmarks: boolean;

  // Liked videos
  likedVideos: Video[];
  likesLoading: boolean;
  likesError: string | null;
  likesCursor: string | null;
  hasMoreLikes: boolean;

  // Watched videos history
  watchedVideos: Video[];
  watchedLoading: boolean;
  watchedError: string | null;
  watchedCursor: string | null;
  hasMoreWatched: boolean;

  // Weekly analytics
  weeklyAnalytics: WeeklyAnalytics | null;
  weeklyAnalyticsLoading: boolean;
  weeklyAnalyticsError: string | null;
}

const initialState: ProfileState = {
  profile: null,
  profileLoading: false,
  profileError: null,

  activeTab: 'bookmarks',

  bookmarkedVideos: [],
  bookmarksLoading: false,
  bookmarksError: null,
  bookmarksCursor: null,
  hasMoreBookmarks: true,

  likedVideos: [],
  likesLoading: false,
  likesError: null,
  likesCursor: null,
  hasMoreLikes: true,

  watchedVideos: [],
  watchedLoading: false,
  watchedError: null,
  watchedCursor: null,
  hasMoreWatched: true,

  weeklyAnalytics: null,
  weeklyAnalyticsLoading: false,
  weeklyAnalyticsError: null,
};

// Async thunks
export const fetchMyProfile = createAsyncThunk(
  'profile/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    const response = await profileService.getMyProfile();
    if (response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to fetch profile');
  }
);

export const fetchBookmarkedVideos = createAsyncThunk(
  'profile/fetchBookmarkedVideos',
  async (params: { limit?: number; cursor?: string; loadMore?: boolean }, { rejectWithValue }) => {
    const response = await feedService.getBookmarkedFeed({
      limit: params.limit || 20,
      cursor: params.cursor,
    });
    if (response.data) {
      return {
        videos: response.data.videos,
        nextCursor: response.data.nextCursor,
        loadMore: params.loadMore || false,
      };
    }
    return rejectWithValue(response.error || 'Failed to fetch bookmarks');
  }
);

export const fetchLikedVideos = createAsyncThunk(
  'profile/fetchLikedVideos',
  async (params: { limit?: number; cursor?: string; loadMore?: boolean }, { rejectWithValue }) => {
    const response = await feedService.getLikedFeed({
      limit: params.limit || 20,
      cursor: params.cursor,
    });
    if (response.data) {
      return {
        videos: response.data.videos,
        nextCursor: response.data.nextCursor,
        loadMore: params.loadMore || false,
      };
    }
    return rejectWithValue(response.error || 'Failed to fetch liked videos');
  }
);

export const fetchWatchedVideos = createAsyncThunk(
  'profile/fetchWatchedVideos',
  async (params: { limit?: number; cursor?: string; loadMore?: boolean }, { rejectWithValue }) => {
    const response = await feedService.getWatchedFeed({
      limit: params.limit || 20,
      cursor: params.cursor,
    });
    if (response.data) {
      return {
        videos: response.data.videos,
        nextCursor: response.data.nextCursor,
        loadMore: params.loadMore || false,
      };
    }
    return rejectWithValue(response.error || 'Failed to fetch watch history');
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (data: Parameters<typeof profileService.updateProfile>[0], { rejectWithValue }) => {
    const response = await profileService.updateProfile(data);
    if (response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to update profile');
  }
);

export const fetchWeeklyAnalytics = createAsyncThunk(
  'profile/fetchWeeklyAnalytics',
  async (_, { rejectWithValue }) => {
    const response = await profileService.getWeeklyAnalytics();
    if (response.data) return response.data;
    return rejectWithValue(response.error || 'Failed to fetch weekly analytics');
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ProfileTab>) => {
      state.activeTab = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.bookmarkedVideos = [];
      state.likedVideos = [];
      state.watchedVideos = [];
      state.bookmarksCursor = null;
      state.hasMoreBookmarks = true;
      state.likesCursor = null;
      state.hasMoreLikes = true;
      state.watchedCursor = null;
      state.hasMoreWatched = true;
      state.weeklyAnalytics = null;
      state.weeklyAnalyticsLoading = false;
      state.weeklyAnalyticsError = null;
    },
    addBookmark: (state, action: PayloadAction<Video>) => {
      // Add video to bookmarks if not already present
      if (!state.bookmarkedVideos.find(v => v.id === action.payload.id)) {
        state.bookmarkedVideos.unshift(action.payload);
      }
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      // Remove video from bookmarks
      state.bookmarkedVideos = state.bookmarkedVideos.filter(v => v.id !== action.payload);
    },
    updateVideoInBookmarks: (state, action: PayloadAction<Video>) => {
      const index = state.bookmarkedVideos.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.bookmarkedVideos[index] = action.payload;
      }
    },
    applyXpAward: (
      state,
      action: PayloadAction<{ xpAwarded: number; newXp: number; newLevel: number; levelUp: boolean }>,
    ) => {
      if (state.profile) {
        state.profile.xp = action.payload.newXp;
        state.profile.level = action.payload.newLevel;
      }
    },
    applyPlaygroundCoins: (state, action: PayloadAction<{ playgroundCoins: number }>) => {
      if (state.profile) {
        state.profile.playgroundCoins = action.payload.playgroundCoins;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch my profile
    builder
      .addCase(fetchMyProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        const incoming = {
          ...action.payload,
          playgroundCoins: action.payload.playgroundCoins ?? 0,
        };
        // Guard against a stale server snapshot overwriting XP/level that
        // applyXpAward already wrote into Redux with fresher data.
        // XP / playground balances only increase from client awards; prefer the larger snapshot.
        if (state.profile) {
          let merged = incoming;
          if (incoming.xp < state.profile.xp) {
            merged = { ...merged, xp: state.profile.xp, level: state.profile.level };
          }
          const incCoins = incoming.playgroundCoins ?? 0;
          const prevCoins = state.profile.playgroundCoins ?? 0;
          if (incCoins < prevCoins) {
            merged = { ...merged, playgroundCoins: prevCoins };
          }
          state.profile = merged;
        } else {
          state.profile = incoming;
        }
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload as string;
      });

    // Fetch bookmarked videos
    builder
      .addCase(fetchBookmarkedVideos.pending, (state) => {
        state.bookmarksLoading = true;
        state.bookmarksError = null;
      })
      .addCase(fetchBookmarkedVideos.fulfilled, (state, action) => {
        state.bookmarksLoading = false;
        if (action.payload.loadMore) {
          // Append to existing videos (pagination)
          state.bookmarkedVideos = [...state.bookmarkedVideos, ...action.payload.videos];
        } else {
          // Replace videos (initial load or refresh)
          state.bookmarkedVideos = action.payload.videos;
        }
        state.bookmarksCursor = action.payload.nextCursor || null;
        state.hasMoreBookmarks = !!action.payload.nextCursor;
      })
      .addCase(fetchBookmarkedVideos.rejected, (state, action) => {
        state.bookmarksLoading = false;
        state.bookmarksError = action.payload as string;
      });

    // Fetch liked videos
    builder
      .addCase(fetchLikedVideos.pending, (state) => {
        state.likesLoading = true;
        state.likesError = null;
      })
      .addCase(fetchLikedVideos.fulfilled, (state, action) => {
        state.likesLoading = false;
        if (action.payload.loadMore) {
          state.likedVideos = [...state.likedVideos, ...action.payload.videos];
        } else {
          state.likedVideos = action.payload.videos;
        }
        state.likesCursor = action.payload.nextCursor || null;
        state.hasMoreLikes = !!action.payload.nextCursor;
      })
      .addCase(fetchLikedVideos.rejected, (state, action) => {
        state.likesLoading = false;
        state.likesError = action.payload as string;
      });

    // Fetch watched videos
    builder
      .addCase(fetchWatchedVideos.pending, (state) => {
        state.watchedLoading = true;
        state.watchedError = null;
      })
      .addCase(fetchWatchedVideos.fulfilled, (state, action) => {
        state.watchedLoading = false;
        if (action.payload.loadMore) {
          state.watchedVideos = [...state.watchedVideos, ...action.payload.videos];
        } else {
          state.watchedVideos = action.payload.videos;
        }
        state.watchedCursor = action.payload.nextCursor || null;
        state.hasMoreWatched = !!action.payload.nextCursor;
      })
      .addCase(fetchWatchedVideos.rejected, (state, action) => {
        state.watchedLoading = false;
        state.watchedError = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = {
          ...action.payload,
          playgroundCoins: action.payload.playgroundCoins ?? 0,
        };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload as string;
      });

    // Fetch weekly analytics
    builder
      .addCase(fetchWeeklyAnalytics.pending, (state) => {
        state.weeklyAnalyticsLoading = true;
        state.weeklyAnalyticsError = null;
      })
      .addCase(fetchWeeklyAnalytics.fulfilled, (state, action) => {
        state.weeklyAnalyticsLoading = false;
        state.weeklyAnalytics = action.payload;
      })
      .addCase(fetchWeeklyAnalytics.rejected, (state, action) => {
        state.weeklyAnalyticsLoading = false;
        state.weeklyAnalyticsError = action.payload as string;
      });
  },
});

export const {
  setActiveTab,
  clearProfile,
  addBookmark,
  removeBookmark,
  updateVideoInBookmarks,
  applyXpAward,
  applyPlaygroundCoins,
} = profileSlice.actions;

export default profileSlice.reducer;
