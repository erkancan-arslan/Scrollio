# Common Code Patterns

**Last Updated:** December 2025
**Status:** Active

This document contains frequently used code patterns in the Scrollio project.

---

## Navigation Patterns

### Navigate to Screen

```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('VideoDetail', { videoId: '123' });
  };

  return <Button onPress={handlePress} />;
};
```

### Navigate with Type Safety

```typescript
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  Feed: undefined;
  VideoDetail: { videoId: string };
  Profile: { userId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();

  navigation.navigate('VideoDetail', { videoId: '123' }); // Type-safe!
};
```

### Go Back

```typescript
const handleGoBack = () => {
  navigation.goBack();
};
```

---

## Loading States

### Simple Loading

```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await apiCall();
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

if (loading) return <LoadingSpinner />;
```

### Skeleton Loading

```typescript
import { View, StyleSheet } from 'react-native';

const SkeletonCard = () => (
  <View style={styles.skeleton}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
  </View>
);

const MyScreen = () => {
  if (loading) {
    return (
      <View>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return <DataView />;
};
```

---

## Conditional Rendering

### Multiple States

```typescript
const MyComponent = () => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data || data.length === 0) return <EmptyState />;

  return <DataList data={data} />;
};
```

### Inline Conditional

```typescript
<View>
  {isLoggedIn && <UserProfile />}
  {!isLoggedIn && <LoginPrompt />}
  {showNotification && <Notification />}
</View>
```

---

## List Rendering

### FlatList Basic

```typescript
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>
```

### FlatList Optimized

```typescript
const ITEM_HEIGHT = 120;

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={5}
  initialNumToRender={10}
/>
```

### FlatList with Empty State

```typescript
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={<EmptyState message="No items found" />}
  ListHeaderComponent={<Header />}
  ListFooterComponent={loading ? <LoadingSpinner /> : null}
/>
```

---

## Debouncing Input

### Search Input Debounce

```typescript
import { useState, useEffect } from 'react';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedTerm) {
      // Perform search
      performSearch(debouncedTerm);
    }
  }, [debouncedTerm]);

  return (
    <TextInput
      value={searchTerm}
      onChangeText={setSearchTerm}
      placeholder="Search..."
    />
  );
};
```

### Reusable Debounce Hook

```typescript
import { useState, useEffect } from 'react';

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const searchTerm = useDebounce(inputValue, 500);
```

---

## Modal Patterns

### Basic Modal

```typescript
const [isModalVisible, setIsModalVisible] = useState(false);

<Modal
  visible={isModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setIsModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text>Modal Content</Text>
      <Button title="Close" onPress={() => setIsModalVisible(false)} />
    </View>
  </View>
</Modal>
```

### Bottom Sheet Pattern

```typescript
const BottomSheet = ({ visible, onClose, children }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.bottomSheet}>
        <TouchableOpacity activeOpacity={1}>
          {children}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);
```

---

## Image Handling

### Image with Fallback

```typescript
const [imageError, setImageError] = useState(false);

<Image
  source={imageError ? require('@/assets/placeholder.png') : { uri: imageUrl }}
  onError={() => setImageError(true)}
  style={styles.image}
/>
```

### Image with Loading

```typescript
const [imageLoading, setImageLoading] = useState(true);

<View>
  {imageLoading && <ActivityIndicator style={styles.loader} />}
  <Image
    source={{ uri: imageUrl }}
    onLoadStart={() => setImageLoading(true)}
    onLoadEnd={() => setImageLoading(false)}
    style={styles.image}
  />
</View>
```

---

## Date Formatting

### Relative Time

```typescript
export const getRelativeTime = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return past.toLocaleDateString();
};
```

### Format Duration

```typescript
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

---

## Pull to Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  try {
    await fetchData();
  } finally {
    setRefreshing(false);
  }
};

<FlatList
  data={data}
  renderItem={renderItem}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

---

## Keyboard Handling

### Dismiss Keyboard on Tap

```typescript
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={styles.container}>
    <TextInput placeholder="Type here..." />
  </View>
</TouchableWithoutFeedback>
```

### Keyboard Aware ScrollView

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.container}
>
  <ScrollView>
    <TextInput placeholder="Input 1" />
    <TextInput placeholder="Input 2" />
  </ScrollView>
</KeyboardAvoidingView>
```

---

## Animation Patterns

### Fade In Animation

```typescript
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const FadeInView = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};
```

### Scale on Press

```typescript
const ScaleButton = ({ onPress, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
```

---

## Theme Access

### Using Theme

```typescript
import { colors, spacing, typography } from '@/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
});
```

---

## Safe Area

### Safe Area View

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

const MyScreen = () => (
  <SafeAreaView style={styles.container}>
    <View>{/* Content */}</View>
  </SafeAreaView>
);
```

---

**See Also:**
- Component patterns: `/brain/04-development/standards/component-patterns.md`
- API usage: `/brain/08-examples/api-usage/`
- Coding standards: `/brain/.cursorrules`
