# Troubleshooting Guide

Common issues and their solutions when developing Scrollio.

---

## Development Environment Issues

### 1. Expo Not Starting

**Symptoms:**
- `npx expo start` hangs or crashes
- QR code doesn't appear
- Metro bundler doesn't start

**Solutions:**
```bash
# Clear Metro bundler cache
npx expo start -c

# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear watchman cache (macOS)
watchman watch-del-all

# Reset Expo cache
rm -rf .expo

# Restart with fresh install
npm run clean && npm install && npx expo start
```

### 2. TypeScript Errors After Update

**Symptoms:**
- Red squiggles everywhere after pulling latest code
- `Cannot find module '@/...'` errors
- Type mismatches that shouldn't exist

**Solutions:**
```bash
# Restart TypeScript server in VS Code
# CMD + Shift + P → "TypeScript: Restart TS Server"

# Verify tsconfig paths are correct
cat tsconfig.json | grep paths

# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install
```

### 3. Supabase Connection Issues

**Symptoms:**
- `fetch failed` errors
- Authentication not working
- Database queries timeout

**Solutions:**
```typescript
// 1. Verify environment variables
console.log('URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));

// 2. Check Supabase project status
// Visit: https://supabase.com/dashboard/project/_/settings/general

// 3. Test connection manually
import { supabase } from '@/services/supabase';

async function testConnection() {
  const { data, error } = await supabase
    .from('videos')
    .select('count')
    .limit(1);
    
  console.log('Connection test:', { data, error });
}
```

```bash
# 4. Restart local Supabase (if using local dev)
npx supabase stop
npx supabase start
```

---

## iOS-Specific Issues

### 1. Build Fails on iOS

**Symptoms:**
- `error: Building for iOS, but the linked and embedded framework...`
- Pod install failures
- Xcode build errors

**Solutions:**
```bash
# Navigate to iOS folder
cd ios

# Clean and reinstall pods
rm -rf Pods Podfile.lock
pod install --repo-update

# If that fails, try
pod deintegrate
pod install

# Clean Xcode build folder
cd ..
npx expo run:ios --clean
```

### 2. iOS Simulator Issues

**Symptoms:**
- App not appearing in simulator
- Simulator stuck on splash screen
- "Could not connect to development server"

**Solutions:**
```bash
# Reset simulator
xcrun simctl erase all

# Rebuild and run
npx expo run:ios --clean

# If Metro bundler not connecting
# Check that simulator and Mac are on same network
# Or use localhost explicitly
npx expo start --localhost
```

---

## Android-Specific Issues

### 1. Gradle Build Failures

**Symptoms:**
- `FAILURE: Build failed with an exception`
- `Could not resolve all dependencies`
- Gradle daemon issues

**Solutions:**
```bash
# Clean Gradle cache
cd android
./gradlew clean

# Stop Gradle daemon
./gradlew --stop

# Clear Gradle cache completely
rm -rf ~/.gradle/caches
rm -rf .gradle

# Rebuild
cd ..
npx expo run:android --clean
```

### 2. Android Emulator Issues

**Symptoms:**
- Emulator won't start
- App crashes immediately on Android
- "Unable to load script" error

**Solutions:**
```bash
# Check emulator is running
adb devices

# Restart adb
adb kill-server
adb start-server

# Reverse port for Metro
adb reverse tcp:8081 tcp:8081

# Clear app data
adb shell pm clear com.scrollio.app

# Reinstall app
npx expo run:android --clean
```

---

## Backend (NestJS) Issues

### 1. NestJS Server Won't Start

**Symptoms:**
- `Error: Cannot find module '@nestjs/...'`
- Port already in use
- TypeScript compilation errors

**Solutions:**
```bash
# Navigate to backend
cd code/backend

# Clear dist and reinstall
rm -rf dist node_modules package-lock.json
npm install

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Start in watch mode
npm run start:dev
```

### 2. Supabase Service Connection (Backend)

**Symptoms:**
- Backend can't connect to Supabase
- "Invalid API key" errors
- RLS policy violations

**Solutions:**
```typescript
// 1. Verify you're using SERVICE_ROLE_KEY (not ANON_KEY)
// backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # SERVICE role, not ANON

// 2. Test connection
import { SupabaseService } from './supabase/supabase.service';

async function testBackendConnection() {
  const { data, error } = await this.supabaseService.client
    .from('videos')
    .select('*')
    .limit(1);
    
  console.log('Backend connection:', { data, error });
}
```

---

## Database Issues

### 1. RLS Policy Violations

**Symptoms:**
- `new row violates row-level security policy`
- Queries return empty even though data exists
- "permission denied" errors

**Solutions:**
```sql
-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. View existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- 3. Test as specific user
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid"}';
SELECT * FROM your_table;
RESET role;

-- 4. Temporarily disable RLS for debugging (BE CAREFUL)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
-- Test your query
-- Then re-enable immediately
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

**See:** `/brain/06-security/rls-policies.md` for correct RLS patterns

### 2. Migration Failures

**Symptoms:**
- `Migration failed: relation already exists`
- `column "..." does not exist`
- Migration runs but data is wrong

**Solutions:**
```bash
# Check migration status
npx supabase migration list

# Rollback last migration (local)
npx supabase db reset

# Apply migrations manually
npx supabase db push

# Check migration history in Supabase dashboard
# Settings → Database → Migrations
```

---

## Redux State Issues

### 1. State Not Updating

**Symptoms:**
- Component doesn't re-render when state changes
- `useSelector` returns stale data
- Actions dispatch but state unchanged

**Solutions:**
```typescript
// 1. Verify reducer is returning new state (not mutating)
// ❌ WRONG
state.videos.push(newVideo); // Mutates state

// ✅ CORRECT
state.videos = [...state.videos, newVideo]; // New array

// 2. Check if reducer is registered in store
// store/index.ts
import videosReducer from './slices/videosSlice';

export const store = configureStore({
  reducer: {
    videos: videosReducer, // Make sure it's here
  }
});

// 3. Use Redux DevTools to inspect
// Flip to Debug Remote JS in Expo
// Open http://localhost:19000/debugger-ui
// Install Redux DevTools extension
```

### 2. Async Thunk Not Working

**Symptoms:**
- Thunk dispatches but doesn't execute
- Loading state never changes
- Error not caught

**Solutions:**
```typescript
// 1. Ensure you're using unwrap() for error handling
try {
  await dispatch(fetchVideos()).unwrap();
} catch (error) {
  console.error('Failed:', error);
}

// 2. Check thunk is returning a value
export const fetchVideos = createAsyncThunk(
  'videos/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.from('videos').select('*');
      if (error) throw error;
      return data; // ✅ Must return
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 3. Verify extraReducers are set up
extraReducers: (builder) => {
  builder
    .addCase(fetchVideos.pending, (state) => {
      state.loading = true;
    })
    .addCase(fetchVideos.fulfilled, (state, action) => {
      state.loading = false;
      state.videos = action.payload; // ✅ Handle success
    })
    .addCase(fetchVideos.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload; // ✅ Handle error
    });
}
```

---

## Video Playback Issues

### 1. Videos Won't Play

**Symptoms:**
- Black screen when playing video
- "Could not load video" error
- Video loads but doesn't start

**Solutions:**
```typescript
// 1. Verify video URL is accessible
async function testVideoUrl(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log('Video accessible:', response.ok);
    console.log('Content-Type:', response.headers.get('content-type'));
  } catch (error) {
    console.error('Video not accessible:', error);
  }
}

// 2. Check AWS S3 CORS settings
// S3 bucket → Permissions → CORS configuration
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]

// 3. Verify CloudFront is serving correct headers
// CloudFront → Behaviors → Cache Policy
// Ensure Content-Type header is forwarded

// 4. Test with expo-av Video component
import { Video } from 'expo-av';

<Video
  source={{ uri: videoUrl }}
  onError={(error) => console.error('Video error:', error)}
  onLoad={() => console.log('Video loaded')}
  shouldPlay
  useNativeControls
/>
```

### 2. Video Performance Issues

**Symptoms:**
- Stuttering playback
- Long load times
- High memory usage

**Solutions:**
```typescript
// 1. Use HLS streaming instead of direct MP4
// Convert videos to HLS during upload

// 2. Implement video preloading
const videoRef = useRef<Video>(null);

useEffect(() => {
  videoRef.current?.loadAsync({ uri: nextVideoUrl });
}, [nextVideoUrl]);

// 3. Clean up video when unmounting
useEffect(() => {
  return () => {
    videoRef.current?.unloadAsync();
  };
}, []);

// 4. Use smaller resolution for mobile
// Generate 720p and 480p variants
// Serve based on device capabilities
```

---

## API/Network Issues

### 1. Request Timeout

**Symptoms:**
- Requests hang indefinitely
- "Network request failed" errors
- Intermittent connection issues

**Solutions:**
```typescript
// 1. Add timeout to fetch requests
async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 2. Configure Supabase client timeout
export const supabase = createClient(url, key, {
  global: {
    headers: {
      'x-request-timeout': '10000'
    }
  }
});

// 3. Implement retry logic
async function fetchWithRetry(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

---

## Common Error Messages

### "Invariant Violation: requireNativeComponent..."
**Cause:** Native module not linked properly  
**Solution:**
```bash
# Rebuild native code
npx expo run:ios --clean
# or
npx expo run:android --clean
```

### "Unable to resolve module @/..."
**Cause:** TypeScript path alias not recognized  
**Solution:**
```json
// Verify in tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// Verify in babel.config.js
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './src'
        }
      }
    ]
  ]
};
```

### "Element type is invalid..."
**Cause:** Incorrect import/export  
**Solution:**
```typescript
// ❌ WRONG
import VideoCard from '@/components/video/VideoCard';

// ✅ CORRECT (named export)
import { VideoCard } from '@/components/video/VideoCard';

// OR if default export
export default function VideoCard() { ... }
import VideoCard from '@/components/video/VideoCard';
```

---

## Getting Help

### Before Asking for Help

1. **Check the logs:**
   ```bash
   # Mobile app logs
   npx expo start
   # Press 'j' to open debugger
   
   # Backend logs
   cd code/backend
   npm run start:dev
   ```

2. **Search existing issues:**
   - Check GitHub Issues
   - Search Expo forums
   - Check Supabase Discord

3. **Create a minimal reproduction:**
   - Isolate the problem
   - Remove unrelated code
   - Share code snippet

### Information to Include

- **Environment:**
  ```bash
  npx expo-env-info
  node --version
  npm --version
  ```

- **Error message:** Full error text and stack trace
- **Steps to reproduce:** What you did before the error
- **Expected vs actual:** What should happen vs what happens
- **Code snippet:** Minimal code that reproduces the issue

---

## References

- Expo troubleshooting: https://docs.expo.dev/troubleshooting/
- Supabase troubleshooting: https://supabase.com/docs/guides/platform/troubleshooting
- React Native debugging: https://reactnative.dev/docs/debugging
- NestJS FAQ: https://docs.nestjs.com/faq
