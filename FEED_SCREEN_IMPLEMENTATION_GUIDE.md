# Feed Screen Implementation Guide

> **Purpose**: This guide provides a comprehensive walkthrough for implementing a TikTok-style vertical feed with smooth scrolling, proper video/image sizing, and no bottom navbar overflow issues.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Critical: Preventing Scroll Glitches](#critical-preventing-scroll-glitches)
3. [Critical: Proper Screen Sizing (No Overflow)](#critical-proper-screen-sizing-no-overflow)
4. [Core Components](#core-components)
5. [State Management Strategy](#state-management-strategy)
6. [Caching System](#caching-system)
7. [Optimistic Updates](#optimistic-updates)
8. [Performance Optimizations](#performance-optimizations)
9. [Engagement Tracking](#engagement-tracking)
10. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

### High-Level Structure

```
Feed Screen
├── Tab Switcher (For You / Following)
├── FlatList (Vertical Scroll)
│   ├── Post Item (Memoized)
│   │   ├── Media Container (Full Screen Height)
│   │   ├── Action Buttons (Right Side)
│   │   └── Content Overlay (Bottom)
│   └── ViewTracker (Analytics)
└── Modals (Options, Share, Report)
```

### Key Design Principles

1. **One post = One viewport** - Each post occupies exactly the visible screen height
2. **Snap scrolling** - Smooth transitions between posts
3. **Lazy loading** - Only render visible + adjacent posts
4. **Cache-first** - Show cached content instantly, sync in background
5. **Optimistic updates** - Update UI immediately, rollback on error

---

## Critical: Preventing Scroll Glitches

### Problem: Janky Scrolling

Scroll glitches typically occur due to:
- Dynamic heights
- Too many items rendered at once
- Heavy re-renders
- Nested scrolling conflicts

### Solution 1: Fixed Item Heights with `getItemLayout`

**Why this matters**: FlatList performs dramatically better when it knows item heights upfront.

```javascript
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const ExploreScreen = () => {
  const { height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Calculate exact height for each post
  const itemHeight = useMemo(() => {
    const calculated = height - tabBarHeight;
    return calculated > 0 ? calculated : height;
  }, [tabBarHeight, height]);
  
  const snapInterval = itemHeight;
  
  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      
      // CRITICAL: Pre-calculate layout
      getItemLayout={(data, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      
      // Snap settings
      snapToInterval={itemHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum={true}
      
      // Performance
      removeClippedSubviews={true}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
      
      // Disable bouncing for smoother feel
      bounces={false}
      
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
};
```

### Solution 2: Memoize Post Items

**Why this matters**: Prevents unnecessary re-renders of posts that haven't changed.

```javascript
const PostItem = React.memo(({ 
  item, 
  onToggleLike, 
  onToggleBookmark,
  itemHeight,
  // ... other props
}) => {
  return (
    <View style={{ height: itemHeight }}>
      {/* Post content */}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.isLiked === nextProps.item.isLiked &&
    prevProps.item.isBookmarked === nextProps.item.isBookmarked &&
    prevProps.item.likeCount === nextProps.item.likeCount &&
    prevProps.item.bookmarkCount === nextProps.item.bookmarkCount
  );
});
```

### Solution 3: Disable Nested Scroll Conflicts

```javascript
<FlatList
  nestedScrollEnabled={false}
  contentInsetAdjustmentBehavior="never"
  // ... other props
/>
```

### Solution 4: Throttle Scroll Events

```javascript
const handleScroll = useCallback((event) => {
  const offset = event.nativeEvent.contentOffset.y;
  
  // Throttle updates to reduce lag
  if (Date.now() - (handleScroll.lastUpdate || 0) > 300) {
    // Update scroll position state
    setScrollPosition(offset);
    handleScroll.lastUpdate = Date.now();
  }
}, []);

<FlatList
  onScroll={handleScroll}
  scrollEventThrottle={100} // Update max once per 100ms
/>
```

---

## Critical: Proper Screen Sizing (No Overflow)

### Problem: Content Overflows to Bottom Navbar

This happens when posts don't account for:
- Status bar height
- Bottom tab bar height
- Safe area insets (notches, home indicator)

### Solution: Calculate Exact Available Height

```javascript
import { Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const ExploreScreen = () => {
  const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Calculate the exact height available for content
  const availableHeight = useMemo(() => {
    let calculated = windowHeight;
    
    // Subtract bottom tab bar
    calculated -= tabBarHeight;
    
    // Note: Don't subtract top inset as it's handled by SafeAreaView
    
    return calculated > 0 ? calculated : windowHeight;
  }, [windowHeight, tabBarHeight]);
  
  // Use this height for each post
  const itemHeight = availableHeight;
  
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostItem 
            item={item} 
            itemHeight={itemHeight}
            windowWidth={windowWidth}
          />
        )}
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        snapToInterval={itemHeight}
      />
    </View>
  );
};
```

### Solution: Proper Post Item Sizing

```javascript
const PostItem = ({ item, itemHeight, windowWidth }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom offset for action buttons and content
  // to ensure they don't go under the tab bar
  const bottomOffset = 30 + insets.bottom;
  
  return (
    <View style={{ 
      height: itemHeight,
      width: windowWidth,
      position: 'relative'
    }}>
      {/* Media (background) */}
      <Image 
        source={{ uri: item.media[0].url }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute'
        }}
        resizeMode="cover"
      />
      
      {/* Right action buttons - positioned from bottom with safe offset */}
      <View style={{
        position: 'absolute',
        right: 16,
        bottom: bottomOffset,
        alignItems: 'center'
      }}>
        {/* Like, bookmark, share buttons */}
      </View>
      
      {/* Bottom content - positioned with safe offset */}
      <View style={{
        position: 'absolute',
        left: 16,
        right: 80,
        bottom: bottomOffset
      }}>
        {/* Username, caption, hashtags */}
      </View>
    </View>
  );
};
```

### Solution: Header Overlay (Don't Affect Layout)

```javascript
const ExploreScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1 }}>
      {/* FlatList takes full height */}
      <FlatList {...props} />
      
      {/* Header overlays on top - doesn't affect layout */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top,
        paddingHorizontal: 16,
        zIndex: 10
      }}>
        {/* Tabs and search button */}
      </View>
    </View>
  );
};
```

### Video-Specific Sizing (If Using Video)

```javascript
import Video from 'react-native-video';

const VideoPost = ({ item, itemHeight, windowWidth }) => {
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  
  const handleLoad = (data) => {
    const { width, height } = data.naturalSize;
    setVideoSize({ width, height });
  };
  
  // Calculate aspect ratio fit
  const aspectRatio = videoSize.width / videoSize.height;
  const containerAspect = windowWidth / itemHeight;
  
  let videoStyle;
  if (aspectRatio > containerAspect) {
    // Video is wider - fit height
    videoStyle = {
      width: '100%',
      height: itemHeight,
    };
  } else {
    // Video is taller - fit width
    videoStyle = {
      width: windowWidth,
      height: windowWidth / aspectRatio,
    };
  }
  
  return (
    <View style={{ height: itemHeight, width: windowWidth }}>
      <Video
        source={{ uri: item.media[0].url }}
        style={videoStyle}
        resizeMode="cover"
        onLoad={handleLoad}
        paused={!isVisible} // Only play when visible
      />
    </View>
  );
};
```

---

## Core Components

### 1. Main Feed Screen Structure

```javascript
const ExploreScreen = ({ route, navigation }) => {
  // Hooks
  const { height, width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const auth = useAuth();
  
  // Calculate dimensions
  const itemHeight = useMemo(() => 
    height - tabBarHeight > 0 ? height - tabBarHeight : height,
    [height, tabBarHeight]
  );
  
  // State
  const [activeTab, setActiveTab] = useState('forYou');
  const [forYouData, setForYouData] = useState([]);
  const [followingData, setFollowingData] = useState([]);
  const [forYouCursor, setForYouCursor] = useState(null);
  const [followingCursor, setFollowingCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs
  const flatListRef = useRef(null);
  
  // Load posts (see caching section)
  const loadPosts = async (refresh = false) => {
    // Implementation below
  };
  
  // Render
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <FlatList
        ref={flatListRef}
        data={activeTab === 'forYou' ? forYouData : followingData}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        
        // Critical sizing
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        
        // Snap behavior
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        
        // Performance
        removeClippedSubviews={true}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        bounces={false}
        
        // Refresh
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadPosts(true)}
          />
        }
        
        // Pagination
        onEndReached={() => {
          if (!isLoading && cursor) {
            loadPosts(false);
          }
        }}
        onEndReachedThreshold={0.5}
      />
      
      {/* Overlay header */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top,
        zIndex: 10
      }}>
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </View>
  );
};
```

### 2. Post Item Component

```javascript
const PostItem = React.memo(({ 
  item, 
  itemHeight,
  onToggleLike,
  onToggleBookmark,
  onUserPress
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = 30 + insets.bottom;
  
  return (
    <View style={{ height: itemHeight, width: '100%' }}>
      {/* Background media */}
      <Image
        source={{ uri: item.media[0].url }}
        style={{ 
          position: 'absolute',
          width: '100%',
          height: '100%'
        }}
        resizeMode="cover"
      />
      
      {/* Right actions */}
      <View style={{
        position: 'absolute',
        right: 16,
        bottom: bottomOffset,
        alignItems: 'center'
      }}>
        <ActionButton
          icon={item.isLiked ? 'heart' : 'heart-outline'}
          count={item.likeCount}
          onPress={() => onToggleLike(item.id)}
          active={item.isLiked}
        />
        <ActionButton
          icon={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
          count={item.bookmarkCount}
          onPress={() => onToggleBookmark(item.id)}
          active={item.isBookmarked}
        />
      </View>
      
      {/* Bottom content */}
      <View style={{
        position: 'absolute',
        left: 16,
        right: 80,
        bottom: bottomOffset
      }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          @{item.author.username}
        </Text>
        <Text style={{ color: '#fff' }}>
          {item.caption}
        </Text>
      </View>
    </View>
  );
}, (prev, next) => {
  // Only re-render if these specific properties change
  return (
    prev.item.id === next.item.id &&
    prev.item.isLiked === next.item.isLiked &&
    prev.item.isBookmarked === next.item.isBookmarked &&
    prev.item.likeCount === next.item.likeCount &&
    prev.item.bookmarkCount === next.item.bookmarkCount
  );
});
```

---

## State Management Strategy

### Tab-Specific State

```javascript
const [tabStates, setTabStates] = useState({
  forYou: { 
    loaded: false, 
    scrollOffset: 0,
    data: [],
    cursor: null
  },
  following: { 
    loaded: false, 
    scrollOffset: 0,
    data: [],
    cursor: null
  }
});

// When switching tabs
const handleTabChange = (newTab) => {
  setActiveTab(newTab);
  
  // Load data if not already loaded
  if (!tabStates[newTab].loaded) {
    loadPosts(false, newTab);
  }
  
  // Restore scroll position
  setTimeout(() => {
    if (flatListRef.current && tabStates[newTab].scrollOffset > 0) {
      flatListRef.current.scrollToOffset({
        offset: tabStates[newTab].scrollOffset,
        animated: false
      });
    }
  }, 50);
};

// Save scroll position when scrolling
const handleScroll = (event) => {
  const offset = event.nativeEvent.contentOffset.y;
  
  if (Date.now() - (handleScroll.lastUpdate || 0) > 300) {
    setTabStates(prev => ({
      ...prev,
      [activeTab]: { 
        ...prev[activeTab], 
        scrollOffset: offset 
      }
    }));
    handleScroll.lastUpdate = Date.now();
  }
};
```

### Loading States Per Action

```javascript
// Don't use single loading state - use per-item states
const [likeLoading, setLikeLoading] = useState({}); // { postId: boolean }
const [bookmarkLoading, setBookmarkLoading] = useState({}); // { postId: boolean }

// Usage
const handleLike = async (postId) => {
  if (likeLoading[postId]) return; // Prevent double-tap
  
  setLikeLoading(prev => ({ ...prev, [postId]: true }));
  
  try {
    // Optimistic update
    updatePostInState(postId, { isLiked: true, likeCount: post.likeCount + 1 });
    
    // API call
    await postsApi.likePost(postId);
  } catch (error) {
    // Revert on error
    updatePostInState(postId, { isLiked: false, likeCount: post.likeCount - 1 });
  } finally {
    setLikeLoading(prev => ({ ...prev, [postId]: false }));
  }
};
```

---

## Caching System

### Two-Tier Loading Strategy

**Goal**: Show content instantly from cache, then update in background.

```javascript
// FeedCache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'feed_cache_';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export class FeedCache {
  static async get(feedType, userId) {
    try {
      const key = `${CACHE_PREFIX}${feedType}_${userId}`;
      const raw = await AsyncStorage.getItem(key);
      
      if (!raw) return null;
      
      const parsed = JSON.parse(raw);
      const age = Date.now() - parsed.cachedAt;
      
      // Return null if expired
      if (age > CACHE_TTL) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return {
        posts: parsed.posts,
        cursor: parsed.cursor,
        cachedAt: parsed.cachedAt
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(feedType, userId, posts, cursor) {
    try {
      const key = `${CACHE_PREFIX}${feedType}_${userId}`;
      const data = {
        posts,
        cursor,
        cachedAt: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  static async append(feedType, userId, newPosts, newCursor) {
    const cached = await this.get(feedType, userId);
    if (!cached) {
      return this.set(feedType, userId, newPosts, newCursor);
    }
    
    // Deduplicate
    const existingIds = new Set(cached.posts.map(p => p.id));
    const uniqueNew = newPosts.filter(p => !existingIds.has(p.id));
    const allPosts = [...cached.posts, ...uniqueNew];
    
    await this.set(feedType, userId, allPosts, newCursor);
  }
  
  static async invalidate(feedType, userId) {
    const key = `${CACHE_PREFIX}${feedType}_${userId}`;
    await AsyncStorage.removeItem(key);
  }
}
```

### Load Posts Implementation

```javascript
const loadPosts = async (refresh = false, tab = activeTab) => {
  const userId = auth.user?.id;
  if (!userId) return;
  
  // Check if already loaded and not refreshing
  if (!refresh && tabStates[tab].loaded) {
    return;
  }
  
  // Step 1: Load from cache instantly
  if (!refresh) {
    const cached = await FeedCache.get(tab, userId);
    if (cached && cached.posts.length > 0) {
      // Show cached data immediately
      setTabStates(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          data: cached.posts,
          cursor: cached.cursor,
          loaded: true
        }
      }));
      
      // Then sync in background
      loadFromAPI(tab, userId, false, true); // backgroundSync = true
      return;
    }
  }
  
  // Step 2: Load from API
  await loadFromAPI(tab, userId, refresh, false);
};

const loadFromAPI = async (tab, userId, refresh, backgroundSync) => {
  try {
    // Only show loading if not background sync
    if (!backgroundSync) {
      setIsLoading(true);
    }
    
    const currentCursor = refresh ? null : tabStates[tab].cursor;
    
    // API call
    const response = tab === 'forYou' 
      ? await feedApi.getFeedExplore({ cursor: currentCursor })
      : await feedApi.getFeedHome({ cursor: currentCursor });
    
    const { posts, nextCursor } = response;
    
    // Update state
    setTabStates(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        data: refresh ? posts : [...prev[tab].data, ...posts],
        cursor: nextCursor,
        loaded: true
      }
    }));
    
    // Update cache
    if (refresh || !currentCursor) {
      await FeedCache.set(tab, userId, posts, nextCursor);
    } else {
      await FeedCache.append(tab, userId, posts, nextCursor);
    }
    
  } catch (error) {
    console.error('Load posts error:', error);
  } finally {
    if (!backgroundSync) {
      setIsLoading(false);
    }
  }
};
```

---

## Optimistic Updates

### Pattern: Update → API → Revert on Error

```javascript
const toggleLike = async (postId) => {
  // Prevent double-tap
  if (likeLoading[postId]) return;
  
  setLikeLoading(prev => ({ ...prev, [postId]: true }));
  
  // Find post
  const currentData = tabStates[activeTab].data;
  const post = currentData.find(p => p.id === postId);
  if (!post) return;
  
  // Optimistic update
  const newIsLiked = !post.isLiked;
  const newCount = post.isLiked ? post.likeCount - 1 : post.likeCount + 1;
  
  updatePostInBothTabs(postId, {
    isLiked: newIsLiked,
    likeCount: newCount
  });
  
  try {
    // API call
    const response = post.isLiked 
      ? await postsApi.unlikePost(postId)
      : await postsApi.likePost(postId);
    
    // Update with server count
    if (response?.likeCount !== undefined) {
      updatePostInBothTabs(postId, {
        likeCount: response.likeCount
      });
    }
    
  } catch (error) {
    console.error('Like error:', error);
    
    // Revert optimistic update
    updatePostInBothTabs(postId, {
      isLiked: post.isLiked,
      likeCount: post.likeCount
    });
    
    Alert.alert('Error', 'Failed to update like. Please try again.');
  } finally {
    setLikeLoading(prev => ({ ...prev, [postId]: false }));
  }
};

// Helper to update post in both tabs
const updatePostInBothTabs = (postId, updates) => {
  const updater = (prev) => ({
    ...prev,
    forYou: {
      ...prev.forYou,
      data: prev.forYou.data.map(p => 
        p.id === postId ? { ...p, ...updates } : p
      )
    },
    following: {
      ...prev.following,
      data: prev.following.data.map(p => 
        p.id === postId ? { ...p, ...updates } : p
      )
    }
  });
  
  setTabStates(updater);
};
```

---

## Performance Optimizations

### 1. Memoize Expensive Calculations

```javascript
// Don't recalculate on every render
const itemHeight = useMemo(() => {
  const calculated = windowHeight - tabBarHeight;
  return calculated > 0 ? calculated : windowHeight;
}, [windowHeight, tabBarHeight]);

const bottomOffset = useMemo(() => 
  30 + insets.bottom,
  [insets.bottom]
);
```

### 2. Memoize Callbacks

```javascript
const handleLike = useCallback(async (postId) => {
  // Implementation
}, [tabStates, activeTab]); // Only recreate if dependencies change

const handleUserPress = useCallback((userId) => {
  navigation.navigate('Profile', { userId });
}, [navigation]);
```

### 3. Memoize Render Functions

```javascript
const renderPost = useCallback(({ item }) => (
  <PostItem
    item={item}
    itemHeight={itemHeight}
    onToggleLike={handleLike}
    onToggleBookmark={handleBookmark}
    onUserPress={handleUserPress}
  />
), [itemHeight, handleLike, handleBookmark, handleUserPress]);
```

### 4. Use PureComponent Pattern for Lists

```javascript
const PostList = React.memo(({ data, renderItem, itemHeight }) => (
  <FlatList
    data={data}
    renderItem={renderItem}
    getItemLayout={(data, index) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    })}
    // ... other props
  />
), (prev, next) => {
  // Only re-render if data reference changes
  return prev.data === next.data;
});
```

### 5. Limit Re-Renders with Keys

```javascript
// Good: Stable keys
<FlatList
  data={posts}
  keyExtractor={(item) => item.id}
/>

// Bad: Index keys (causes re-renders on data change)
<FlatList
  data={posts}
  keyExtractor={(item, index) => index.toString()}
/>
```

---

## Engagement Tracking

### View Time Tracking

```javascript
// ViewTracker.js
import { useRef, useEffect } from 'react';
import { AppState } from 'react-native';

const ViewTracker = ({ postId, children, threshold = 0.5 }) => {
  const viewRef = useRef(null);
  const isViewingRef = useRef(false);
  const viewStartTime = useRef(null);
  
  const measureVisibility = () => {
    if (!viewRef.current) return;
    
    viewRef.current.measureInWindow((x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      
      // Calculate how much is visible
      const visibleTop = Math.max(0, y);
      const visibleBottom = Math.min(screenHeight, y + height);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = height > 0 ? visibleHeight / height : 0;
      
      const isVisible = visibilityRatio >= threshold;
      
      if (isVisible && !isViewingRef.current) {
        // Start tracking
        isViewingRef.current = true;
        viewStartTime.current = Date.now();
        trackViewStart(postId);
      } else if (!isVisible && isViewingRef.current) {
        // End tracking
        const duration = Date.now() - viewStartTime.current;
        isViewingRef.current = false;
        viewStartTime.current = null;
        trackViewEnd(postId, duration);
      }
    });
  };
  
  useEffect(() => {
    // Check visibility every second
    const interval = setInterval(measureVisibility, 1000);
    
    return () => {
      clearInterval(interval);
      
      // End tracking on unmount
      if (isViewingRef.current) {
        const duration = Date.now() - viewStartTime.current;
        trackViewEnd(postId, duration);
      }
    };
  }, [postId]);
  
  // Handle app backgrounding
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' && isViewingRef.current) {
        const duration = Date.now() - viewStartTime.current;
        trackViewEnd(postId, duration);
        isViewingRef.current = false;
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [postId]);
  
  return (
    <View ref={viewRef}>
      {children}
    </View>
  );
};

// Analytics functions
const trackViewStart = (postId) => {
  console.log('View started:', postId);
  // Send to analytics
};

const trackViewEnd = (postId, duration) => {
  // Only track if viewed for at least 3 seconds
  if (duration >= 3000) {
    console.log('View ended:', postId, 'Duration:', duration);
    // Send to analytics
  }
};
```

---

## Implementation Checklist

### Phase 1: Core Structure ✓

- [ ] Set up main screen with proper safe area handling
- [ ] Calculate correct item height (window height - tab bar height)
- [ ] Implement FlatList with `getItemLayout`
- [ ] Add snap-to-interval behavior
- [ ] Create memoized PostItem component
- [ ] Test scrolling smoothness

### Phase 2: Data Loading ✓

- [ ] Implement API client for feed endpoints
- [ ] Create FeedCache class with AsyncStorage
- [ ] Implement two-tier loading (cache → background sync)
- [ ] Add pull-to-refresh
- [ ] Add infinite scroll pagination
- [ ] Handle loading and error states

### Phase 3: Interactions ✓

- [ ] Implement optimistic like/unlike
- [ ] Implement optimistic bookmark/unbookmark
- [ ] Add per-item loading states
- [ ] Add error handling with rollback
- [ ] Update cache after interactions

### Phase 4: Multi-Tab Support ✓

- [ ] Implement tab switcher UI
- [ ] Create tab-specific state management
- [ ] Preserve scroll position when switching tabs
- [ ] Lazy load tabs (only load when first visited)
- [ ] Share data between tabs (e.g., liked posts)

### Phase 5: Polish ✓

- [ ] Add view time tracking
- [ ] Implement empty states
- [ ] Add share functionality
- [ ] Add report functionality
- [ ] Test on different screen sizes
- [ ] Test on Android and iOS
- [ ] Performance test with 100+ posts

---

## Common Issues & Solutions

### Issue 1: Posts Don't Fill Screen

**Symptom**: White space above/below posts

**Solution**: Check that you're not accidentally adding padding/margin to post container

```javascript
// Bad
<View style={{ height: itemHeight, padding: 16 }}>

// Good
<View style={{ height: itemHeight, padding: 0 }}>
```

### Issue 2: Content Hidden Behind Tab Bar

**Symptom**: Bottom content is cut off

**Solution**: Calculate bottom offset properly

```javascript
const insets = useSafeAreaInsets();
const bottomOffset = 30 + insets.bottom; // 30 for tab bar margin

<View style={{ bottom: bottomOffset }}>
  {/* Content */}
</View>
```

### Issue 3: Janky Scrolling

**Symptom**: Lag when scrolling between posts

**Solutions**:
1. Add `getItemLayout` (most important)
2. Reduce `windowSize` to 3-5
3. Set `initialNumToRender` to 2
4. Enable `removeClippedSubviews`
5. Memoize PostItem with proper comparison function
6. Throttle scroll events to 100ms

### Issue 4: Memory Issues with Many Posts

**Symptom**: App crashes after scrolling through many posts

**Solutions**:
1. Enable `removeClippedSubviews={true}`
2. Use proper memoization
3. Limit cached posts to last 50-100
4. Clean up image/video resources in `useEffect` cleanup

### Issue 5: Nested Scroll Conflicts

**Symptom**: Can't scroll through photo carousel or videos pause incorrectly

**Solution**: Use `nestedScrollEnabled={false}` on FlatList and proper gesture handlers on carousel

---

## Testing Strategy

### Manual Testing Checklist

- [ ] Scroll through 20+ posts smoothly (no lag)
- [ ] Like/unlike multiple posts (check optimistic updates)
- [ ] Switch between tabs (check scroll position preservation)
- [ ] Pull to refresh (check loading state)
- [ ] Scroll to bottom (check pagination)
- [ ] Close and reopen app (check cache)
- [ ] Toggle airplane mode (check offline behavior)
- [ ] Test on small phone (iPhone SE)
- [ ] Test on large phone (iPhone Pro Max)
- [ ] Test on Android
- [ ] Test with notched phones
- [ ] Test landscape orientation (if supported)

### Performance Metrics

Use React Native Performance Monitor:

```bash
# iOS
xcrun simctl io booted recordVideo --codec=h264 --force test.mp4

# Check FPS should be 60fps consistently
```

Target metrics:
- **60 FPS** during scrolling
- **< 200ms** time to first post (with cache)
- **< 1s** time to first post (without cache)
- **< 100ms** optimistic update response time

---

## Additional Features (Optional)

### Multi-Photo Carousel

```javascript
import { ScrollView } from 'react-native';

const PhotoCarousel = ({ media, onPhotoChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const width = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(offsetX / width);
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
      onPhotoChange?.(index);
    }
  };
  
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {media.map((item, index) => (
        <Image
          key={index}
          source={{ uri: item.url }}
          style={{ width: screenWidth, height: '100%' }}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
};
```

### Video Support

```javascript
import Video from 'react-native-video';

const [isVisible, setIsVisible] = useState(false);

<Video
  source={{ uri: post.media[0].url }}
  style={{ width: '100%', height: '100%' }}
  resizeMode="cover"
  paused={!isVisible} // Only play when visible
  repeat
  muted={false}
/>
```

---

## Debugging Tips

### Enable Performance Monitoring

```javascript
// In App.js
if (__DEV__) {
  require('react-native').unstable_enableLogBox();
}

// Monitor render count
useEffect(() => {
  console.log('PostItem rendered:', item.id);
});
```

### Log Scroll Performance

```javascript
const handleScroll = (event) => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  console.log('Scroll offset:', contentOffset.y);
  console.log('Content size:', contentSize.height);
  console.log('Visible height:', layoutMeasurement.height);
};
```

### Check Memory Usage

```javascript
// iOS: Xcode Instruments → Memory
// Android: Android Studio → Profiler
```

---

## Summary

### Key Takeaways

1. **Fixed heights** are critical for smooth scrolling
2. **Cache-first** loading provides instant UX
3. **Optimistic updates** make interactions feel instant
4. **Memoization** prevents unnecessary re-renders
5. **Proper sizing** prevents overflow issues

### Architecture Pattern

```
Cache Check → Instant Display → Background Sync → Update UI
     ↓              ↓                  ↓              ↓
  Fast UX     User sees data    Fresh data    Silent update
```

This architecture provides the best user experience with minimal perceived loading time while ensuring data freshness.

---

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [AsyncStorage Best Practices](https://react-native-async-storage.github.io/async-storage/docs/usage/)
- [Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Status**: Production-Ready ✓
