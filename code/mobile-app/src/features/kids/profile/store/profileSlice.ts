/**
 * Kids Profile Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as profileApi from '../services/profileApi';
import * as topicApi from '../services/topicApi';

interface KidsTopic {
  id: string;
  name: string;
  icon_url: string | null;
  category: string;
}

interface Metrics {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalVideosWatched: number;
  totalQuizzesTaken: number;
  totalBookmarks: number;
  totalRewards: number;
}

interface KidsProfileState {
  profile: Record<string, unknown> | null;
  metrics: Metrics | null;
  history: unknown[];
  allTopics: KidsTopic[];
  selectedTopics: KidsTopic[];
  isLoading: boolean;
  error: string | null;
}

const initialState: KidsProfileState = {
  profile: null,
  metrics: null,
  history: [],
  allTopics: [],
  selectedTopics: [],
  isLoading: false,
  error: null,
};

// ── Async Thunks ──

export const fetchProfileThunk = createAsyncThunk(
  'kidsProfile/fetchProfile',
  async (_, { rejectWithValue }) => {
    const res = await profileApi.getProfile();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to fetch profile');
    return res.data;
  },
);

export const fetchMetricsThunk = createAsyncThunk(
  'kidsProfile/fetchMetrics',
  async (_, { rejectWithValue }) => {
    const res = await profileApi.getMetrics();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to fetch metrics');
    return res.data;
  },
);

export const fetchHistoryThunk = createAsyncThunk(
  'kidsProfile/fetchHistory',
  async (_, { rejectWithValue }) => {
    const res = await profileApi.getHistory();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to fetch history');
    return res.data;
  },
);

export const fetchAllTopicsThunk = createAsyncThunk(
  'kidsProfile/fetchAllTopics',
  async (_, { rejectWithValue }) => {
    const res = await topicApi.getTopics();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to fetch topics');
    return res.data;
  },
);

export const fetchSelectedTopicsThunk = createAsyncThunk(
  'kidsProfile/fetchSelectedTopics',
  async (_, { rejectWithValue }) => {
    const res = await topicApi.getSelectedTopics();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to fetch selected topics');
    return res.data;
  },
);

export const selectTopicsThunk = createAsyncThunk(
  'kidsProfile/selectTopics',
  async (topicIds: string[], { rejectWithValue }) => {
    const res = await topicApi.selectTopics(topicIds);
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to select topics');
    return res.data;
  },
);

export const updateAvatarThunk = createAsyncThunk(
  'kidsProfile/updateAvatar',
  async (data: { avatarId: string; color?: string }, { rejectWithValue }) => {
    const res = await profileApi.updateAvatar(data);
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed to update avatar');
    return res.data;
  },
);

// ── Slice ──

const kidsProfileSlice = createSlice({
  name: 'kidsProfile',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    resetKidsProfile() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMetricsThunk.fulfilled, (state, action) => {
        state.metrics = action.payload;
      });

    builder
      .addCase(fetchHistoryThunk.fulfilled, (state, action) => {
        state.history = action.payload;
      });

    builder
      .addCase(fetchAllTopicsThunk.fulfilled, (state, action) => {
        state.allTopics = action.payload;
      });

    builder
      .addCase(fetchSelectedTopicsThunk.fulfilled, (state, action) => {
        state.selectedTopics = action.payload;
      });

    builder
      .addCase(selectTopicsThunk.fulfilled, (state, action) => {
        state.selectedTopics = action.payload;
      });

    builder
      .addCase(updateAvatarThunk.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        }
      });
  },
});

export const { setLoading, resetKidsProfile } = kidsProfileSlice.actions;
export default kidsProfileSlice.reducer;
