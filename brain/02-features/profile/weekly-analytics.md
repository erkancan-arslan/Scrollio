# Weekly Analytics — Implementation Plan

**Spec reference:** §3.2 Req 20  
> The system shall display weekly analytics including videos watched, quiz accuracy, and topic distribution.

---

## What we're building

A "This Week" card on the Profile screen showing:
- Videos watched in the last 7 days
- Quiz accuracy % for the last 7 days
- Topic distribution (which topics the user watched, as a ranked list with percentages)
- Total watch time for the week

The card sits between **ProfileStats** (lifetime XP bar, totals) and **My Interests** on the existing Profile screen — no new screen needed.

---

## Data that's already in the database

| Table | Relevant columns | Used for |
|-------|-----------------|---------|
| `video_views` | `user_id`, `video_id`, `watch_duration`, `created_at` | Videos watched + watch time |
| `videos` | `id`, `topic`, `difficulty_level` | Topic per video |
| `core_quiz_attempts` | `user_id`, `is_correct`, `attempted_at` | Quiz accuracy |

All three tables exist and are already being written to by the current app. No schema changes are needed.

---

## Backend

### 1. New DTO — `WeeklyAnalyticsDto`

File: `code/backend/src/profile/dto/profile.dto.ts`

```ts
export class TopicBreakdownDto {
  topic: string;
  videosWatched: number;
  percentage: number; // share of total weekly videos, 0–100
}

export class WeeklyAnalyticsDto {
  weekStart: string;            // ISO date — Monday of the current week
  videosWatched: number;        // unique videos watched in last 7 days
  totalWatchTimeSeconds: number;
  quizAccuracy: number | null;  // null if no quiz attempts this week
  quizAttempts: number;
  topicDistribution: TopicBreakdownDto[]; // ordered by videos watched desc
}
```

### 2. New service method — `getWeeklyAnalytics`

File: `code/backend/src/profile/profile.service.ts`

```ts
async getWeeklyAnalytics(userId: string): Promise<WeeklyAnalyticsDto> {
  const supabase = this.supabaseService.getAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 6); // last 7 days (today + 6 days back)
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  // 1. Videos watched + watch time
  const { data: views } = await supabase
    .from('video_views')
    .select('video_id, watch_duration, videos(topic)')
    .eq('user_id', userId)
    .gte('created_at', sinceIso);

  // 2. Quiz attempts
  const { data: quizzes } = await supabase
    .from('core_quiz_attempts')
    .select('is_correct')
    .eq('user_id', userId)
    .gte('attempted_at', sinceIso);

  // Aggregate views
  const uniqueVideos = new Set((views ?? []).map(v => v.video_id));
  const totalWatchTime = (views ?? []).reduce((s, v) => s + (v.watch_duration ?? 0), 0);

  // Topic distribution
  const topicCounts: Record<string, number> = {};
  for (const v of views ?? []) {
    const topic = (v.videos as any)?.topic;
    if (topic) topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
  }
  const totalTopicViews = Object.values(topicCounts).reduce((s, n) => s + n, 0);
  const topicDistribution = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([topic, count]) => ({
      topic,
      videosWatched: count,
      percentage: totalTopicViews > 0 ? Math.round((count / totalTopicViews) * 100) : 0,
    }));

  // Quiz accuracy
  const attempts = quizzes ?? [];
  const correct = attempts.filter(q => q.is_correct).length;
  const quizAccuracy = attempts.length > 0
    ? Math.round((correct / attempts.length) * 100)
    : null;

  // Week start (Monday)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    videosWatched: uniqueVideos.size,
    totalWatchTimeSeconds: totalWatchTime,
    quizAccuracy,
    quizAttempts: attempts.length,
    topicDistribution,
  };
}
```

### 3. New controller endpoint

File: `code/backend/src/profile/profile.controller.ts`

```ts
@Get('me/weekly-analytics')
@UseGuards(AuthGuard)
async getWeeklyAnalytics(
  @Req() req: AuthenticatedRequest,
): Promise<WeeklyAnalyticsDto> {
  return this.profileService.getWeeklyAnalytics(req.user.id);
}
```

> **Important:** register this route **before** `@Get('me')` and **before** `@Get(':userId')` in the controller file so NestJS doesn't match `weekly-analytics` as a userId param.

---

## Mobile

### 4. New type

File: `code/mobile-app/src/features/profile/types/index.ts`

```ts
export interface TopicBreakdown {
  topic: string;
  videosWatched: number;
  percentage: number;
}

export interface WeeklyAnalytics {
  weekStart: string;
  videosWatched: number;
  totalWatchTimeSeconds: number;
  quizAccuracy: number | null;
  quizAttempts: number;
  topicDistribution: TopicBreakdown[];
}
```

### 5. New service method

File: `code/mobile-app/src/services/profile/profileService.ts`

```ts
async getWeeklyAnalytics(): Promise<ApiResponse<WeeklyAnalytics>> {
  return apiClient.get<WeeklyAnalytics>('/profile/me/weekly-analytics', true);
}
```

### 6. New Redux state + thunk

File: `code/mobile-app/src/features/profile/store/profileSlice.ts`

Add to `ProfileState`:
```ts
weeklyAnalytics: WeeklyAnalytics | null;
weeklyAnalyticsLoading: boolean;
weeklyAnalyticsError: string | null;
```

Add async thunk:
```ts
export const fetchWeeklyAnalytics = createAsyncThunk(
  'profile/fetchWeeklyAnalytics',
  async (_, { rejectWithValue }) => {
    const response = await profileService.getWeeklyAnalytics();
    if (response.data) return response.data;
    return rejectWithValue(response.error || 'Failed to fetch weekly analytics');
  },
);
```

Wire up `extraReducers` for pending/fulfilled/rejected.

### 7. New component — `WeeklyAnalyticsCard`

File: `code/mobile-app/src/features/profile/components/WeeklyAnalyticsCard.tsx`

Key UI sections:
- **Header row:** "This Week" label + week date range (e.g. "Apr 28 – May 4")
- **Stats row (3 pills):** Videos watched / Watch time / Quiz accuracy %
- **Topic distribution list:** each topic as a labelled bar showing its % share; show at most 5 topics, collapse the rest under "and N more"

Use the existing orange (`#FF8C42`) brand colour for bars and highlights. Match the card style of `ProfileStats` (white background, `borderRadius: 16`, shadow).

Export from `code/mobile-app/src/features/profile/components/index.ts`.

### 8. Wire into ProfileScreen

File: `code/mobile-app/src/features/profile/screens/ProfileScreen.tsx`

1. Dispatch `fetchWeeklyAnalytics()` inside `useFocusEffect` (alongside `fetchMyProfile`)
2. Read `weeklyAnalytics` and `weeklyAnalyticsLoading` from the Redux selector
3. Render `<WeeklyAnalyticsCard />` between `<ProfileStats />` and the interests card:

```tsx
{/* Weekly Analytics */}
{weeklyAnalytics && (
  <WeeklyAnalyticsCard analytics={weeklyAnalytics} />
)}
```

Show a skeleton/placeholder when `weeklyAnalyticsLoading && !weeklyAnalytics`.

---

## Implementation order

1. Backend DTO → service method → controller endpoint (and test with Swagger or curl)
2. Mobile types → profileService method → Redux slice additions
3. `WeeklyAnalyticsCard` component (static props first, wire Redux after)
4. Plug into ProfileScreen

---

## Edge cases to handle

| Case | Behaviour |
|------|-----------|
| No videos watched this week | Show `0 videos`, hide topic bars |
| No quiz attempts this week | Show "No quizzes yet" instead of a % |
| Only 1 topic watched | Single full-width bar at 100% |
| More than 5 topics | Show top 5, add "and N more" label |
| First day of week (Monday) | `weekStart` = today, range = "today only" |
