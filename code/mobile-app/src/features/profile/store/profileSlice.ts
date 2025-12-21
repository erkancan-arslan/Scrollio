/**
 * Profile Redux Slice
 * Manages profile state including user profile data, bookmarks, likes, and watch history
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profileService } from '../../../services/profile/profileService';
import { feedService } from '../../../services/feed/feedService';
import { Profile, ProfileTab } from '../types';
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

  // Liked videos (using feed data)
  likedVideos: Video[];
  likesLoading: boolean;
  likesError: string | null;

  // Watched videos history
  watchedVideos: Video[];
  watchedLoading: boolean;
  watchedError: string | null;
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

  watchedVideos: [],
  watchedLoading: false,
  watchedError: null,
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
      // Update video in bookmarks list
      const index = state.bookmarkedVideos.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.bookmarkedVideos[index] = action.payload;
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
        state.profile = action.payload;
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

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload as string;
      });
  },
});

export const {
  setActiveTab,
  clearProfile,
  addBookmark,
  removeBookmark,
  updateVideoInBookmarks,
} = profileSlice.actions;

export default profileSlice.reducer;
