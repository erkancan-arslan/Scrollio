# Backend API Reference

**Base URL:** `http://localhost:3000` (development)
**API Version:** v1
**Last Updated:** 2024-12-22

---

## Overview

Scrollio backend API provides endpoints for user authentication, profile management, video feed, bookmarks, likes, views, and gamification features. Built with NestJS and Supabase.

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

### Authentication Levels

1. **None** - Public endpoint, no auth required
2. **Optional** - Works with or without auth (personalization if authenticated)
3. **Required** - Must be authenticated, returns 401 if not

---

## Table of Contents

- [Auth Endpoints](#auth-endpoints)
- [Profile Endpoints](#profile-endpoints)
- [Feed Endpoints](#feed-endpoints)
- [Video Actions](#video-actions)
- [Topics Endpoints](#topics-endpoints)

---

## Auth Endpoints

### Sign Up
```http
POST /auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

---

### Sign In
```http
POST /auth/signin
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

---

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

---

### Sign Out
```http
POST /auth/signout
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Signed out successfully"
}
```

---

## Profile Endpoints

### Get My Profile
```http
GET /profile/me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "displayName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Learning enthusiast",
  "level": 5,
  "xp": 1250,
  "totalVideosWatched": 42,
  "totalWatchTime": 3600,
  "streakDays": 7,
  "longestStreak": 14,
  "followerCount": 123,
  "followingCount": 45,
  "isVerified": false,
  "quizzesCompleted": 15,
  "averageQuizScore": 85.5,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-12-22T12:00:00Z"
}
```

---

### Update My Profile
```http
PUT /profile/me
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "John Updated",
  "bio": "New bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "displayName": "John Updated",
  "bio": "New bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  // ... rest of profile fields
}
```

---

### Get Profile by ID
```http
GET /profile/:userId
Authorization: Bearer <token> (optional)
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "displayName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Learning enthusiast",
  "level": 5,
  "followerCount": 123,
  "followingCount": 45,
  "isVerified": false,
  "isFollowing": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Note:** Public profile with limited fields. `isFollowing` only included if authenticated.

---

### Get Profile by Username
```http
GET /profile/username/:username
Authorization: Bearer <token> (optional)
```

**Response:** Same as Get Profile by ID

---

### Follow User
```http
POST /profile/:userId/follow
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully followed user",
  "followerCount": 124
}
```

---

### Unfollow User
```http
DELETE /profile/:userId/follow
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully unfollowed user",
  "followerCount": 123
}
```

---

### Get Followers
```http
GET /profile/:userId/followers?limit=20&offset=0
```

**Query Parameters:**
- `limit` (optional, default: 20) - Number of results
- `offset` (optional, default: 0) - Pagination offset

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "follower1",
      "displayName": "Follower One",
      "avatarUrl": "https://example.com/avatar1.jpg",
      "isVerified": false,
      "isFollowing": false
    }
  ],
  "total": 123
}
```

---

### Get Following
```http
GET /profile/:userId/following?limit=20&offset=0
```

**Response:** Same structure as Get Followers

---

### Add XP (Internal)
```http
POST /profile/me/xp
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50
}
```

**Response:** `200 OK`
```json
{
  "xp": 1300,
  "level": 5,
  "leveledUp": false,
  "xpForNextLevel": 1500
}
```

---

### Update Streak
```http
POST /profile/me/streak
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "streakDays": 8,
  "longestStreak": 14,
  "streakContinued": true,
  "xpAwarded": 10
}
```

---

## Feed Endpoints

### Get Personalized Feed
```http
GET /feed?limit=10&cursor=uuid&topicId=uuid&difficulty=beginner
Authorization: Bearer <token> (optional)
```

**Query Parameters:**
- `limit` (optional, default: 10) - Number of videos
- `cursor` (optional) - Cursor for pagination (video ID)
- `topicId` (optional) - Filter by topic
- `difficulty` (optional) - Filter by difficulty: `beginner` | `intermediate` | `advanced`

**Response:** `200 OK`
```json
{
  "videos": [
    {
      "id": "uuid",
      "title": "Introduction to React",
      "description": "Learn React basics in 60 seconds",
      "videoUrl": "https://cdn.example.com/video.mp4",
      "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
      "duration": 58,
      "creator": {
        "id": "uuid",
        "username": "instructor1",
        "displayName": "Jane Instructor",
        "avatarUrl": "https://example.com/avatar.jpg",
        "isVerified": true
      },
      "stats": {
        "views": 1234,
        "likes": 345,
        "comments": 12,
        "bookmarks": 89,
        "shares": 23
      },
      "topic": "Programming",
      "topicId": "uuid",
      "tags": ["react", "javascript", "frontend"],
      "difficulty": "beginner",
      "createdAt": "2024-12-01T00:00:00Z",
      "isLiked": false,
      "isBookmarked": false
    }
  ],
  "nextCursor": "next_video_uuid",
  "hasMore": true
}
```

---

### Get Bookmarked Feed
```http
GET /feed/bookmarks?limit=20&cursor=uuid
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional, default: 20) - Number of videos
- `cursor` (optional) - Cursor for pagination

**Response:** Same structure as Get Personalized Feed

---

### Get Topics
```http
GET /feed/topics
```

**Response:** `200 OK`
```json
{
  "topics": [
    {
      "id": "uuid",
      "name": "Programming",
      "slug": "programming",
      "description": "Learn to code",
      "iconUrl": "https://example.com/icon.png",
      "color": "#FF8C42",
      "videoCount": 1250
    }
  ]
}
```

---

### Get Single Video
```http
GET /feed/videos/:videoId
Authorization: Bearer <token> (optional)
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Introduction to React",
  "description": "Learn React basics in 60 seconds",
  "videoUrl": "https://cdn.example.com/video.mp4",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "duration": 58,
  "creator": { /* ... */ },
  "stats": { /* ... */ },
  "topic": "Programming",
  "topicId": "uuid",
  "tags": ["react", "javascript"],
  "difficulty": "beginner",
  "createdAt": "2024-12-01T00:00:00Z",
  "isLiked": false,
  "isBookmarked": false
}
```

---

## Video Actions

### Like Video
```http
POST /feed/videos/:videoId/like
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video liked successfully",
  "likeCount": 346
}
```

**Note:** Returns same response if already liked (idempotent)

---

### Unlike Video
```http
DELETE /feed/videos/:videoId/like
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video unliked successfully",
  "likeCount": 345
}
```

---

### Bookmark Video
```http
POST /feed/videos/:videoId/bookmark
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Video bookmarked successfully",
  "bookmarkCount": 90
}
```

---

### Unbookmark Video
```http
DELETE /feed/videos/:videoId/bookmark
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Bookmark removed successfully",
  "bookmarkCount": 89
}
```

---

### Record Video View
```http
POST /feed/videos/:videoId/view
Authorization: Bearer <token> (optional)
Content-Type: application/json
```

**Request Body:**
```json
{
  "watchDuration": 45,
  "completed": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "View recorded successfully"
}
```

**Note:** Can be called by anonymous users (userId will be null)

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Video not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Pagination

### Cursor-Based Pagination

Most list endpoints use cursor-based pagination:

1. First request: `GET /feed?limit=10`
2. Response includes `nextCursor` and `hasMore`
3. Next request: `GET /feed?limit=10&cursor=<nextCursor>`

**Benefits:**
- Consistent results even if data changes
- No skipped or duplicate items
- Efficient for large datasets

---

## Rate Limiting

**Status:** Not yet implemented

**Planned Limits:**
- 100 requests per minute per IP
- 1000 requests per hour per user
- Burst allowance: 20 requests

---

## Webhooks

**Status:** Not yet implemented

**Planned Events:**
- `user.created`
- `video.liked`
- `quiz.completed`
- `achievement.unlocked`

---

## Missing Endpoints (TODO)

### Likes Feed
```http
GET /feed/likes?limit=20&cursor=uuid
Authorization: Bearer <token>
```

**Purpose:** Get user's liked videos (similar to bookmarks)
**Status:** ⚠️ Backend implementation needed

---

### Watch History
```http
GET /feed/history?limit=20&cursor=uuid
Authorization: Bearer <token>
```

**Purpose:** Get user's watched videos
**Status:** ⚠️ Backend implementation needed

---

## SDK / Client Libraries

### TypeScript (Frontend)

```typescript
// Example using apiClient service
import { apiClient } from '@/services/api/apiClient';

// Get profile
const response = await apiClient.get<Profile>('/profile/me', true);

// Like video
const likeResponse = await apiClient.post<ActionResponse>(
  `/feed/videos/${videoId}/like`,
  undefined,
  true
);
```

### Service Layer

```typescript
// ProfileService
class ProfileService {
  async getMyProfile() {
    return apiClient.get<Profile>('/profile/me', true);
  }

  async updateProfile(data: UpdateProfileData) {
    return apiClient.put<Profile>('/profile/me', data, true);
  }
}

export const profileService = new ProfileService();
```

---

## Testing Endpoints

### Development Server
```bash
# Start backend
cd code/backend
npm run start:dev

# Base URL: http://localhost:3000
```

### Using cURL

```bash
# Sign in
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get profile
curl http://localhost:3000/profile/me \
  -H "Authorization: Bearer <token>"

# Like video
curl -X POST http://localhost:3000/feed/videos/<videoId>/like \
  -H "Authorization: Bearer <token>"
```

---

## API Versioning

**Current Version:** v1 (implicit, no version in URL)

**Future Versioning Strategy:**
- Will use URL versioning: `/api/v2/profile/me`
- v1 remains default until deprecated
- Minimum 6-month deprecation notice

---

## CORS Configuration

**Development:**
- Origin: `http://localhost:8081` (Expo dev server)
- Credentials: Allowed

**Production:**
- Origin: TBD (mobile app doesn't need CORS)
- Web clients: Whitelist specific domains

---

## Related Documentation

- Database Schema: `/brain/01-architecture/database-schema.md`
- Authentication: `/brain/06-security/authentication.md`
- Profile Feature: `/brain/02-features/profile/profile-feature.md`
- Feed Feature: `/brain/02-features/video-feed/`

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-12-22 | Initial API documentation | Claude |
| 2024-12-22 | Added profile and feed endpoints | Claude |
