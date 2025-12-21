# Profile Feature

**Feature:** User Profile
**Status:** ✅ Implemented (Bookmarks), ⚠️ Partial (Likes/Watched - Backend Only)
**Created:** 2024-12-22
**Last Updated:** 2024-12-22

---

## Overview

The Profile feature allows users to view their learning progress, statistics, and collections of videos (bookmarked, liked, and watched). It includes gamification elements (XP, levels, streaks) and displays personalized learning metrics.

---

## Features Implemented

### ✅ Core Profile Display
- User avatar, username, display name, bio
- Level badge with XP progress bar
- Verification badge for verified users
- Follower/following counts
- Sign out functionality

### ✅ Gamification Statistics
- **XP System:** Current XP and progress to next level
- **Level:** Current user level with visual badge
- **Streak System:** Daily streak counter and longest streak
- **Learning Metrics:**
  - Total videos watched
  - Total watch time (formatted as hours/minutes)
  - Quizzes completed
  - Average quiz score

### ✅ Bookmarks Tab
- Grid display of bookmarked videos (2-column layout)
- Video cards with thumbnail, title, duration, views, and likes
- Pull-to-refresh functionality
- Pagination with cursor-based "load more"
- Empty state with message when no bookmarks exist

### ⚠️ Likes Tab (Partial)
- **Frontend:** Tab UI ready, shows empty state
- **Backend:** Like/unlike endpoints exist (`POST/DELETE /feed/videos/:videoId/like`)
- **Missing:** No endpoint to fetch list of liked videos (`GET /feed/likes`)

### ⚠️ Watched Tab (Partial)
- **Frontend:** Tab UI ready, shows empty state
- **Backend:** View recording exists (`POST /feed/videos/:videoId/view`)
- **Missing:** No endpoint to fetch watch history (`GET /feed/history` or `/feed/watched`)

---

## Architecture

### Frontend Structure

```
code/mobile-app/src/features/profile/
├── screens/
│   └── ProfileScreen.tsx          # Main profile screen container
├── components/
│   ├── ProfileHeader.tsx          # Avatar, name, level badge
│   ├── ProfileStats.tsx           # XP, streak, learning metrics
│   ├── ProfileTabs.tsx            # Bookmarks/Likes/Watched tabs
│   └── VideoGrid.tsx              # 2-column video grid display
├── store/
│   └── profileSlice.ts            # Redux state management
├── types/
│   └── index.ts                   # TypeScript interfaces
└── index.ts                       # Exports
```

### Backend Structure

```
code/backend/src/
├── profile/
│   ├── profile.controller.ts      # Profile endpoints
│   ├── profile.service.ts         # Profile business logic
│   └── dto/                       # Data transfer objects
└── feed/
    ├── feed.controller.ts         # Feed endpoints (includes bookmarks)
    └── feed.service.ts            # Feed business logic
```

---

## API Endpoints

### Profile Endpoints (Implemented ✅)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/profile/me` | Get current user's profile | Required |
| PUT | `/profile/me` | Update current user's profile | Required |
| GET | `/profile/:userId` | Get user's public profile | Optional |
| GET | `/profile/username/:username` | Get profile by username | Optional |
| POST | `/profile/:userId/follow` | Follow a user | Required |
| DELETE | `/profile/:userId/follow` | Unfollow a user | Required |
| GET | `/profile/:userId/followers` | Get user's followers | None |
| GET | `/profile/:userId/following` | Get following list | None |
| POST | `/profile/me/xp` | Add XP to user (internal) | Required |
| POST | `/profile/me/streak` | Update daily streak | Required |

### Feed Endpoints (Implemented ✅)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/feed` | Get personalized feed | Optional |
| GET | `/feed/bookmarks` | Get bookmarked videos | Required |
| GET | `/feed/topics` | Get all topics | None |
| GET | `/feed/videos/:videoId` | Get single video | Optional |
| POST | `/feed/videos/:videoId/like` | Like a video | Required |
| DELETE | `/feed/videos/:videoId/like` | Unlike a video | Required |
| POST | `/feed/videos/:videoId/bookmark` | Bookmark a video | Required |
| DELETE | `/feed/videos/:videoId/bookmark` | Remove bookmark | Required |
| POST | `/feed/videos/:videoId/view` | Record video view | Optional |

### Missing Endpoints (TODO ⚠️)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/feed/likes` | Get user's liked videos | Required |
| GET | `/feed/history` | Get watch history | Required |

---

## Data Models

### Profile Interface

```typescript
interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;

  // Gamification
  level: number;
  xp: number;
  totalVideosWatched: number;
  totalWatchTime: number;         // in seconds
  streakDays: number;
  longestStreak: number;

  // Social
  followerCount: number;
  followingCount: number;
  isVerified: boolean;

  // Learning metrics
  quizzesCompleted: number;
  averageQuizScore: number;

  createdAt: string;
  updatedAt: string;
}
```

### Video Interface (Shared with Feed)

```typescript
interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;              // in seconds
  creator: VideoCreator;
  stats: VideoStats;
  topic: string;
  topicId: string | null;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
}
```

---

## Redux State Management

### State Structure

```typescript
interface ProfileState {
  // Profile data
  profile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;

  // UI state
  activeTab: ProfileTab;          // 'bookmarks' | 'likes' | 'watched'

  // Bookmarks
  bookmarkedVideos: Video[];
  bookmarksLoading: boolean;
  bookmarksError: string | null;
  bookmarksCursor: string | null;
  hasMoreBookmarks: boolean;

  // Likes (not yet implemented)
  likedVideos: Video[];
  likesLoading: boolean;
  likesError: string | null;
  likesCursor: string | null;
  hasMoreLikes: boolean;

  // Watched (not yet implemented)
  watchedVideos: Video[];
  watchedLoading: boolean;
  watchedError: string | null;
  watchedCursor: string | null;
  hasMoreWatched: boolean;
}
```

### Async Thunks

```typescript
// Implemented ✅
fetchMyProfile()                  // Load user's profile
fetchBookmarkedVideos()          // Load bookmarked videos with pagination
updateProfile()                   // Update profile data
followUser()                      // Follow another user
unfollowUser()                    // Unfollow user

// TODO ⚠️
fetchLikedVideos()               // Load liked videos (needs backend endpoint)
fetchWatchedVideos()             // Load watch history (needs backend endpoint)
```

---

## Component Details

### ProfileScreen
**Location:** `code/mobile-app/src/features/profile/screens/ProfileScreen.tsx`

**Responsibilities:**
- Container component for entire profile view
- Manages Redux state connections
- Handles navigation and user actions
- Implements pull-to-refresh
- Sign out functionality

**Layout:**
- Fixed header with sign-out button
- ScrollView containing all profile content
- Responsive to safe area insets

### ProfileHeader
**Location:** `code/mobile-app/src/features/profile/components/ProfileHeader.tsx`

**Props:**
```typescript
interface ProfileHeaderProps {
  profile: Profile;
}
```

**Features:**
- Avatar image with fallback to first letter
- Display name and username
- Verification badge
- Level badge (orange, e.g., "Level 5")
- Follower/following counts
- Bio text

### ProfileStats
**Location:** `code/mobile-app/src/features/profile/components/ProfileStats.tsx`

**Props:**
```typescript
interface ProfileStatsProps {
  profile: Profile;
}
```

**Features:**
- XP progress bar with current/next level calculation
- Daily streak with fire emoji
- Grid of 4 stat cards:
  1. Videos watched
  2. Watch time (formatted hours/mins)
  3. Quizzes completed
  4. Average score

### ProfileTabs
**Location:** `code/mobile-app/src/features/profile/components/ProfileTabs.tsx`

**Props:**
```typescript
interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  bookmarkCount: number;
  likeCount: number;
  watchedCount: number;
}
```

**Features:**
- Three tabs: Bookmarks, Likes, Watched
- Active tab highlighted with orange border
- Count badges on each tab
- Smooth tab switching

### VideoGrid
**Location:** `code/mobile-app/src/features/profile/components/VideoGrid.tsx`

**Props:**
```typescript
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
```

**Features:**
- 2-column grid layout (48% width each)
- Video cards with:
  - Thumbnail (9:16 aspect ratio) or placeholder
  - Duration badge
  - Title (2 lines max)
  - View and like counts
- Empty state with centered icon and message
- Loading spinner for pagination
- Error state with retry option

---

## Database Tables

### profiles
```sql
id                   uuid PRIMARY KEY
username             text UNIQUE
display_name         text
avatar_url           text
bio                  text
level                integer DEFAULT 1
xp                   integer DEFAULT 0
total_videos_watched integer DEFAULT 0
total_watch_time     integer DEFAULT 0
streak_days          integer DEFAULT 0
longest_streak       integer DEFAULT 0
follower_count       integer DEFAULT 0
following_count      integer DEFAULT 0
is_verified          boolean DEFAULT false
quizzes_completed    integer DEFAULT 0
average_quiz_score   numeric DEFAULT 0
created_at           timestamptz
updated_at           timestamptz
```

### video_bookmarks
```sql
id         uuid PRIMARY KEY
user_id    uuid REFERENCES profiles(id)
video_id   uuid REFERENCES videos(id)
created_at timestamptz

UNIQUE(user_id, video_id)
```

### video_likes
```sql
id         uuid PRIMARY KEY
user_id    uuid REFERENCES profiles(id)
video_id   uuid REFERENCES videos(id)
created_at timestamptz

UNIQUE(user_id, video_id)
```

### video_views
```sql
id                uuid PRIMARY KEY
user_id           uuid REFERENCES profiles(id)
video_id          uuid REFERENCES videos(id)
watch_duration    integer
completed         boolean
created_at        timestamptz
```

---

## Services

### ProfileService (Frontend)
**Location:** `code/mobile-app/src/services/profile/profileService.ts`

**Methods:**
```typescript
getMyProfile()                           // GET /profile/me
getProfileByUsername(username)           // GET /profile/username/:username
getProfile(userId)                       // GET /profile/:userId
updateProfile(data)                      // PUT /profile/me
followUser(userId)                       // POST /profile/:userId/follow
unfollowUser(userId)                     // DELETE /profile/:userId/follow
getFollowers(userId, limit, offset)      // GET /profile/:userId/followers
getFollowing(userId, limit, offset)      // GET /profile/:userId/following
getBookmarkedFeed(params)                // GET /feed/bookmarks (via FeedService)
```

### ProfileService (Backend)
**Location:** `code/backend/src/profile/profile.service.ts`

**Methods:**
```typescript
getMyProfile(userId)
getProfile(currentUserId, profileId)
getProfileByUsername(currentUserId, username)
updateProfile(userId, updateData)
followUser(userId, targetUserId)
unfollowUser(userId, targetUserId)
getFollowers(profileId, limit, offset)
getFollowing(profileId, limit, offset)
addXp(userId, amount)
updateStreak(userId)
```

### FeedService (Backend)
**Location:** `code/backend/src/feed/feed.service.ts`

**Relevant Methods:**
```typescript
getBookmarkedFeed(userId, query)         // ✅ Implemented
likeVideo(userId, videoId)               // ✅ Implemented
unlikeVideo(userId, videoId)             // ✅ Implemented
bookmarkVideo(userId, videoId)           // ✅ Implemented
unbookmarkVideo(userId, videoId)         // ✅ Implemented
recordView(userId, videoId, viewData)    // ✅ Implemented

// TODO: Need to implement ⚠️
getLikedFeed(userId, query)              // ❌ Missing
getWatchedFeed(userId, query)            // ❌ Missing
```

---

## User Flows

### View Profile
1. User taps "Profile" in bottom navigation
2. `ProfileScreen` dispatches `fetchMyProfile()`
3. Backend fetches profile from `profiles` table
4. Profile data displayed with stats, XP, streak
5. `ProfileScreen` dispatches `fetchBookmarkedVideos()`
6. Bookmarks tab shows user's bookmarked videos

### Switch Tabs
1. User taps "Likes" or "Watched" tab
2. `ProfileTabs` calls `onTabChange(tab)`
3. Redux updates `activeTab` state
4. `ProfileScreen` conditionally loads data for new tab
5. `VideoGrid` displays appropriate videos or empty state

### View Bookmarked Video
1. User taps video card in grid
2. `VideoGrid` calls `onVideoPress(video)`
3. TODO: Navigate to video player (not yet implemented)

### Refresh Profile
1. User pulls down on screen
2. `ScrollView` triggers `RefreshControl`
3. Dispatches `fetchMyProfile()` and current tab data
4. UI shows loading spinner
5. Fresh data displayed when complete

### Load More Videos
1. User scrolls to bottom of grid
2. `VideoGrid` detects scroll position
3. Calls `onLoadMore()` if `hasMore` is true
4. Dispatches `fetchBookmarkedVideos({ cursor, loadMore: true })`
5. New videos appended to existing list

---

## Known Issues

### ✅ Fixed Issues
1. ~~Invalid API key error~~ - Fixed corrupted `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. ~~Profile not found (PGRST116)~~ - Resolved by creating new user (trigger works)
3. ~~TypeScript duplicate style definitions~~ - Fixed duplicate `emptyContainer` in VideoGrid
4. ~~Empty state not centered~~ - Added `justifyContent: 'center'` and `alignItems: 'center'` to `emptyContainer` style

### ⚠️ Current Issues
1. **Likes tab shows empty state** - Backend endpoint missing (`GET /feed/likes`)
2. **Watched tab shows empty state** - Backend endpoint missing (`GET /feed/history`)
3. **Video thumbnails missing** - Videos in database have `null` thumbnailUrl (shows placeholder)
4. **Video press does nothing** - Navigation to video player not implemented (TODO)

---

## Future Enhancements

### Short Term (Next Sprint)
- [ ] Implement `getLikedFeed()` backend endpoint
- [ ] Implement `getWatchedFeed()` backend endpoint
- [ ] Connect frontend to new endpoints
- [ ] Navigate to video player on grid item press
- [ ] Add profile editing UI
- [ ] Implement follow/unfollow UI

### Long Term
- [ ] Profile customization (themes, badges display)
- [ ] Achievement showcase on profile
- [ ] Activity timeline (recent videos, quizzes)
- [ ] Social features (view other users' profiles)
- [ ] Share profile functionality
- [ ] Profile analytics (learning patterns)

---

## Testing

### Manual Testing Checklist
- [x] Profile loads with correct user data
- [x] Avatar displays or shows fallback
- [x] XP progress bar calculates correctly
- [x] Streak displays current count
- [x] Stats show accurate numbers
- [x] Bookmarks tab loads videos
- [x] Empty state shows when no bookmarks
- [x] Pull-to-refresh works
- [x] Pagination loads more videos
- [x] Tab switching works
- [x] Sign out prompts confirmation
- [x] Sign out navigates to login
- [ ] Likes tab shows videos (blocked by backend)
- [ ] Watched tab shows history (blocked by backend)

### Unit Tests
**Status:** Not yet implemented

**TODO:**
- ProfileScreen component tests
- ProfileHeader rendering tests
- ProfileStats calculations tests
- VideoGrid layout tests
- Redux slice action tests
- Service method tests

---

## Performance Considerations

### Optimizations Implemented
- Cursor-based pagination for efficient data loading
- Pull-to-refresh uses existing loading states
- Video grid uses `React.memo` equivalent (functional component)
- Images cached by React Native's Image component
- Redux state normalized (videos stored by ID)

### Future Optimizations
- Implement video thumbnail caching strategy
- Add skeleton loaders for better perceived performance
- Lazy load profile stats
- Implement virtual scrolling for very long video lists

---

## Security & Privacy

### Authentication
- All profile endpoints require JWT authentication (via `AuthGuard`)
- User can only view/edit their own profile data
- Public profiles available at `/profile/:userId` (limited data)

### Row Level Security (RLS)
- Supabase RLS policies enforce data access
- Users can only bookmark/like videos for themselves
- Profile data respects privacy settings (future)

### Data Privacy
- Avatar URLs stored, not uploaded files directly
- No sensitive data exposed in public profile endpoint
- User activity (views, likes) stored with user_id for personalization

---

## Dependencies

### Frontend
- `@reduxjs/toolkit` - State management
- `react-redux` - Redux bindings
- `react-native-safe-area-context` - Safe area handling
- `@react-navigation/native` - Navigation
- `@expo/vector-icons` - Icon library

### Backend
- `@nestjs/common` - NestJS framework
- `@supabase/supabase-js` - Supabase client
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

---

## Related Documentation

- Database Schema: `/brain/01-architecture/database-schema.md`
- Authentication: `/brain/06-security/authentication.md`
- Component Patterns: `/brain/04-development/standards/component-patterns.md`
- API Patterns: `/brain/08-examples/api-usage/common-api-patterns.md`
- Feed Feature: `/brain/02-features/video-feed/` (related to bookmarks/likes/views)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-12-22 | Initial implementation - Profile screen with bookmarks tab | Claude |
| 2024-12-22 | Fixed empty state centering in VideoGrid | Claude |
| 2024-12-22 | Documented feature completion and known issues | Claude |
