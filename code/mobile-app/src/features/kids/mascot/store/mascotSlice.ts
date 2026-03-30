import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import type { RootState } from '../../../../store/store';
import {
  createCustomMascotJob,
  getCustomMascotJob,
  getLatestCustomMascotJob,
} from '../services/mascotApi';

export type KidsMascotStatus = 'none' | 'generating' | 'ready' | 'failed';

export type KidsMascotState = {
  status: KidsMascotStatus;
  progressMessage: string;
  videoUrl: string | null;
  error: string | null;
  activeJobId: string | null;
};

const initialState: KidsMascotState = {
  status: 'none',
  progressMessage: '',
  videoUrl: null,
  error: null,
  activeJobId: null,
};

const POLL_MS = 2500;
const MAX_WAIT_MS = 8 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function stepLabel(step: string | null): string {
  switch (step) {
    case 'model_3d':
      return 'Creating your 3D mascot from your drawing…';
    case 'reframer':
      return 'Reframing your mascot for video…';
    case 'upscaler':
      return 'Enhancing image quality…';
    case 'image_to_video':
      return 'Making a short clip…';
    case 'merge_audio':
      return 'Putting sound and picture together…';
    case 'done':
      return 'Finishing up…';
    default:
      return 'Working on your mascot…';
  }
}

function notifyMascotReady(): void {
  Alert.alert(
    'Your mascot is ready!',
    'Open Your Mascot in Profile anytime to watch your video.',
  );
}

async function pollJobUntilDone(
  jobId: string,
  dispatch: (action: { type: string; payload?: string | null }) => void,
): Promise<{ videoUrl: string }> {
  const deadline = Date.now() + MAX_WAIT_MS;
  let first = true;
  while (Date.now() < deadline) {
    if (!first) {
      await sleep(POLL_MS);
    }
    first = false;
    const res = await getCustomMascotJob(jobId);
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
  throw new Error('Timed out waiting for your mascot video. Try again later.');
}

export const startCustomMascotGeneration = createAsyncThunk<
  { videoUrl: string },
  { imageBase64DataUrl: string },
  { rejectValue: string }
>('kidsMascot/startGeneration', async ({ imageBase64DataUrl }, { rejectWithValue, dispatch }) => {
  try {
    const created = await createCustomMascotJob(imageBase64DataUrl);
    if (created.error || !created.data?.jobId) {
      return rejectWithValue(created.error ?? 'Could not start mascot job');
    }
    const jobId = created.data.jobId;
    dispatch({ type: 'kidsMascot/setActiveJobId', payload: jobId });
    dispatch({ type: 'kidsMascot/setProgressMessage', payload: 'Uploading and starting pipeline…' });

    const { videoUrl } = await pollJobUntilDone(jobId, dispatch);
    notifyMascotReady();
    return { videoUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Something went wrong';
    return rejectWithValue(msg);
  }
});

export const hydrateKidsMascot = createAsyncThunk<
  { videoUrl: string } | null,
  void,
  { rejectValue: string; state: RootState }
>('kidsMascot/hydrate', async (_, { rejectWithValue, dispatch, getState }) => {
  try {
    if (getState().kidsMascot.status === 'generating') {
      return null;
    }

    const res = await getLatestCustomMascotJob();
    if (res.error) {
      return rejectWithValue(res.error);
    }
    const job = res.data?.job;
    if (!job) {
      return null;
    }
    if (job.status === 'ready' && job.finalVideoUrl) {
      return { videoUrl: job.finalVideoUrl };
    }
    if (job.status === 'failed') {
      return rejectWithValue(job.errorMessage ?? 'Last mascot generation failed');
    }

    dispatch({ type: 'kidsMascot/markGenerating' });
    dispatch({ type: 'kidsMascot/setActiveJobId', payload: job.id });
    dispatch({ type: 'kidsMascot/setProgressMessage', payload: stepLabel(job.currentStep) });

    const { videoUrl } = await pollJobUntilDone(job.id, dispatch);
    notifyMascotReady();
    return { videoUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Something went wrong';
    return rejectWithValue(msg);
  }
});

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
    resetCustomMascot: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(startCustomMascotGeneration.pending, (state) => {
        state.status = 'generating';
        state.error = null;
        state.progressMessage = 'Starting…';
      })
      .addCase(startCustomMascotGeneration.fulfilled, (state, action) => {
        state.status = 'ready';
        state.videoUrl = action.payload.videoUrl;
        state.progressMessage = '';
        state.activeJobId = null;
      })
      .addCase(startCustomMascotGeneration.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Failed';
        state.progressMessage = '';
        state.activeJobId = null;
      })
      .addCase(hydrateKidsMascot.pending, (state) => {
        if (state.status === 'none') {
          state.progressMessage = 'Checking your mascot…';
        }
      })
      .addCase(hydrateKidsMascot.fulfilled, (state, action) => {
        if (action.payload?.videoUrl) {
          state.status = 'ready';
          state.videoUrl = action.payload.videoUrl;
          state.activeJobId = null;
        }
        if (state.status !== 'generating') {
          state.progressMessage = '';
        }
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

export const { setProgressMessage, setActiveJobId, markGenerating, resetCustomMascot } =
  mascotSlice.actions;
export default mascotSlice.reducer;
