/**
 * Kids Progression Redux Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as progressionApi from '../services/progressionApi';

interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  current: number;
  xpReward: number;
}

interface ProgressionState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progressPercentage: number;
  missions: Mission[];
  completedMissionIds: string[];
  rewards: unknown[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgressionState = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  progressPercentage: 0,
  missions: [],
  completedMissionIds: [],
  rewards: [],
  isLoading: false,
  error: null,
};

// ── Thunks ──

export const fetchProgressThunk = createAsyncThunk(
  'kidsProgression/fetchProgress',
  async (_, { rejectWithValue }) => {
    const res = await progressionApi.getProgress();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const fetchMissionsThunk = createAsyncThunk(
  'kidsProgression/fetchMissions',
  async (_, { rejectWithValue }) => {
    const res = await progressionApi.getDailyMissions();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

export const completeMissionThunk = createAsyncThunk(
  'kidsProgression/completeMission',
  async (missionId: string, { rejectWithValue }) => {
    const res = await progressionApi.completeMissionApi(missionId);
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return { missionId, ...res.data };
  },
);

export const fetchRewardsThunk = createAsyncThunk(
  'kidsProgression/fetchRewards',
  async (_, { rejectWithValue }) => {
    const res = await progressionApi.getRewards();
    if (res.error || !res.data) return rejectWithValue(res.error || 'Failed');
    return res.data;
  },
);

// ── Slice ──

const progressionSlice = createSlice({
  name: 'kidsProgression',
  initialState,
  reducers: {
    addXpLocal(state, action: PayloadAction<number>) {
      state.xp += action.payload;
      if (state.xp >= state.xpToNextLevel) {
        state.xp -= state.xpToNextLevel;
        state.level++;
        state.xpToNextLevel = state.level * 100;
      }
      state.progressPercentage = Math.round((state.xp / state.xpToNextLevel) * 100);
    },
    resetProgression() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgressThunk.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProgressThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.level = action.payload.level;
        state.xp = action.payload.currentXp;
        state.xpToNextLevel = action.payload.xpToNextLevel;
        state.progressPercentage = action.payload.progressPercentage;
      })
      .addCase(fetchProgressThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMissionsThunk.fulfilled, (state, action) => {
        state.missions = action.payload.missions;
        state.completedMissionIds = action.payload.completed;
      });

    builder
      .addCase(completeMissionThunk.fulfilled, (state, action) => {
        const { missionId, xpEarned } = action.payload;
        if (!state.completedMissionIds.includes(missionId)) {
          state.completedMissionIds.push(missionId);
        }
        state.xp += xpEarned;
        if (state.xp >= state.xpToNextLevel) {
          state.xp -= state.xpToNextLevel;
          state.level++;
          state.xpToNextLevel = state.level * 100;
        }
        state.progressPercentage = Math.round((state.xp / state.xpToNextLevel) * 100);
      });

    builder.addCase(fetchRewardsThunk.fulfilled, (state, action) => {
      state.rewards = action.payload;
    });
  },
});

export const { addXpLocal, resetProgression } = progressionSlice.actions;
export default progressionSlice.reducer;
