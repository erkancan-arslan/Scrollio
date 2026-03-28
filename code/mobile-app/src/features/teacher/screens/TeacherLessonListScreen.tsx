import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherLessonList'>;
};

const statusColors: Record<string, string> = {
  draft: '#9E9E9E',
  processing: '#F57F17',
  published: '#2E7D32',
  failed: '#C62828',
};

export const TeacherLessonListScreen: React.FC<Props> = ({ navigation }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await apiClient.get<any[]>('/teacher/lessons');
    if (res.data) setLessons(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TeacherLessonDetail', { lessonId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#9E9E9E' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardTopic} numberOfLines={1}>{item.topic}</Text>
      {item.progress_percent > 0 && item.status === 'processing' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress_percent}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={teacherColors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Geri</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Derslerim</Text>
      </View>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={teacherColors.primary} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz ders oluşturulmadı.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  topBar: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12,
  },
  backText: { fontSize: 16, fontWeight: '600', color: teacherColors.primary },
  heading: { fontSize: 22, fontWeight: '700', color: teacherColors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: teacherColors.background,
    borderRadius: 14, padding: spacing.md,
    marginBottom: 10, borderWidth: 1, borderColor: teacherColors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: teacherColors.text, flex: 1, marginRight: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFF', textTransform: 'uppercase' },
  cardTopic: { fontSize: 13, color: teacherColors.textMuted },
  progressBar: {
    height: 4, backgroundColor: teacherColors.border, borderRadius: 2, marginTop: 8, overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: teacherColors.primary, borderRadius: 2 },
  empty: { textAlign: 'center', color: teacherColors.textMuted, marginTop: 40, fontSize: 15 },
});
