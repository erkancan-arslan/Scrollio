# Component Documentation Template

Use this template when documenting new components in `/brain/05-components/`.

---

## Component Name: `ComponentName`

**Location:** `src/components/category/ComponentName.tsx`  
**Type:** [Presentation | Container | Hybrid]  
**Created:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD

---

## Purpose

Brief description of what this component does and why it exists.

**Example:**
> Displays a video card in the feed with thumbnail, title, metadata, and quiz indicator. Handles tap to play and analytics tracking.

---

## When to Use

Specific scenarios where this component should be used.

**Example:**
- Use in main video feed to display each video item
- Use in search results to show matching videos
- Use in profile screen to show user's uploaded videos

---

## When NOT to Use

Scenarios where this component is inappropriate.

**Example:**
- Don't use for video playback (use `VideoPlayer` instead)
- Don't use for quiz cards (use `QuizCard` instead)
- Don't use for video thumbnails in lists (use `VideoThumbnail` instead)

---

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `video` | `Video` | Video object containing id, title, thumbnailUrl, etc. |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPress` | `(videoId: string) => void` | `undefined` | Callback when video is tapped |
| `showQuizBadge` | `boolean` | `true` | Whether to show quiz availability indicator |
| `style` | `ViewStyle` | `{}` | Additional styles to apply |

---

## Usage Example

```tsx
import { VideoCard } from '@/components/video/VideoCard';

function FeedScreen() {
  const { data: videos } = useVideos();

  function handleVideoPress(videoId: string) {
    navigation.navigate('VideoPlayer', { videoId });
  }

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => (
        <VideoCard
          video={item}
          onPress={handleVideoPress}
          showQuizBadge={true}
        />
      )}
    />
  );
}
```

---

## Component Structure

```tsx
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Video } from '@/types/video.types';

interface VideoCardProps {
  video: Video;
  onPress?: (videoId: string) => void;
  showQuizBadge?: boolean;
  style?: ViewStyle;
}

export function VideoCard({
  video,
  onPress,
  showQuizBadge = true,
  style
}: VideoCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(video.id)}
    >
      {/* Component implementation */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // Styles
  }
});
```

---

## State Management

**Local State:**
- `isLoading`: Whether thumbnail is loading
- `hasError`: Whether thumbnail failed to load

**Redux State (if applicable):**
- Uses `selectVideoById` to get video data from store
- Dispatches `trackVideoImpression` for analytics

**External Data:**
- None (receives data via props)

---

## Dependencies

### Internal Dependencies
- `@/types/video.types` - Video type definitions
- `@/components/common/Badge` - Quiz badge component
- `@/theme` - Theme colors and spacing

### External Dependencies
- `react-native` - Core RN components
- None (if no external libraries)

---

## Performance Considerations

- Uses `React.memo` to prevent unnecessary re-renders
- Thumbnail images are cached by FastImage
- Optimized for FlatList rendering (avoid inline functions)

---

## Accessibility

```tsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Play video: ${video.title}`}
  accessibilityHint="Double tap to watch video"
>
```

---

## Testing

### Unit Tests
**Location:** `__tests__/components/video/VideoCard.test.tsx`

```tsx
describe('VideoCard', () => {
  it('should render video title and thumbnail', () => {
    const { getByText, getByTestId } = render(
      <VideoCard video={mockVideo} />
    );
    
    expect(getByText(mockVideo.title)).toBeTruthy();
    expect(getByTestId('video-thumbnail')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <VideoCard video={mockVideo} onPress={onPress} />
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(mockVideo.id);
  });
});
```

---

## Variants / Related Components

- `VideoCard` (this component) - Full video card with metadata
- `VideoThumbnail` - Thumbnail only (used in grids)
- `VideoListItem` - Compact list version with horizontal layout
- `VideoPlayer` - Full-screen video playback

---

## Design Notes

- Matches Figma design: [Link to Figma]
- Uses 16:9 aspect ratio for thumbnails
- Quiz badge appears in top-right corner
- Skeleton loader shows while thumbnail loads

---

## Known Issues / TODOs

- [ ] Add shimmer loading animation
- [ ] Support landscape orientation
- [ ] Add share button
- [x] Implement analytics tracking (completed 2024-12-01)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2024-12-05 | @developer | Initial creation |
| 2024-12-01 | @developer | Added analytics tracking |

---

## References

- Component patterns: `/brain/04-development/standards/component-patterns.md`
- Video types: `/brain/01-architecture/database-schema.md`
- Theme system: `/brain/05-components/theming.md` (if exists)
