import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { GeneratedVideoCard } from '../components/GeneratedVideoCard';
import { GeneratedVideo } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

export const GeneratedVideosScreen: React.FC = () => {
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'' | 'core' | 'kids'>('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const res = await adminApi.listGeneratedVideos({
      contentTarget: filter || undefined,
      limit: 50,
    });
    if (res.data) {
      setVideos(res.data.data);
      setTotal(res.data.count);
    }
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const togglePublish = async (video: GeneratedVideo) => {
    const isPublished = video.feed_items?.some((fi) => fi.is_published);
    if (isPublished) {
      const res = await adminApi.unpublishVideo(video.id);
      if (res.error) Alert.alert('Error', res.error);
    } else {
      const res = await adminApi.publishVideo(video.id);
      if (res.error) Alert.alert('Error', res.error);
    }
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Generated Videos" />
      <View style={styles.filterRow}>
        {(['', 'core', 'kids'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <GeneratedVideoCard video={item} onPress={() => togglePublish(item)} />
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No generated videos yet.</Text>
          }
          ListHeaderComponent={
            <Text style={styles.countText}>{total} video{total !== 1 ? 's' : ''}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  list: { padding: spacing.md, paddingBottom: spacing.xxxl },
  emptyText: {
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  countText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
});
