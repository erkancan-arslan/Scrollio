# Scrollio Backend

NestJS backend API for the Scrollio mobile app.

## Tech Stack

- **Framework:** NestJS with TypeScript
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL via Supabase
- **Documentation:** Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- npm 10+
- Supabase project (local or cloud)

## Setup

### 1. Install Dependencies

```bash
cd code/backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-supabase-jwt-secret

# CORS
CORS_ORIGINS=http://localhost:19006,http://localhost:8081

# BunnyCDN Configuration
# Get these from: https://dash.bunny.net/
BUNNY_CDN_URL=https://your-pullzone.b-cdn.net
BUNNY_STORAGE_API_KEY=your-storage-api-key  # Optional: for admin upload features
BUNNY_STORAGE_ZONE=your-storage-zone-name   # Optional: for admin upload features
```

### 3. Start the Server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 4. Access API

- **API Base URL:** http://localhost:3000/api/v1
- **Swagger Docs:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/v1/health

## Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── auth.controller.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── feed/                 # Video feed module
│   │   ├── dto/             # DTOs (FeedQuery, FeedResponse, VideoAction)
│   │   ├── feed.controller.ts
│   │   ├── feed.service.ts
│   │   └── feed.module.ts
│   ├── profile/              # User profile module
│   │   ├── dto/             # DTOs (Profile, UpdateProfile, Follow)
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts
│   │   └── profile.module.ts
│   ├── supabase/            # Supabase integration
│   │   ├── supabase.service.ts
│   │   └── supabase.module.ts
│   ├── health/              # Health check endpoint
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry
├── sql/                      # Database migration SQL files
│   ├── 001_feed_schema.sql  # Feed tables, triggers, RLS, seed data
│   └── 002_profiles_schema.sql # Profiles, follows, gamification
├── test/                    # Tests
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/signin` | Sign in existing user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/signout` | Sign out user |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/password-reset` | Request password reset |

### Feed

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/feed` | Get video feed | Optional |
| GET | `/api/v1/feed/bookmarks` | Get user's bookmarked videos | Required |
| GET | `/api/v1/feed/topics` | Get all active topics | No |
| GET | `/api/v1/feed/videos/:videoId` | Get single video | Optional |
| POST | `/api/v1/feed/videos/:videoId/like` | Like a video | Required |
| DELETE | `/api/v1/feed/videos/:videoId/like` | Unlike a video | Required |
| POST | `/api/v1/feed/videos/:videoId/bookmark` | Bookmark a video | Required |
| DELETE | `/api/v1/feed/videos/:videoId/bookmark` | Remove bookmark | Required |
| POST | `/api/v1/feed/videos/:videoId/view` | Record video view | Optional |

### Profile

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/profile/me` | Get current user's profile | Required |
| PUT | `/api/v1/profile/me` | Update current user's profile | Required |
| GET | `/api/v1/profile/username/:username` | Get profile by username | Optional |
| GET | `/api/v1/profile/:userId` | Get user's public profile | Optional |
| POST | `/api/v1/profile/:userId/follow` | Follow a user | Required |
| DELETE | `/api/v1/profile/:userId/follow` | Unfollow a user | Required |
| GET | `/api/v1/profile/:userId/followers` | Get user's followers | No |
| GET | `/api/v1/profile/:userId/following` | Get who user follows | No |
| POST | `/api/v1/profile/me/xp` | Add XP to user | Required |
| POST | `/api/v1/profile/me/streak` | Update daily streak | Required |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## Security

- Auth tokens stored in iOS Keychain / Android Keystore (mobile app)
- Supabase Row Level Security (RLS) enabled on all tables
- JWT validation on protected routes
- CORS configured for allowed origins

## Architecture Notes

This backend serves as an API layer between the mobile app and Supabase. 

**Why a backend layer?**
- Business logic encapsulation
- Future extensibility (adding more services)
- Custom validation and error handling
- Rate limiting and monitoring
- Simplified mobile app code

**Authentication Flow:**
1. Mobile app sends credentials to NestJS backend
2. Backend validates and forwards to Supabase Auth
3. Supabase returns JWT tokens
4. Backend returns tokens to mobile app
5. Mobile app stores tokens in Keychain (secure storage)
6. Subsequent requests include Bearer token in header

## Database Setup

Run the SQL migrations in Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Run `sql/001_feed_schema.sql` - Creates feed tables
3. Run `sql/002_profiles_schema.sql` - Creates profile tables

### Feed Tables (`001_feed_schema.sql`):
- `topics` - Educational content categories
- `creators` - Video content creators (AI and human)
- `videos` - Video content with BunnyCDN URLs
- `video_likes` - User like tracking
- `video_bookmarks` - User bookmark tracking
- `video_views` - View analytics
- `user_topic_interests` - Personalization data

### Profile Tables (`002_profiles_schema.sql`):
- `profiles` - User profiles (auto-created on signup)
- `user_follows` - Following relationships
- Functions for XP, levels, and streak management
- Auto-trigger to create profile on user signup

## BunnyCDN Setup

1. Create a BunnyCDN account at https://bunny.net
2. Create a Storage Zone for your video files
3. Create a Pull Zone connected to your Storage Zone
4. Upload videos to your Storage Zone
5. Use Pull Zone URLs in the `video_url` column

## Future Modules

- `quizzes/` - Quiz system
- `users/` - User profiles and progress
- `gamification/` - XP, levels, achievements
- `comments/` - Video comments

