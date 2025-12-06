# Common API Usage Patterns

**Last Updated:** December 2025
**Status:** Active

This document provides code examples for common API operations in the Scrollio project.

---

## Supabase Authentication

### Sign Up

```typescript
import { supabase } from '@/services/supabase/client';

export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Create user profile after signup
  if (data.user) {
    await createUserProfile(data.user.id, displayName);
  }

  return data;
};

const createUserProfile = async (userId: string, displayName: string) => {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    display_name: displayName,
    level: 1,
    xp: 0,
  });

  if (error) {
    throw new Error('Failed to create profile');
  }
};
```

### Sign In

```typescript
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error('Invalid credentials');
  }

  return data;
};
```

### Sign Out

```typescript
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error('Failed to sign out');
  }
};
```

### Get Current Session

```typescript
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error('Failed to get session');
  }
  
  return session;
};
```

### Refresh Token

```typescript
export const refreshSession = async (refreshToken: string) => {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  
  if (error) {
    throw new Error('Failed to refresh session');
  }
  
  return data;
};
```

---

## Supabase Database Queries

### Fetch All Records

```typescript
export const fetchVideos = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return data;
};
```

### Fetch with Joins

```typescript
export const fetchVideosWithTopics = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      topics (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return data;
};
```

### Fetch by ID

```typescript
export const fetchVideoById = async (videoId: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*, topics(*)')
    .eq('id', videoId)
    .single();

  if (error) {
    throw new Error('Video not found');
  }

  return data;
};
```

### Filter and Pagination

```typescript
export const fetchVideosByTopic = async (
  topicId: string,
  limit: number = 20,
  offset: number = 0
) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  return data;
};
```

### Insert Record

```typescript
export const createVideo = async (videoData: {
  title: string;
  url: string;
  topic_id: string;
  duration: number;
}) => {
  const { data, error } = await supabase
    .from('videos')
    .insert(videoData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create video: ${error.message}`);
  }

  return data;
};
```

### Update Record

```typescript
export const updateVideo = async (videoId: string, updates: Partial<Video>) => {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update video: ${error.message}`);
  }

  return data;
};
```

### Delete Record

```typescript
export const deleteVideo = async (videoId: string) => {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (error) {
    throw new Error(`Failed to delete video: ${error.message}`);
  }
};
```

### Count Records

```typescript
export const getVideosCount = async (topicId?: string) => {
  let query = supabase
    .from('videos')
    .select('*', { count: 'exact', head: true });

  if (topicId) {
    query = query.eq('topic_id', topicId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count videos: ${error.message}`);
  }

  return count;
};
```

---

## Supabase Realtime

### Subscribe to Changes

```typescript
import { useEffect } from 'react';
import { supabase } from '@/services/supabase/client';

export const useRealtimeVideos = (callback: (payload: any) => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
        },
        (payload) => {
          console.log('Change received!', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callback]);
};
```

### Usage Example

```typescript
const FeedScreen = () => {
  const [videos, setVideos] = useState([]);

  useRealtimeVideos((payload) => {
    if (payload.eventType === 'INSERT') {
      setVideos((prev) => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setVideos((prev) =>
        prev.map((video) => (video.id === payload.new.id ? payload.new : video))
      );
    } else if (payload.eventType === 'DELETE') {
      setVideos((prev) => prev.filter((video) => video.id !== payload.old.id));
    }
  });

  // Rest of component
};
```

---

## AWS S3 Operations

### Generate Pre-signed Upload URL

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const generateUploadUrl = async (fileName: string, fileType: string) => {
  const key = `videos/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    key,
    publicUrl: `${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`,
  };
};
```

### Upload File to S3 (Frontend)

```typescript
export const uploadVideoToS3 = async (fileUri: string, uploadUrl: string) => {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': blob.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload video');
  }

  return uploadResponse;
};
```

---

## Redux Async Thunks

### Fetch Data Thunk

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchVideos } from '@/services/supabase/videos';

export const loadVideos = createAsyncThunk(
  'feed/loadVideos',
  async (topicId: string | undefined, { rejectWithValue }) => {
    try {
      const videos = await fetchVideos();
      return videos;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Using Thunk in Component

```typescript
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadVideos } from '@/store/slices/feedSlice';

const FeedScreen = () => {
  const dispatch = useDispatch();
  const { videos, loading, error } = useSelector((state) => state.feed);

  useEffect(() => {
    dispatch(loadVideos());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <VideoList videos={videos} />;
};
```

---

## Error Handling Patterns

### Try-Catch with User-Friendly Messages

```typescript
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Unable to load profile. Please try again later.');
  }
};
```

### Error Handling in Components

```typescript
const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchUserProfile(userId);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <EmptyState />;

  return <ProfileView profile={profile} />;
};
```

---

## Form Handling

### Basic Form State

```typescript
const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(email, password);
      // Navigate to home
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        error={errors.email}
      />
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        error={errors.password}
      />
      {errors.form && <Text style={styles.error}>{errors.form}</Text>}
      <Button title="Sign Up" onPress={handleSubmit} loading={loading} />
    </View>
  );
};
```

---

## Data Caching Pattern

### Cache with Timestamp

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = async (key: string) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

export const setCachedData = async (key: string, data: any) => {
  try {
    const cached = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Usage
const fetchVideosWithCache = async () => {
  const cached = await getCachedData('videos');
  if (cached) return cached;

  const videos = await fetchVideos();
  await setCachedData('videos', videos);
  return videos;
};
```

---

## Pagination Pattern

### Infinite Scroll with FlatList

```typescript
const FeedScreen = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const limit = 20;
      const offset = page * limit;
      const newVideos = await fetchVideos(limit, offset);

      if (newVideos.length < limit) {
        setHasMore(false);
      }

      setVideos((prev) => [...prev, ...newVideos]);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={videos}
      renderItem={({ item }) => <VideoCard video={item} />}
      keyExtractor={(item) => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
};
```

---

**See Also:**
- Supabase documentation: `/brain/03-api/supabase/`
- AWS documentation: `/brain/03-api/aws/`
- Component patterns: `/brain/04-development/standards/component-patterns.md`
