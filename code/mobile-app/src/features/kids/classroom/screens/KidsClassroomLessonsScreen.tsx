import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { apiClient } from '../../../../services/api/apiClient';
import { spacing } from '../../../../theme';

const KIDS_ORANGE = '#FF6B35';

type Params = { classroomId: string; classroomName: string };

export const KidsClassroomLessonsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: Params }, 'params'>>();
  const { classroomId, classroomName } = route.params;
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await apiClient.get<any[]>(`/kids/classroom/${classroomId}/lessons`);
    if (res.data) setLessons(res.data);
    setLoading(false);
    setRefreshing(false);
  }, [classroomId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={KIDS_ORANGE} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={KIDS_ORANGE} />
        </TouchableOpacity>
        <Text style={styles.heading} numberOfLines={1}>{classroomName}</Text>
      </View>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={KIDS_ORANGE} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="book-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Henüz ders eklenmedi.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('KidsLessonPlayer', { lessonId: item.id })}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="play-circle" size={36} color={KIDS_ORANGE} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardTopic} numberOfLines={1}>{item.topic}</Text>
              <Text style={styles.cardMeta}>
                {item.subject || ''}{item.grade ? ` • ${item.grade}. sınıf` : ''}{item.difficulty ? ` • ${item.difficulty}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  heading: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  iconWrap: { marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  cardTopic: { fontSize: 13, color: '#666', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12 },
});
