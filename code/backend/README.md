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
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-supabase-jwt-secret

# CORS
CORS_ORIGINS=http://localhost:19006,http://localhost:8081
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
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── supabase/            # Supabase integration
│   │   ├── supabase.service.ts
│   │   └── supabase.module.ts
│   ├── health/              # Health check endpoint
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry
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

## Future Modules

- `videos/` - Video content management
- `quizzes/` - Quiz system
- `users/` - User profiles and progress
- `gamification/` - XP, levels, achievements

