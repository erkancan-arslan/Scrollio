/**
 * Redux slice for the Kids 48h drawing-video cycle.
 *
 * State:
 *   - cycleDueAt / serverNow / loadedAt → countdown UI uses these to compute
 *     remaining time without trusting the device clock alone.
 *   - latestJob → if status is queued/processing, the polling loop runs.
 *   - pinnedVideoUrl / pinnedUntil → information echoed from the feed prepend.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getCycleStatus,
  getJob,
  tickCycle,
  type KidsDrawingVideoCycleStatusDto,
  type KidsDrawingVideoJobDto,
} from '../services/drawingVideoApi';

export interface DrawingVideoState {
  /** ISO timestamp when the next 48h cycle becomes due. */
  cycleDueAt: string | null;
  /** Server `now()` at the moment cycleDueAt was loaded. */
  serverNow: string | null;
  /** Local Date.now() at the moment cycleDueAt was loaded — used to compute drift. */
  loadedAtClient: number | null;

  pinnedVideoUrl: string | null;
  pinnedUntil: string | null;
  lastGeneratedAt: string | null;

  latestJob: KidsDrawingVideoJobDto | null;
  isLoadingStatus: boolean;
  isTicking: boolean;
  error: string | null;
}

const initialState: DrawingVideoState = {
  cycleDueAt: null,
  serverNow: null,
  loadedAtClient: null,
  pinnedVideoUrl: null,
  pinnedUntil: null,
  lastGeneratedAt: null,
  latestJob: null,
  isLoadingStatus: false,
  isTicking: false,
  error: null,
};

// ── Thunks ───────────────────────────────────────────────────────────────────

export const refreshCycleStatusThunk = createAsyncThunk<
  KidsDrawingVideoCycleStatusDto & { loadedAtClient: number },
  void,
  { rejectValue: string }
>('kidsDrawingVideo/refreshCycleStatus', async (_, { rejectWithValue }) => {
  const res = await getCycleStatus();
  if (res.error || !res.data) {
    return rejectWithValue(res.error ?? 'Could not load cycle status');
  }
  return { ...res.data, loadedAtClient: Date.now() };
});

export const tickCycleThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('kidsDrawingVideo/tick', async (_, { dispatch, rejectWithValue }) => {
  const res = await tickCycle();
  if (res.error) {
    return rejectWithValue(res.error);
  }
  // Always refresh status afterwards so the UI sees the new job (if any).
  await dispatch(refreshCycleStatusThunk());
});

export const pollJobThunk = createAsyncThunk<
  KidsDrawingVideoJobDto,
  string,
  { rejectValue: string }
>('kidsDrawingVideo/pollJob', async (jobId, { rejectWithValue }) => {
  const res = await getJob(jobId);
  if (res.error || !res.data?.job) {
    return rejectWithValue(res.error ?? 'Could not load job');
  }
  return res.data.job;
});

// ── Slice ────────────────────────────────────────────────────────────────────

const drawingVideoSlice = createSlice({
  name: 'kidsDrawingVideo',
  initialState,
  reducers: {
    clearDrawingVideo: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshCycleStatusThunk.pending, (state) => {
        state.isLoadingStatus = true;
        state.error = null;
      })
      .addCase(refreshCycleStatusThunk.fulfilled, (state, action) => {
        state.isLoadingStatus = false;
        state.cycleDueAt = action.payload.cycleDueAt;
        state.serverNow = action.payload.serverNow;
        state.loadedAtClient = action.payload.loadedAtClient;
        state.pinnedVideoUrl = action.payload.pinnedVideoUrl;
        state.pinnedUntil = action.payload.pinnedUntil;
        state.lastGeneratedAt = action.payload.lastGeneratedAt;
        state.latestJob = action.payload.latestJob;
      })
      .addCase(refreshCycleStatusThunk.rejected, (state, action) => {
        state.isLoadingStatus = false;
        state.error = action.payload ?? action.error.message ?? 'Failed to load status';
      })

      .addCase(tickCycleThunk.pending, (state) => {
        state.isTicking = true;
        state.error = null;
      })
      .addCase(tickCycleThunk.fulfilled, (state) => {
        state.isTicking = false;
      })
      .addCase(tickCycleThunk.rejected, (state, action) => {
        state.isTicking = false;
        state.error = action.payload ?? action.error.message ?? 'Tick failed';
      })

      .addCase(pollJobThunk.fulfilled, (state, action) => {
        state.latestJob = action.payload;
      });
  },
});

export const { clearDrawingVideo } = drawingVideoSlice.actions;
export default drawingVideoSlice.reducer;

// ── Selectors / helpers ──────────────────────────────────────────────────────

export type CycleClock = {
  /** Estimated server now in milliseconds, accounting for drift since last load. */
  estimatedNowMs: number;
  /** Cycle due time in milliseconds. */
  dueAtMs: number;
  /** Remaining ms (>= 0). */
  remainingMs: number;
  /** True if cycle is due (dueAt <= estimatedNow). */
  isDue: boolean;
};

/**
 * Compute the current countdown clock from the snapshot saved at load time.
 * Returns null if the cycle status hasn't been loaded yet.
 */
export function computeCycleClock(state: DrawingVideoState, nowMsClient: number): CycleClock | null {
  if (!state.cycleDueAt || !state.serverNow || state.loadedAtClient == null) {
    return null;
  }
  const drift = nowMsClient - state.loadedAtClient;
  const estimatedNowMs = new Date(state.serverNow).getTime() + drift;
  const dueAtMs = new Date(state.cycleDueAt).getTime();
  const remainingMs = Math.max(0, dueAtMs - estimatedNowMs);
  return { estimatedNowMs, dueAtMs, remainingMs, isDue: remainingMs <= 0 };
}

/** True when a job is in flight on the server (mobile should poll). */
export function isJobInFlight(job: KidsDrawingVideoJobDto | null): boolean {
  return job?.status === 'queued' || job?.status === 'processing';
}
