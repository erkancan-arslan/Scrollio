# 003. State Management - Redux Toolkit

**Date:** 2025-12-03
**Status:** Accepted
**Deciders:** Engineering Team, Frontend Lead
**Tags:** frontend, state-management, react-native

## Context

Scrollio needs a state management solution to handle:

**State Categories:**
- **Authentication state:** Current user, session, auth status
- **User profile:** Display name, avatar, level, XP, preferences
- **Video feed state:** Current videos, selected topic, playback state
- **Quiz state:** Current quiz, questions, answers, scores
- **Parental controls:** Child profiles, limits, allowed topics
- **UI state:** Modal visibility, loading states, error messages

**Requirements:**
- **Predictable state:** Single source of truth, deterministic updates
- **Developer experience:** Easy debugging, time-travel, state inspection
- **Performance:** Optimized re-renders, memoization support
- **Async handling:** API calls, video loading, quiz submission
- **TypeScript support:** Fully typed state and actions
- **Persistence:** Save state to AsyncStorage (offline support)
- **Testability:** Easy to test reducers and async logic

**Constraints:**
- React Native environment
- Team has React experience but limited state management experience
- Need to balance simplicity with scalability

## Decision

**We will use Redux Toolkit as our primary state management library.**

Redux Toolkit provides:
- **Simplified Redux:** Less boilerplate than classic Redux
- **Immer integration:** Immutable updates with mutable syntax
- **Redux Thunk:** Built-in async middleware
- **DevTools:** Time-travel debugging, action history
- **RTK Query:** Built-in data fetching and caching (future)
- **TypeScript support:** Excellent type inference

**We will:**
- Use Redux Toolkit slices for feature-based state
- Use Redux Thunk for async actions (API calls)
- Use typed hooks (`useAppDispatch`, `useAppSelector`)
- Keep slices focused on single feature (auth, feed, quiz, profile)
- Persist critical state to AsyncStorage (auth, user preferences)
- Use Redux DevTools for debugging

**We will not:**
- Use Redux Saga or Redux Observable (too complex for our needs)
- Store all state in Redux (use local state for component-specific state)
- Use Redux for server state (consider RTK Query if needed)

## Consequences

### Positive

- **Predictable state:** Single store, unidirectional data flow
- **Debugging:** Redux DevTools provides action history, time-travel debugging
- **Scalability:** Proven for large applications
- **TypeScript integration:** Excellent type safety with typed hooks
- **Performance:** Built-in memoization (Reselect), optimized re-renders
- **Async handling:** Redux Thunk simplifies API calls and side effects
- **Testing:** Reducers are pure functions (easy to test)
- **Persistence:** Redux Persist for AsyncStorage integration
- **Team learning:** Redux skills are transferable to other projects

### Negative

- **Learning curve:** Redux concepts (actions, reducers, store) require learning
- **Boilerplate:** Still some boilerplate despite Redux Toolkit simplification
- **Overkill for simple state:** Local state often simpler for component-specific state

**Mitigations:**
- Document Redux patterns in `brain/04-development/standards/component-patterns.md`
- Provide code examples in `brain/08-examples/common-patterns/redux-examples.md`
- Use local state (`useState`) for component-specific state
- Keep slices small and focused

### Neutral

- **Bundle size:** Redux Toolkit adds ~20KB to bundle (acceptable)
- **Middleware:** Redux Thunk is sufficient; avoid adding more middleware

## Alternatives Considered

### Alternative 1: Zustand

**Pros:**
- **Simple API:** Minimal boilerplate, hooks-based
- **Small bundle size:** ~1KB (vs Redux Toolkit ~20KB)
- **No providers:** No need to wrap app in provider
- **TypeScript support:** Good type inference
- **Easy to learn:** Beginner-friendly

**Cons:**
- **Less tooling:** No DevTools equivalent (limited debugging)
- **Smaller ecosystem:** Fewer middleware options, less community resources
- **Less mature:** Newer library, less battle-tested
- **Less structure:** Easier to create inconsistent patterns across team

**Why rejected:**
Zustand is great for small apps, but Scrollio will scale to complex state (auth, feed, quiz, parental controls). Redux Toolkit provides better debugging, tooling, and structure for a growing team.

**Future consideration:** Zustand could be good for isolated features if Redux becomes too complex.

---

### Alternative 2: Recoil

**Pros:**
- **Atom-based:** Granular state updates (better performance)
- **React-centric:** Designed specifically for React
- **Easy to learn:** Similar to `useState` API
- **Concurrent mode ready:** Built for React 18+

**Cons:**
- **Facebook project:** Less community adoption, uncertain future
- **Less mature:** Newer than Redux, smaller ecosystem
- **Limited tooling:** No DevTools equivalent
- **Experimental:** Still has experimental features

**Why rejected:**
Recoil is interesting but less mature. Redux Toolkit is battle-tested and has stronger ecosystem. Recoil's advantages (atoms, concurrent mode) don't outweigh Redux's stability and tooling.

---

### Alternative 3: MobX

**Pros:**
- **Simple API:** Observable-based, less boilerplate
- **Automatic reactivity:** Components re-render automatically
- **Good performance:** Fine-grained reactivity

**Cons:**
- **Less predictable:** Mutable state, harder to debug
- **Less popular:** Smaller ecosystem than Redux
- **Magic:** Automatic reactivity can be confusing for new developers
- **Decorators:** Requires experimental TypeScript features

**Why rejected:**
MobX's mutable state model is less predictable than Redux. Team prefers Redux's explicit actions and immutable updates for better debugging and understanding.

---

### Alternative 4: Context API (React built-in)

**Pros:**
- **No library needed:** Built into React
- **Simple:** Easy to understand
- **Good for small state:** Perfect for theme, locale, auth

**Cons:**
- **Performance issues:** All consumers re-render on context change
- **Verbose:** Lots of boilerplate for multiple contexts
- **No DevTools:** Hard to debug complex state
- **Not designed for global state:** Best for small, infrequent updates

**Why rejected:**
Context API is great for theme or locale, but not suitable for frequently changing state (feed, quiz). Redux Toolkit is better for complex, global state.

**What we'll use Context API for:** Theme, localization (i18n)

---

### Alternative 5: No state management (React state + props)

**Pros:**
- **Simplest:** No library, no learning curve
- **React native:** Uses built-in `useState`, `useReducer`

**Cons:**
- **Prop drilling:** Passing state through many components
- **Hard to debug:** No centralized state inspection
- **Not scalable:** Becomes messy with complex state

**Why rejected:**
Scrollio has complex state (auth, feed, quiz, profile). Prop drilling would become unmanageable. Redux provides better structure and debugging.

## Implementation Notes

### Store Structure

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import quizReducer from './slices/quizSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    quiz: quizReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks

```typescript
// store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Slice Example

```typescript
// store/slices/feedSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Video } from '@/types/models';
import { fetchVideosAPI } from '@/services/supabase/database';

interface FeedState {
  videos: Video[];
  selectedTopic: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: FeedState = {
  videos: [],
  selectedTopic: null,
  loading: false,
  error: null,
};

// Async thunk
export const fetchVideos = createAsyncThunk(
  'feed/fetchVideos',
  async (topicId: string) => {
    const videos = await fetchVideosAPI(topicId);
    return videos;
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setSelectedTopic: (state, action: PayloadAction<string>) => {
      state.selectedTopic = action.payload;
    },
    clearVideos: (state) => {
      state.videos = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch videos';
      });
  },
});

export const { setSelectedTopic, clearVideos } = feedSlice.actions;
export default feedSlice.reducer;

// Selectors
export const selectVideos = (state: RootState) => state.feed.videos;
export const selectSelectedTopic = (state: RootState) => state.feed.selectedTopic;
export const selectFeedLoading = (state: RootState) => state.feed.loading;
```

### Usage in Components

```typescript
import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVideos, selectVideos, selectFeedLoading } from '@/store/slices/feedSlice';

export const FeedScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const videos = useAppSelector(selectVideos);
  const loading = useAppSelector(selectFeedLoading);

  useEffect(() => {
    dispatch(fetchVideos('topic-id'));
  }, [dispatch]);

  return (
    <View>
      <FlatList
        data={videos}
        renderItem={({ item }) => <VideoCard video={item} />}
        keyExtractor={(item) => item.id}
        refreshing={loading}
      />
    </View>
  );
};
```

### State Persistence (AsyncStorage)

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Only persist auth and user state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
```

### Testing

```typescript
// __tests__/feedSlice.test.ts
import feedReducer, { setSelectedTopic, clearVideos } from '../feedSlice';

describe('feedSlice', () => {
  it('should set selected topic', () => {
    const initialState = { selectedTopic: null, videos: [], loading: false, error: null };
    const action = setSelectedTopic('finance');
    const state = feedReducer(initialState, action);
    expect(state.selectedTopic).toBe('finance');
  });

  it('should clear videos', () => {
    const initialState = { selectedTopic: 'finance', videos: [{ id: '1' }], loading: false, error: null };
    const action = clearVideos();
    const state = feedReducer(initialState, action);
    expect(state.videos).toEqual([]);
  });
});
```

### Slices to Create

1. **authSlice:** User authentication, session, logout
2. **userSlice:** User profile, level, XP, preferences
3. **feedSlice:** Video feed, selected topic, playback state
4. **quizSlice:** Current quiz, answers, scores
5. **parentalControlsSlice:** Child profiles, limits, allowed topics

### Best Practices

- **Keep slices small:** One slice per feature
- **Use selectors:** Memoize expensive computations with Reselect
- **Async logic:** Use Redux Thunk for API calls
- **Error handling:** Always handle errors in async thunks
- **Loading states:** Track loading state for better UX
- **Normalize data:** Use normalizr for nested data (if needed)

### Future Enhancements

**RTK Query (Phase 2):**
If we need advanced data fetching/caching, consider RTK Query:
- Automatic caching and invalidation
- Optimistic updates
- Polling and refetching
- Built into Redux Toolkit

## Related Decisions

- [ADR-001: Database Choice](./001-database-choice.md) - Supabase for backend
- Frontend component patterns: See `brain/04-development/standards/component-patterns.md`

## References

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux Persist](https://github.com/rt2zz/redux-persist)
- [State Management in React Native](https://reactnative.dev/docs/intro-react)

## Review Schedule

**Next review:** Q3 2026 or when considering major state refactoring
**Review frequency:** Annually or when major state complexity increases

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-03 | Initial decision | Frontend Team |
