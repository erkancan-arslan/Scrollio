/**
 * Kids Feed Redux Slice
 * Manages feed items, current index, loading, pagination, and quiz state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { KidsFeedItem } from '../types/feed.types';
import * as feedApi from '../services/feedApi';
import * as quizApi from '../services/quizApi';

interface FeedState {
  items: KidsFeedItem[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  // Quiz state
  activeQuiz: {
    id: string;
    contentId: string;
    questions: Array<{ id: string; question: string; options: string[] }>;
  } | null;
  showQuiz: boolean;
  quizResult: {
    correct: boolean;
    xpEarned: number;
    correctAnswer: string;
    explanation: string | null;
  } | null;
  videosWatchedSinceQuiz: number;
}

const initialState: FeedState = {
  items: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  activeQuiz: null,
  showQuiz: false,
  quizResult: null,
  videosWatchedSinceQuiz: 0,
};

// ── Async Thunks ──

export const fetchFeedThunk = createAsyncThunk(
  'kidsFeed/fetchFeed',
  async (params: { page?: number; limit?: number; topicId?: string } = {}, { rejectWithValue }) => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const res = await feedApi.getFeed(page, limit, params.topicId);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to fetch feed');
    }
    return { ...res.data, requestedPage: page };
  },
);

export const trackViewThunk = createAsyncThunk(
  'kidsFeed/trackView',
  async (params: { contentId: string; watchedSeconds: number }, { rejectWithValue }) => {
    const res = await feedApi.trackView(params.contentId, params.watchedSeconds);
    if (res.error) {
      return rejectWithValue(res.error);
    }
    return res.data;
  },
);

export const fetchQuizThunk = createAsyncThunk(
  'kidsFeed/fetchQuiz',
  async (contentId: string, { rejectWithValue }) => {
    const res = await quizApi.getQuiz(contentId);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'No quiz found');
    }
    return res.data;
  },
);

export const submitQuizThunk = createAsyncThunk(
  'kidsFeed/submitQuiz',
  async (
    params: { quizId: string; questionId: string; selectedAnswers: string[] },
    { rejectWithValue },
  ) => {
    const res = await quizApi.submitAnswer(
      params.quizId,
      params.questionId,
      params.selectedAnswers,
    );
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to submit answer');
    }
    return res.data;
  },
);

// ── Slice ──

const feedSlice = createSlice({
  name: 'kidsFeed',
  initialState,
  reducers: {
    setCurrentIndex(state, action: PayloadAction<number>) {
      state.currentIndex = action.payload;
    },
    dismissQuiz(state) {
      state.showQuiz = false;
      state.activeQuiz = null;
      state.quizResult = null;
    },
    resetFeed() {
      return initialState;
    },
    toggleBookmarkLocal(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.contentId === action.payload || i.id === action.payload);
      if (item) {
        item.isBookmarked = !item.isBookmarked;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Feed
    builder
      .addCase(fetchFeedThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeedThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, meta, requestedPage } = action.payload;

        // Map raw response to KidsFeedItem shape
        const newItems: KidsFeedItem[] = data.map((rawItem: unknown, idx: number) => {
          const item = rawItem as Record<string, unknown>;
          return {
          id: (item.id ?? '') as string,
          contentId: (item.id ?? '') as string,
          content: {
            id: (item.id ?? '') as string,
            title: (item.title ?? '') as string,
            description: (item.description ?? '') as string,
            videoUrl: (item.video_url ?? '') as string,
            thumbnailUrl: (item.thumbnail_url ?? '') as string,
            duration: (item.duration_seconds ?? 0) as number,
            topicId: '',
            topicName: ((item.topic_tags as string[]) ?? [])[0] ?? '',
            ageGroupMin: 7,
            ageGroupMax: 12,
            difficultyLevel: (item.difficulty ?? 'easy') as 'easy' | 'medium' | 'hard',
            tags: (item.topic_tags ?? []) as string[],
            viewCount: 0,
            likeCount: 0,
            bookmarkCount: 0,
            isPublished: true,
            createdAt: (item.created_at ?? '') as string,
            updatedAt: (item.updated_at ?? '') as string,
          },
          isBookmarked: (item.isBookmarked ?? false) as boolean,
          hasQuiz: (item.hasQuiz ?? false) as boolean,
          quizCompleted: false,
          watchedSeconds: 0,
          totalSeconds: (item.duration_seconds ?? 0) as number,
          position: idx,
          createdAt: (item.created_at ?? '') as string,
          updatedAt: (item.updated_at ?? '') as string,
        };
        });

        if (requestedPage === 1) {
          state.items = newItems;
        } else {
          state.items = [...state.items, ...newItems];
        }
        state.page = meta.page;
        state.hasMore = meta.hasMore;
      })
      .addCase(fetchFeedThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Track View
    builder.addCase(trackViewThunk.fulfilled, (state) => {
      state.videosWatchedSinceQuiz++;
    });

    // Fetch Quiz
    builder
      .addCase(fetchQuizThunk.fulfilled, (state, action) => {
        state.activeQuiz = action.payload;
        state.showQuiz = true;
        state.quizResult = null;
        state.videosWatchedSinceQuiz = 0;
      })
      .addCase(fetchQuizThunk.rejected, (state) => {
        // No quiz available, silently continue
        state.videosWatchedSinceQuiz = 0;
      });

    // Submit Quiz
    builder.addCase(submitQuizThunk.fulfilled, (state, action) => {
      state.quizResult = action.payload;
    });
  },
});

export const {
  setCurrentIndex,
  dismissQuiz,
  resetFeed,
  toggleBookmarkLocal,
} = feedSlice.actions;

export default feedSlice.reducer;
