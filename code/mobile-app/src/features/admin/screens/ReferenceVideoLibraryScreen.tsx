import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { ReferenceVideoCard } from '../components/ReferenceVideoCard';
import { ReferenceVideo } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

export const ReferenceVideoLibraryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [videos, setVideos] = useState<ReferenceVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async (searchTerm = '') => {
    const res = await adminApi.listReferenceVideos({
      search: searchTerm || undefined,
      limit: 50,
    });
    if (res.data) {
      setVideos(res.data.data);
      setTotal(res.data.count);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 400);
    return () => clearTimeout(timer);
  }, [search, load]);

  const onRefresh = () => { setRefreshing(true); load(search); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader
        title="Reference Videos"
        rightAction={{
          label: '+ Upload',
          onPress: () => navigation.navigate('AdminUploadReferenceVideo'),
        }}
      />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReferenceVideoCard
              video={item}
              onPress={() => navigation.navigate('AdminReferenceVideoDetail', { videoId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reference videos yet.</Text>
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
  searchBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  searchInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
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
