# Component: VideoGrid

**Location:** `code/mobile-app/src/features/profile/components/VideoGrid.tsx`
**Type:** Presentation Component
**Created:** 2024-12-22
**Last Updated:** 2024-12-22

---

## Purpose

Displays a collection of videos in a responsive 2-column grid layout. Used in the profile screen to show bookmarked, liked, or watched videos. Handles loading states, empty states, error states, and pagination.

---

## When to Use

- Displaying user's bookmarked videos in profile
- Showing liked videos collection
- Displaying watch history
- Any scenario requiring a grid display of video items with metadata

---

## When NOT to Use

- For single video display (use `VideoCard` instead)
- For horizontal scrolling video lists (use `FlatList` with horizontal prop)
- For full-screen video feed (use `FeedScreen` with vertical swipe)
- For search results in list format (use `VideoListItem`)

---

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `videos` | `Video[]` | Array of video objects to display in grid |
| `loading` | `boolean` | Whether videos are currently loading |
| `error` | `string \| null` | Error message to display, or null if no error |
| `onVideoPress` | `(video: Video) => void` | Callback when user taps a video card |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRefresh` | `() => void` | `undefined` | Callback for pull-to-refresh (not used in current implementation) |
| `onLoadMore` | `() => void` | `undefined` | Callback when user scrolls near bottom for pagination |
| `hasMore` | `boolean` | `false` | Whether more videos available for pagination |
| `emptyMessage` | `string` | `'No videos yet'` | Message to show when videos array is empty |
| `ListHeaderComponent` | `React.ReactElement \| null` | `undefined` | Optional header component to render above grid |

---

## Usage Example

```tsx
import { VideoGrid } from '@/features/profile/components';
import { Video } from '@/features/feed/types';

function BookmarksTab() {
  const { videos, loading, error, hasMore, cursor } = useSelector(
    (state: RootState) => state.profile
  );
  const dispatch = useDispatch();

  const handleVideoPress = (video: Video) => {
    navigation.navigate('VideoPlayer', { videoId: video.id });
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      dispatch(fetchBookmarkedVideos({ cursor, loadMore: true }));
    }
  };

  return (
    <VideoGrid
      videos={videos}
      loading={loading}
      error={error}
      onVideoPress={handleVideoPress}
      onLoadMore={handleLoadMore}
      hasMore={hasMore}
      emptyMessage="No bookmarked videos yet.\nBookmark videos to watch them later!"
    />
  );
}
```

---

## Component Structure

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Video } from '../../feed/types';

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onVideoPress: (video: Video) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement | null;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  loading,
  error,
  onVideoPress,
  onLoadMore,
  hasMore = false,
  emptyMessage = 'No videos yet',
  ListHeaderComponent,
}) => {
  // Helper functions
  const formatDuration = (seconds: number): string => { /* ... */ };
  const formatCount = (count: number): string => { /* ... */ };

  // Render functions
  const renderVideoCard = (item: Video) => { /* ... */ };
  const renderEmptyState = () => { /* ... */ };
  const renderFooter = () => { /* ... */ };

  // Main render
  if (videos.length === 0) {
    return <View style={styles.emptyContainer}>{renderEmptyState()}</View>;
  }

  return (
    <View style={styles.gridWrapper}>
      {ListHeaderComponent}
      <View style={styles.gridContainer}>
        {videos.map((item) => renderVideoCard(item))}
      </View>
      {renderFooter()}
    </View>
  );
};
```

---

## State Management

### Local State
None - fully controlled by parent component via props

### External Dependencies
- Video data passed via `videos` prop
- Loading state managed by parent (Redux or local state)
- Error state managed by parent

---

## Layout & Styling

### Grid Layout
- **Container:** `flexDirection: 'row'`, `flexWrap: 'wrap'`
- **Spacing:** `justifyContent: 'space-between'`, `padding: 8`
- **Bottom Padding:** `paddingBottom: 100` to ensure last items are visible
- **Card Width:** `48%` (each card takes ~half the screen width)

### Video Card Structure
```
┌─────────────────┐
│   Thumbnail     │  9:16 aspect ratio
│                 │
│   [Duration]    │  Duration badge (bottom-right)
├─────────────────┤
│ Title           │  Max 2 lines, ellipsis
│ 👁️ 1.2K ❤️ 345 │  Stats row
└─────────────────┘
```

### Responsive Behavior
- 2-column grid on all screen sizes
- Cards maintain aspect ratio regardless of screen width
- Scrollable vertically within parent ScrollView

---

## Helper Functions

### `formatDuration(seconds: number): string`
Formats video duration from seconds to MM:SS format.

**Examples:**
- `65` → `"1:05"`
- `130` → `"2:10"`
- `5` → `"0:05"`

### `formatCount(count: number): string`
Formats large numbers with K/M suffixes.

**Examples:**
- `1234` → `"1.2K"`
- `1234567` → `"1.2M"`
- `123` → `"123"`

---

## Render Methods

### `renderVideoCard(item: Video)`
Renders individual video card with:
- Thumbnail image or placeholder (📹 emoji)
- Duration badge (bottom-right overlay)
- Video title (2 lines max)
- View count with eye emoji
- Like count with heart emoji
- `onPress` handler for navigation

### `renderEmptyState()`
Conditionally renders one of:
1. **Loading:** ActivityIndicator when `loading && videos.length === 0`
2. **Error:** Warning emoji + error message when `error` exists
3. **Empty:** TV emoji + `emptyMessage` when no videos and no error

### `renderFooter()`
Shows pagination loading spinner when:
- `loading === true`
- `videos.length > 0` (not initial load)

Returns null otherwise.

---

## Empty States

### Loading State
```
      [Spinner]
```

### Error State
```
        ⚠️
   Error message here
```

### Empty State
```
        📺
   No bookmarked videos yet.
   Bookmark videos to watch them later!
```

All empty states are centered using:
```css
justifyContent: 'center'
alignItems: 'center'
minHeight: 300
```

---

## Styling Details

### Color Palette
- **Background:** `#FFFFFF` (card)
- **Text Primary:** `#1A1A1A` (title)
- **Text Secondary:** `#666666` (stats)
- **Error:** `#FF3B30`
- **Primary Accent:** `#FF8C42` (loading spinner)
- **Placeholder BG:** `#E8E8E8`

### Shadow (Card Elevation)
```typescript
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.05
shadowRadius: 4
elevation: 2  // Android
```

### Border Radius
- Cards: `12px`
- Duration badge: `4px`

---

## Accessibility

Currently implements basic accessibility:
- `TouchableOpacity` provides tap feedback
- `activeOpacity={0.8}` for visual feedback

**TODO - Future Improvements:**
```tsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Play ${item.title}`}
  accessibilityHint={`Video duration ${formatDuration(item.duration)}, ${formatCount(item.stats.views)} views`}
>
```

---

## Performance Considerations

### Current Optimizations
1. **Simple mapping:** Uses `videos.map()` instead of FlatList (parent handles scrolling)
2. **Conditional rendering:** Only renders footer when loading
3. **Image caching:** React Native's Image component handles caching
4. **Memoization potential:** Could wrap in `React.memo` for props comparison

### Known Performance Issues
- No virtualization (renders all videos at once)
- Could be slow with 100+ videos
- Consider FlatList with `numColumns={2}` for large lists

### Optimization Suggestions
```typescript
export const VideoGrid = React.memo<VideoGridProps>(
  ({ videos, ...props }) => {
    // Component implementation
  },
  (prev, next) => {
    return (
      prev.videos.length === next.videos.length &&
      prev.loading === next.loading &&
      prev.error === next.error
    );
  }
);
```

---

## Integration Notes

### Used In
- `ProfileScreen` - Displays bookmarked/liked/watched videos
- Potentially reusable in topic pages, playlists, creator profiles

### Parent Requirements
Parent component must:
1. Manage video data state (Redux or local)
2. Handle loading and error states
3. Implement pagination logic (cursor management)
4. Provide navigation callback for video press
5. Wrap in ScrollView (VideoGrid does not scroll itself)

### ScrollView Integration
```tsx
<ScrollView
  style={styles.scrollContainer}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  bounces={true}
  scrollEventThrottle={16}
>
  <ProfileHeader />
  <ProfileStats />
  <ProfileTabs />
  <VideoGrid {...props} />  {/* Grid lives inside ScrollView */}
</ScrollView>
```

---

## Known Issues

### Fixed
- [x] Empty state not centered (2024-12-22) - Added flex centering styles

### Current
- [ ] No virtualization for long lists
- [ ] Video thumbnails often null (database issue)
- [ ] No skeleton loading animation
- [ ] No retry mechanism for failed thumbnail loads
- [ ] Missing accessibility labels

---

## Future Enhancements

### Short Term
- [ ] Add shimmer/skeleton loader instead of spinner
- [ ] Implement proper accessibility labels
- [ ] Handle thumbnail load failures gracefully
- [ ] Add video duration validation (handle 0 or negative)

### Long Term
- [ ] Support different grid columns (1, 2, 3)
- [ ] Support list view mode (toggle)
- [ ] Add context menu (long-press actions)
- [ ] Implement item animations (enter/exit)
- [ ] Support drag-to-reorder for playlists
- [ ] Add progressive image loading with blur-up

---

## Testing

### Unit Tests
**Status:** Not yet implemented

**Test Cases Needed:**
```typescript
describe('VideoGrid', () => {
  it('renders empty state when videos array is empty');
  it('renders loading state when loading is true');
  it('renders error state when error is present');
  it('renders video cards for each video');
  it('formats duration correctly');
  it('formats view counts with K/M suffixes');
  it('calls onVideoPress when card is tapped');
  it('renders footer loader when loading more');
  it('renders ListHeaderComponent if provided');
});
```

### Integration Tests
```typescript
describe('VideoGrid Integration', () => {
  it('loads more videos when scrolled to bottom');
  it('shows correct empty message based on tab');
  it('navigates to video player on card press');
});
```

---

## Dependencies

### Internal
- `../../feed/types` - Video, VideoCreator, VideoStats interfaces
- Theme colors (hardcoded for now)

### External
- `react-native` - Core components (View, Text, Image, etc.)
- No external UI libraries

---

## Related Components

- `ProfileTabs` - Switches between different video collections
- `ProfileScreen` - Parent container that uses VideoGrid
- Future: `VideoListItem` - Alternative list view for videos
- Future: `VideoCard` - Standalone card for single video display

---

## Design References

**Style Guide:**
- 2-column grid layout
- 9:16 aspect ratio for thumbnails
- Orange accent color (`#FF8C42`)
- Warm background (`#F7F3ED` from parent)

**Figma:** Not available

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2024-12-22 | Claude | Initial creation with grid layout |
| 2024-12-22 | Claude | Fixed empty state centering |
| 2024-12-22 | Claude | Added documentation |

---

## References

- Video Types: `/brain/02-features/video-feed/`
- Profile Feature: `/brain/02-features/profile/profile-feature.md`
- Component Patterns: `/brain/04-development/standards/component-patterns.md`
