import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import type { RootState } from '../../../../store/store';
import {
  createCustomMascotJob,
  getCustomMascotJob,
  getLatestCustomMascotJob,
} from '../services/mascotApi';

// ── Types ────────────────────────────────────────────────────────────────────

export type KidsMascotStatus = 'none' | 'generating' | 'ready' | 'failed';

export type KidsMascotState = {
  status: KidsMascotStatus;
  progressMessage: string;
  videoUrl: string | null;
  error: string | null;
  activeJobId: string | null;
  /** Increments on every new generation start or cancel. Guards stale completions. */
  generationNonce: number;
};

const initialState: KidsMascotState = {
  status: 'none',
  progressMessage: '',
  videoUrl: null,
  error: null,
  activeJobId: null,
  generationNonce: 0,
};

// ── Module-level abort controller ────────────────────────────────────────────
// Not in Redux state (not serializable) — lives here as a live reference.

let _activeController: AbortController | null = null;

/** Abort any in-flight generation / hydration poll loop immediately. */
export function abortActiveGeneration(): void {
  _activeController?.abort();
  _activeController = null;
}

function createController(): AbortController {
  _activeController?.abort(); // cancel previous if any
  _activeController = new AbortController();
  return _activeController;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const POLL_MS = 2500;
const MAX_WAIT_MS = 8 * 60 * 1000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('aborted')); }, { once: true });
  });
}

export function stepLabel(step: string | null): string {
  switch (step) {
    case 'model_3d':      return 'Creating your 3D mascot…';
    case 'reframer':      return 'Composing the scene…';
    case 'upscaler':      return 'Enhancing quality…';
    case 'image_to_video': return 'Animating your mascot…';
    case 'merge_audio':   return 'Adding the finishing touches…';
    case 'done':          return 'Almost ready!';
    default:              return 'Working on your mascot…';
  }
}

export const PIPELINE_STEPS = [
  { key: 'model_3d',       label: '3D style' },
  { key: 'reframer',       label: 'Compose' },
  { key: 'upscaler',       label: 'Enhance' },
  { key: 'image_to_video', label: 'Animate' },
  { key: 'merge_audio',    label: 'Sound' },
] as const;

function notifyMascotReady(): void {
  Alert.alert('Your mascot is ready! 🎉', "Head to Your Mascot in Profile to watch your video.");
}

type DispatchFn = (action: { type: string; payload?: string | null }) => void;

async function pollJobUntilDone(
  jobId: string,
  dispatch: DispatchFn,
  signal: AbortSignal,
): Promise<{ videoUrl: string }> {
  const deadline = Date.now() + MAX_WAIT_MS;
  let first = true;

  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error('aborted');
    if (!first) await sleep(POLL_MS, signal);
    first = false;

    const res = await getCustomMascotJob(jobId);
    if (signal.aborted) throw new Error('aborted');
    if (res.error || !res.data?.job) {
      throw new Error(res.error ?? 'Could not load job status');
    }

    const job = res.data.job;
    dispatch({ type: 'kidsMascot/setProgressMessage', payload: stepLabel(job.currentStep) });

    if (job.status === 'ready' && job.finalVideoUrl) {
      return { videoUrl: job.finalVideoUrl };
    }
    if (job.status === 'failed') {
      throw new Error(job.errorMessage ?? 'Generation failed');
    }
  }
  throw new Error('Timed out waiting for your mascot video. Please try again.');
}

// ── Thunks ───────────────────────────────────────────────────────────────────

export const startCustomMascotGeneration = createAsyncThunk<
  { videoUrl: string; nonce: number },
  { imageBase64DataUrl: string },
  { rejectValue: string; state: RootState }
>(
  'kidsMascot/startGeneration',
  async ({ imageBase64DataUrl }, { rejectWithValue, dispatch, getState }) => {
    const nonce = (getState() as RootState).kidsMascot.generationNonce;
    const controller = createController();
    const { signal } = controller;

    try {
      const created = await createCustomMascotJob(imageBase64DataUrl);
      if (signal.aborted) return rejectWithValue('aborted');
      if (created.error || !created.data?.jobId) {
        return rejectWithValue(created.error ?? 'Could not start mascot job');
      }

      const jobId = created.data.jobId;
      dispatch({ type: 'kidsMascot/setActiveJobId', payload: jobId });
      dispatch({ type: 'kidsMascot/setProgressMessage', payload: 'Starting pipeline…' });

      const { videoUrl } = await pollJobUntilDone(jobId, dispatch, signal);
      notifyMascotReady();
      return { videoUrl, nonce };
    } catch (e) {
      if (signal.aborted || (e instanceof Error && e.message === 'aborted')) {
        return rejectWithValue('aborted');
      }
      return rejectWithValue(e instanceof Error ? e.message : 'Something went wrong');
    }
  },
  {
    // Prevent launching a second generation while one is already in progress
    condition: (_, { getState }) => {
      return (getState() as RootState).kidsMascot.status !== 'generating';
    },
  },
);

export const hydrateKidsMascot = createAsyncThunk<
  { videoUrl: string; nonce: number } | null,
  void,
  { rejectValue: string; state: RootState }
>(
  'kidsMascot/hydrate',
  async (_, { rejectWithValue, dispatch, getState }) => {
    const { status, videoUrl, generationNonce: nonce } = (getState() as RootState).kidsMascot;

    // An active generation thunk is already polling — don't touch it
    if (status === 'generating') return null;
    // Already have a finished video — nothing to fetch
    if (status === 'ready' && videoUrl) return null;

    const res = await getLatestCustomMascotJob();
    if (res.error) return rejectWithValue(res.error);

    const job = res.data?.job;
    if (!job) return null;

    if (job.status === 'ready' && job.finalVideoUrl) {
      return { videoUrl: job.finalVideoUrl, nonce };
    }
    if (job.status === 'failed') {
      return rejectWithValue(job.errorMessage ?? 'Last mascot generation failed');
    }

    // Job is still in progress on the server — resume polling
    const controller = createController();
    dispatch({ type: 'kidsMascot/markGenerating' });
    dispatch({ type: 'kidsMascot/setActiveJobId', payload: job.id });
    dispatch({ type: 'kidsMascot/setProgressMessage', payload: stepLabel(job.currentStep) });

    try {
      const { videoUrl: newUrl } = await pollJobUntilDone(job.id, dispatch, controller.signal);
      notifyMascotReady();
      return { videoUrl: newUrl, nonce };
    } catch (e) {
      if (e instanceof Error && e.message === 'aborted') return null;
      return rejectWithValue(e instanceof Error ? e.message : 'Something went wrong');
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const mascotSlice = createSlice({
  name: 'kidsMascot',
  initialState,
  reducers: {
    setProgressMessage: (state, action: PayloadAction<string>) => {
      state.progressMessage = action.payload;
    },
    setActiveJobId: (state, action: PayloadAction<string | null>) => {
      state.activeJobId = action.payload;
    },
    markGenerating: (state) => {
      state.status = 'generating';
      state.error = null;
    },
    /** Cancel in-flight generation. Pair with abortActiveGeneration() to stop the poll loop. */
    cancelMascotGeneration: (state) => {
      state.status = 'none';
      state.error = null;
      state.progressMessage = '';
      state.activeJobId = null;
      state.generationNonce += 1; // invalidate any stale thunk completion
    },
    resetCustomMascot: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ── startCustomMascotGeneration ──────────────────────────────────────
      .addCase(startCustomMascotGeneration.pending, (state) => {
        state.status = 'generating';
        state.error = null;
        state.videoUrl = null; // clear previous video while the new one generates
        state.progressMessage = 'Starting…';
        state.generationNonce += 1;
      })
      .addCase(startCustomMascotGeneration.fulfilled, (state, action) => {
        // Guard stale completions: the nonce must still match and we must still be generating
        if (state.status !== 'generating') return;
        if (state.generationNonce !== action.payload.nonce + 1) return;
        state.status = 'ready';
        state.videoUrl = action.payload.videoUrl;
        state.progressMessage = '';
        state.activeJobId = null;
      })
      .addCase(startCustomMascotGeneration.rejected, (state, action) => {
        if (action.payload === 'aborted') {
          // User-initiated cancel — only reset if still in generating state (not already cancelled)
          if (state.status === 'generating') {
            state.status = 'none';
            state.progressMessage = '';
            state.activeJobId = null;
          }
          return;
        }
        if (state.status !== 'generating') return; // stale rejection after cancel
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Failed';
        state.progressMessage = '';
        state.activeJobId = null;
      })

      // ── hydrateKidsMascot ────────────────────────────────────────────────
      .addCase(hydrateKidsMascot.pending, (state) => {
        if (state.status === 'none') {
          state.progressMessage = 'Checking your mascot…';
        }
      })
      .addCase(hydrateKidsMascot.fulfilled, (state, action) => {
        if (!action.payload?.videoUrl) {
          if (state.status !== 'generating') state.progressMessage = '';
          return;
        }
        // Don't override an active generation thunk
        if (state.status === 'generating') return;
        state.status = 'ready';
        state.videoUrl = action.payload.videoUrl;
        state.progressMessage = '';
        state.activeJobId = null;
      })
      .addCase(hydrateKidsMascot.rejected, (state, action) => {
        if (action.payload) {
          state.status = 'failed';
          state.error = action.payload;
        }
        state.progressMessage = '';
      });
  },
});

export const {
  setProgressMessage,
  setActiveJobId,
  markGenerating,
  cancelMascotGeneration,
  resetCustomMascot,
} = mascotSlice.actions;

export default mascotSlice.reducer;
