/**
 * Kids Feed Redux Slice
 * Manages feed items, current index, loading, pagination, and quiz state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { KidsFeedItem } from '../types/feed.types';
import * as feedApi from '../services/feedApi';
import * as quizApi from '../services/quizApi';

function normalizeKidsDifficulty(v: unknown): 'easy' | 'medium' | 'hard' | null {
  if (v === 'easy' || v === 'medium' || v === 'hard') return v;
  return null;
}

interface FeedState {
  items: KidsFeedItem[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  /** Why the last fetch returned no rows (from GET /kids/feed meta). */
  emptyReason: 'no_mascot' | 'no_topics' | 'no_matching_content' | null;
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
  emptyReason: null,
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
        item.content.bookmarkCount += item.isBookmarked ? 1 : -1;
      }
    },
    toggleLikeLocal(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.contentId === action.payload || i.id === action.payload);
      if (item) {
        item.isLiked = !item.isLiked;
        item.content.likeCount += item.isLiked ? 1 : -1;
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
          const band = (item.age_group as string) || '7-9';
          const ageGroupMin = band === '10-12' ? 10 : 7;
          const ageGroupMax = band === '10-12' ? 12 : 9;
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
            ageGroupMin,
            ageGroupMax,
            difficultyLevel: normalizeKidsDifficulty(item.difficulty),
            tags: (item.topic_tags ?? []) as string[],
            viewCount: ((item.view_count as number) ?? 0),
            likeCount: ((item.like_count as number) ?? 0),
            bookmarkCount: ((item.bookmark_count as number) ?? 0),
            isPublished: true,
            createdAt: (item.created_at ?? '') as string,
            updatedAt: (item.updated_at ?? '') as string,
          },
          isLiked: (item.isLiked ?? false) as boolean,
          isBookmarked: (item.isBookmarked ?? false) as boolean,
          hasQuiz: (item.hasQuiz ?? false) as boolean,
          quizCompleted: false,
          watchedSeconds: 0,
          totalSeconds: (item.duration_seconds ?? 0) as number,
          position: idx,
          isPinned: (item.isPinned ?? false) as boolean,
          pinnedUntil: (item.pinnedUntil ?? null) as string | null,
          createdAt: (item.created_at ?? '') as string,
          updatedAt: (item.updated_at ?? '') as string,
        };
        });

        if (requestedPage === 1) {
          state.items = newItems;
          state.emptyReason = meta.emptyReason ?? null;
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
  toggleLikeLocal,
} = feedSlice.actions;

export default feedSlice.reducer;
