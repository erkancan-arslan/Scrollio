# Frontend Component Patterns - React Native

**Last Updated:** December 2025
**Status:** Active

This document defines when and how to create React Native components in the Scrollio project.

---

## Component Classification

### 1. Presentation Components (Dumb Components)

**What:** Components that only display data, no business logic

**When to create:**
- UI elements used across the app (buttons, cards, inputs)
- Components that receive all data via props
- Purely visual components with no state management

**Location:** `src/components/common/` or `src/components/{domain}/`

**Example:**
```typescript
// src/components/common/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
```

---

### 2. Container Components (Smart Components)

**What:** Components that manage state and business logic

**When to create:**
- Feature-specific screens
- Components that fetch data
- Components that manage complex state
- Components that connect to Redux

**Location:** `src/features/{feature}/screens/` or `src/features/{feature}/components/`

**Example:**
```typescript
// src/features/feed/screens/FeedScreen.tsx
import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchVideos, selectVideos, selectFeedLoading } from '@/store/slices/feedSlice';
import { VideoCard } from '../components/VideoCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const FeedScreen: React.FC = () => {
  const dispatch = useDispatch();
  const videos = useSelector(selectVideos);
  const loading = useSelector(selectFeedLoading);

  useEffect(() => {
    dispatch(fetchVideos());
  }, [dispatch]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={({ item }) => <VideoCard video={item} />}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### 3. Custom Hooks

**What:** Reusable logic extracted into a hook

**When to create:**
- Logic used across multiple components
- Complex state management logic
- Side effects that can be abstracted
- API calls that are reused

**Location:** `src/hooks/` (shared) or `src/features/{feature}/hooks/` (feature-specific)

**Example:**
```typescript
// src/hooks/useVideoPlayer.ts
import { useState, useEffect, useRef } from 'react';
import { Video } from 'expo-av';

interface UseVideoPlayerReturn {
  isPlaying: boolean;
  progress: number;
  duration: number;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (position: number) => Promise<void>;
}

export const useVideoPlayer = (videoRef: React.RefObject<Video>): UseVideoPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const subscription = video.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);
        setProgress(status.positionMillis / status.durationMillis);
        setDuration(status.durationMillis);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [videoRef]);

  const play = async () => {
    await videoRef.current?.playAsync();
  };

  const pause = async () => {
    await videoRef.current?.pauseAsync();
  };

  const seek = async (position: number) => {
    await videoRef.current?.setPositionAsync(position);
  };

  return {
    isPlaying,
    progress,
    duration,
    play,
    pause,
    seek,
  };
};
```

---

## When to Create a New Component

### Create a New Component When:

1. **Reusability** - Used in 2+ places
   ```typescript
   // Good: Extract into Button component
   <Button title="Submit" onPress={handleSubmit} />
   <Button title="Cancel" onPress={handleCancel} variant="secondary" />
   ```

2. **Complexity** - Component has >100 lines
   ```typescript
   // Before: 200-line VideoPlayer component
   // After: Split into VideoPlayer + VideoControls + VideoProgressBar
   ```

3. **Single Responsibility** - Component does too much
   ```typescript
   // Bad: ProfileScreen handles profile + settings + stats
   // Good: ProfileScreen + ProfileSettings + ProfileStats
   ```

4. **Testability** - Easier to test in isolation
   ```typescript
   // Easier to test QuizCard separately from QuizList
   ```

5. **Performance** - Can be memoized to prevent re-renders
   ```typescript
   export const VideoCard = React.memo<VideoCardProps>(({ video }) => {
     // Expensive rendering logic
   });
   ```

---

### DON'T Create a New Component When:

1. **One-time use** - Only used once and simple
2. **Premature abstraction** - Not sure if it will be reused
3. **Over-engineering** - 10 lines of JSX doesn't need extraction

**Rule of Thumb:** Wait until you need to reuse it 2-3 times, then extract.

---

## When to Create a Custom Hook

### Create a Hook When:

1. **Reusable State Logic**
   ```typescript
   // Used in multiple components
   const { user, loading } = useAuth();
   ```

2. **Complex Side Effects**
   ```typescript
   // Encapsulate complex video player logic
   const { play, pause, seek } = useVideoPlayer(videoRef);
   ```

3. **API Calls**
   ```typescript
   // Reusable data fetching
   const { data, loading, error } = useFetchVideos(topicId);
   ```

4. **Form State Management**
   ```typescript
   // Complex form handling
   const { values, errors, handleChange, handleSubmit } = useForm(initialValues);
   ```

### DON'T Create a Hook When:

1. **Single useState** - Just use useState directly
2. **No reusability** - Only used in one component
3. **No logic** - Just returns props (use component composition instead)

---

## Component Structure Template

### Standard Component

```typescript
// 1. Imports
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/theme';
import { Video } from '@/types/models';

// 2. Type Definitions
interface VideoCardProps {
  video: Video;
  onPress?: () => void;
}

// 3. Component
export const VideoCard: React.FC<VideoCardProps> = ({ video, onPress }) => {
  // 4. Hooks (state, navigation, custom hooks)
  const [isLiked, setIsLiked] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  // 5. Event Handlers
  const handleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
    // API call to like video
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('VideoDetail', { videoId: video.id });
    }
  }, [onPress, navigation, video.id]);

  // 6. Render
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.duration}>{video.duration}s</Text>
      </View>
      <Button title={isLiked ? 'Unlike' : 'Like'} onPress={handleLike} />
    </TouchableOpacity>
  );
};

// 7. Styles
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  content: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  duration: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
```

---

## State Management Decisions

### Use `useState` When:
- Component-local UI state (modal open/closed, input value)
- Simple boolean flags
- Single value that doesn't need to be shared

```typescript
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
```

### Use `useReducer` When:
- Complex state with multiple sub-values
- State transitions have complex logic
- Next state depends on previous state

```typescript
const [state, dispatch] = useReducer(quizReducer, initialState);
```

### Use Redux When:
- State shared across multiple screens
- Global app state (auth, user profile)
- State needs to persist across navigation
- State needs middleware (async thunks, logging)

```typescript
const user = useSelector(selectUser);
const dispatch = useDispatch();
```

### Lift State Up When:
- Two sibling components need same state
- Parent needs to coordinate children
- State becomes shared

```typescript
// Before: Each child has own state
// After: Parent holds state, passes down as props
```

---

## Performance Optimization

### Use `React.memo` When:
- Component re-renders frequently
- Component renders with same props often
- Rendering is expensive (complex calculations, large lists)

```typescript
export const VideoCard = React.memo<VideoCardProps>(({ video, onPress }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison (optional)
  return prevProps.video.id === nextProps.video.id;
});
```

### Use `useMemo` When:
- Expensive calculations
- Derived data from props/state
- Creating objects/arrays used as dependencies

```typescript
const filteredVideos = useMemo(() => {
  return videos.filter(video => video.ageGroup === userAgeGroup);
}, [videos, userAgeGroup]);
```

### Use `useCallback` When:
- Passing callbacks to memoized children
- Callback is a dependency in other hooks
- Preventing unnecessary re-renders

```typescript
const handlePress = useCallback((videoId: string) => {
  navigation.navigate('VideoDetail', { videoId });
}, [navigation]);
```

---

## File Organization

### Component Files

```
src/components/
├── common/                  # Shared components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── LoadingSpinner.tsx
├── video/                   # Video-related components
│   ├── VideoPlayer.tsx
│   ├── VideoCard.tsx
│   └── VideoControls.tsx
└── quiz/                    # Quiz-related components
    ├── QuizCard.tsx
    ├── QuizOption.tsx
    └── QuizResult.tsx
```

### Feature Files

```
src/features/feed/
├── components/              # Feature-specific components
│   ├── FeedHeader.tsx
│   ├── VideoFeedItem.tsx
│   └── FeedFilters.tsx
├── hooks/                   # Feature-specific hooks
│   ├── useFeedData.ts
│   └── useVideoTracking.ts
├── screens/                 # Screens
│   ├── FeedScreen.tsx
│   └── VideoDetailScreen.tsx
├── types.ts                 # Feature types
└── index.ts                 # Exports
```

---

## Component Documentation

### When to Document:

1. **Complex Components** - VideoPlayer, QuizSystem
2. **Reusable Components** - All in `components/common/`
3. **Public API Components** - Exported from features

### Documentation Template:

```typescript
/**
 * VideoCard Component
 *
 * Displays a video preview card with title, thumbnail, and duration.
 * Handles navigation to video detail screen on press.
 *
 * @example
 * ```tsx
 * <VideoCard
 *   video={videoData}
 *   onPress={() => console.log('Pressed')}
 * />
 * ```
 *
 * @see Documentation: brain/05-components/video-card.md
 */
export const VideoCard: React.FC<VideoCardProps> = ({ video, onPress }) => {
  // Implementation
};
```

---

## Common Patterns

### List Rendering

```typescript
<FlatList
  data={videos}
  renderItem={({ item }) => <VideoCard video={item} />}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews
  maxToRenderPerBatch={5}
/>
```

### Conditional Rendering

```typescript
{loading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{data && <DataView data={data} />}
```

### Modal Pattern

```typescript
const [isModalVisible, setIsModalVisible] = useState(false);

<Modal visible={isModalVisible} onClose={() => setIsModalVisible(false)}>
  <ModalContent />
</Modal>
```

---

## Testing Components

### Component Test

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { VideoCard } from './VideoCard';

describe('VideoCard', () => {
  const mockVideo = {
    id: '1',
    title: 'Test Video',
    duration: 30,
  };

  it('renders video title', () => {
    const { getByText } = render(<VideoCard video={mockVideo} />);
    expect(getByText('Test Video')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<VideoCard video={mockVideo} onPress={onPress} />);
    
    fireEvent.press(getByText('Test Video'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

---

## Decision Flowchart

```
Need to display something?
    ↓
Is it used in 2+ places? → NO → Keep inline JSX
    ↓ YES
Does it have business logic? → YES → Create Container Component
    ↓ NO
Create Presentation Component
    ↓
Can logic be extracted? → YES → Create Custom Hook
    ↓ NO
Done
```

---

**See Also:**
- Backend patterns: `/brain/04-development/standards/backend-patterns.md`
- Coding standards: `/brain/.cursorrules`
- Component examples: `/brain/08-examples/component-examples/`
