# Scrollio - Quick Start Guide

**Goal:** Get Scrollio running locally in under 30 minutes

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js:** v18+ ([Download](https://nodejs.org/))
- **npm:** v10+ (comes with Node.js)
- **Git:** ([Download](https://git-scm.com/))
- **Expo CLI:** `npm install -g expo-cli`
- **Supabase CLI:** ([Installation Guide](https://supabase.com/docs/guides/cli))
- **Docker Desktop:** Required for Supabase local development ([Download](https://www.docker.com/products/docker-desktop))

### Optional but Recommended

- **VS Code:** ([Download](https://code.visualstudio.com/))
- **Expo Go app:** On your phone for testing ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **iOS Simulator:** (Mac only, via Xcode)
- **Android Studio:** For Android emulator

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd scrollio-v1

# Verify directory structure
ls -la
# You should see: brain/, code/, .cursorrules, etc.
```

---

## Step 2: Set Up Supabase Locally

### Start Supabase

```bash
# Navigate to code directory
cd code

# Initialize Supabase (if not already initialized)
supabase init

# Start Supabase locally (requires Docker)
supabase start

# This will output:
# - API URL: http://localhost:54321
# - Anon key: your-anon-key
# - Service role key: your-service-role-key
# - Studio URL: http://localhost:54323
```

**Save these credentials!** You'll need them for the mobile app.

### Apply Database Migrations

```bash
# If migrations exist in code/supabase/migrations/
supabase db push

# Or reset database to latest schema
supabase db reset
```

### Seed the Database (Optional)

```bash
# If seed data exists
supabase db seed
```

### Open Supabase Studio

Open http://localhost:54323 in your browser to view:
- Database tables
- Authentication users
- Storage buckets
- SQL Editor

---

## Step 3: Set Up AWS S3 (For Video Storage)

### Create S3 Bucket

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to S3
3. Create a new bucket:
   - Name: `scrollio-videos-dev`
   - Region: `us-east-1` (or closest to you)
   - Block all public access: **Yes** (we'll use CloudFront)
4. Enable CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Create IAM User for Programmatic Access

1. Navigate to IAM → Users → Add User
2. User name: `scrollio-s3-uploader`
3. Permissions: Attach policy `AmazonS3FullAccess` (or custom policy for specific bucket)
4. Save Access Key ID and Secret Access Key

### (Optional) Set Up CloudFront

1. Navigate to CloudFront
2. Create Distribution
3. Origin: Your S3 bucket
4. Save CloudFront domain name (e.g., `d1234.cloudfront.net`)

**For MVP:** You can skip CloudFront and use S3 directly. Add CloudFront later for better performance.

---

## Step 4: Set Up Mobile App

### Navigate to Mobile App Directory

```bash
cd code/mobile-app
```

### Install Dependencies

```bash
# Install npm packages
npm install

# This will install:
# - React Native, Expo
# - Redux Toolkit
# - Supabase JS client
# - AWS SDK
# - And all other dependencies
```

### Configure Environment Variables

Create `.env` file in `code/mobile-app/`:

```bash
# Copy example
cp .env.example .env

# Edit .env
nano .env
```

**`.env` contents:**

```bash
# Supabase (from Step 2)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-from-step-2

# AWS S3 (from Step 3)
AWS_S3_BUCKET=scrollio-videos-dev
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_CLOUDFRONT_DOMAIN=d1234.cloudfront.net # Optional, if using CloudFront

# App Config
APP_ENV=development
API_BASE_URL=http://localhost:54321
```

### Start the App

```bash
# Start Expo development server
npm start

# Or start with specific platform
npm run ios      # iOS simulator (Mac only)
npm run android  # Android emulator
npm run web      # Web browser
```

### Open on Device/Simulator

**Option 1: Expo Go (Easiest)**
1. Open Expo Go app on your phone
2. Scan QR code from terminal
3. App will load on your device

**Option 2: iOS Simulator (Mac only)**
1. Press `i` in terminal (or run `npm run ios`)
2. iOS simulator will open with app

**Option 3: Android Emulator**
1. Start Android Studio emulator first
2. Press `a` in terminal (or run `npm run android`)

---

## Step 5: Verify Everything Works

### Test Authentication

1. Open the app
2. Navigate to Sign Up screen
3. Create a test account:
   - Email: `test@example.com`
   - Password: `password123`
4. Check Supabase Studio (http://localhost:54323) → Authentication → Users
5. You should see your new user!

### Test Database

1. Open Supabase Studio → Table Editor
2. Navigate to `profiles` table
3. You should see a profile for your test user

### Test Video Upload (If implemented)

1. Try uploading a test video
2. Check S3 bucket for uploaded file
3. Check `videos` table in Supabase

---

## Step 6: Run Tests (Optional)

```bash
# Navigate to mobile app
cd code/mobile-app

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue: Supabase won't start

**Solution:**
- Ensure Docker Desktop is running
- Run `supabase stop` then `supabase start`
- Check Docker has enough resources (Settings → Resources)

### Issue: Expo won't start

**Solution:**
- Clear Expo cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Update Expo CLI: `npm install -g expo-cli@latest`

### Issue: Can't connect to Supabase from app

**Solution:**
- Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Ensure Supabase is running: `supabase status`
- Restart Expo: `npm start`

### Issue: AWS S3 upload fails

**Solution:**
- Verify AWS credentials in `.env`
- Check S3 bucket CORS configuration
- Ensure IAM user has `s3:PutObject` permission

### Issue: TypeScript errors

**Solution:**
- Run TypeScript check: `npm run type-check`
- Generate Supabase types: `supabase gen types typescript --local > src/types/database.types.ts`

---

## Development Workflow

### Daily Development

1. **Start Supabase:**
   ```bash
   cd code
   supabase start
   ```

2. **Start Mobile App:**
   ```bash
   cd code/mobile-app
   npm start
   ```

3. **Open Supabase Studio:**
   http://localhost:54323

4. **Make changes, test, commit!**

### Creating New Features

1. **Read feature documentation:**
   `brain/02-features/[feature-name]/`

2. **Check ADRs for architectural context:**
   `brain/01-architecture/decisions/`

3. **Follow coding standards:**
   `.cursorrules`

4. **Update documentation after implementation:**
   Update relevant files in `brain/`

---

## Next Steps

Now that you're set up, here's what to do next:

1. **Read the documentation:**
   - [brain/CLAUDE.md](brain/CLAUDE.md) - Primary AI context
   - [brain/00-core/PROJECT_OVERVIEW.md](brain/00-core/PROJECT_OVERVIEW.md) - Product vision
   - [brain/01-architecture/system-architecture.md](brain/01-architecture/system-architecture.md) - System design

2. **Explore the codebase:**
   - Check `code/mobile-app/src/` for app structure
   - Review `code/supabase/migrations/` for database schema

3. **Start building!**
   - Pick a feature from the roadmap
   - Read feature docs in `brain/02-features/`
   - Follow coding standards in `.cursorrules`
   - Update docs when done

---

## Useful Commands

```bash
# Supabase
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
supabase status             # Check Supabase status
supabase db push            # Apply migrations
supabase db reset           # Reset database
supabase gen types typescript --local > src/types/database.types.ts  # Generate types

# Mobile App
npm start                   # Start Expo
npm run ios                 # iOS simulator
npm run android             # Android emulator
npm test                    # Run tests
npm run lint                # Run ESLint
npm run type-check          # TypeScript check

# Git
git status                  # Check status
git add .                   # Stage changes
git commit -m "message"     # Commit
git push                    # Push to remote
```

---

## Getting Help

- **Documentation:** Check `brain/` directory
- **Troubleshooting:** `brain/04-development/troubleshooting.md`
- **API Docs:** `brain/03-api/`
- **Code Examples:** `brain/08-examples/`

---

**You're all set! Happy coding! 🚀**
