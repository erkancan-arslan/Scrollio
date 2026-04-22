/**
 * Kids Parental Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as parentalApi from '../services/parentalApi';

interface ActivityEntry {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ScreenTimeState {
  dailyLimitMinutes: number;
  usedMinutesToday: number;
  remainingMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  isLimitReached: boolean;
}

interface ContentFilters {
  blockedTopicIds: string[];
  maxDifficulty: string;
  safeSearchEnabled: boolean;
}

interface ParentalState {
  activities: ActivityEntry[];
  screenTime: ScreenTimeState | null;
  contentFilters: ContentFilters | null;
  mediaEngagement: parentalApi.MediaEngagementResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ParentalState = {
  activities: [],
  screenTime: null,
  contentFilters: null,
  mediaEngagement: null,
  isLoading: false,
  error: null,
};

// ── Thunks ──

export const fetchActivityThunk = createAsyncThunk(
  'kidsParental/fetchActivity',
  async (_, { rejectWithValue }) => {
    const res = await parentalApi.getActivity();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const fetchScreenTimeThunk = createAsyncThunk(
  'kidsParental/fetchScreenTime',
  async (_, { rejectWithValue }) => {
    const res = await parentalApi.getScreenTime();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const updateScreenTimeThunk = createAsyncThunk(
  'kidsParental/updateScreenTime',
  async (
    data: { dailyLimitMinutes: number; allowedStartTime?: string; allowedEndTime?: string },
    { rejectWithValue },
  ) => {
    const res = await parentalApi.updateScreenTime(data);
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const fetchContentFiltersThunk = createAsyncThunk(
  'kidsParental/fetchContentFilters',
  async (_, { rejectWithValue }) => {
    const res = await parentalApi.getContentFilters();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const updateContentFiltersThunk = createAsyncThunk(
  'kidsParental/updateContentFilters',
  async (
    data: Partial<{ blockedTopicIds: string[]; maxDifficulty: string; safeSearchEnabled: boolean }>,
    { rejectWithValue },
  ) => {
    const res = await parentalApi.updateContentFilters(data);
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const fetchMediaEngagementThunk = createAsyncThunk(
  'kidsParental/fetchMediaEngagement',
  async (_, { rejectWithValue }) => {
    const res = await parentalApi.getMediaEngagement();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

// ── Slice ──

const parentalSlice = createSlice({
  name: 'kidsParental',
  initialState,
  reducers: {
    resetParental() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchActivityThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload.data;
      })
      .addCase(fetchActivityThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchScreenTimeThunk.fulfilled, (state, action) => {
        state.screenTime = action.payload;
      });

    builder
      .addCase(updateScreenTimeThunk.fulfilled, (state, action) => {
        state.screenTime = action.payload;
      });

    builder
      .addCase(fetchContentFiltersThunk.fulfilled, (state, action) => {
        state.contentFilters = action.payload;
      });

    builder
      .addCase(updateContentFiltersThunk.fulfilled, (state, action) => {
        state.contentFilters = action.payload;
      });

    builder
      .addCase(fetchMediaEngagementThunk.fulfilled, (state, action) => {
        state.mediaEngagement = action.payload;
      });
  },
});

export const { resetParental } = parentalSlice.actions;
export default parentalSlice.reducer;
