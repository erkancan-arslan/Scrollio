import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { apiClient } from '../../../../services/api/apiClient';
import { spacing } from '../../../../theme';

const KIDS_ORANGE = '#FF6B35';

export const KidsClassroomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { childId } = useActiveChild();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!childId) { setLoading(false); return; }
    const res = await apiClient.get<any[]>(`/kids/classroom?childProfileId=${childId}`, true);
    if (res.data) setClassrooms(res.data);
    setLoading(false);
    setRefreshing(false);
  }, [childId]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    if (code.trim().length !== 6) {
      Alert.alert('Hata', 'Sınıf kodu 6 karakter olmalı.');
      return;
    }
    setJoining(true);
    const res = await apiClient.post<any>('/kids/classroom/join', {
      code: code.trim().toUpperCase(),
      childProfileId: childId,
    });
    setJoining(false);

    if (res.error) {
      Alert.alert('Hata', res.error);
      return;
    }
    Alert.alert('Başarılı', res.data?.alreadyJoined ? 'Zaten bu sınıftasınız.' : 'Sınıfa katıldınız!');
    setCode('');
    setShowJoin(false);
    load();
  };

  const openLessons = (classroom: any) => {
    navigation.navigate('KidsClassroomLessons', { classroomId: classroom.id, classroomName: classroom.name });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={KIDS_ORANGE} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Ionicons name="school" size={28} color={KIDS_ORANGE} />
        <Text style={styles.heading}>Sınıflarım</Text>
      </View>

      {showJoin && (
        <View style={styles.joinBox}>
          <Text style={styles.joinLabel}>Sınıf Kodunu Gir</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor="#999"
            maxLength={6}
            autoCapitalize="characters"
          />
          <View style={styles.joinRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowJoin(false); setCode(''); }}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.joinBtn, joining && { opacity: 0.7 }]}
              onPress={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.joinBtnText}>Katıl</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={classrooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={KIDS_ORANGE} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="school-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Henüz bir sınıfa katılmadın.</Text>
            <Text style={styles.emptyHint}>Öğretmeninden aldığın kodu gir!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openLessons(item)}>
            <View style={styles.cardLeft}>
              <Ionicons name="book-outline" size={24} color={KIDS_ORANGE} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.teacher_profiles?.name || 'Öğretmen'}{item.subject ? ` • ${item.subject}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      />

      {!showJoin && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowJoin(true)}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  heading: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  cardLeft: { marginRight: 12 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  cardMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888', marginTop: 12 },
  emptyHint: { fontSize: 14, color: '#AAA', marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    backgroundColor: KIDS_ORANGE, width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  joinBox: {
    marginHorizontal: spacing.lg, backgroundColor: '#FFF', borderRadius: 14,
    padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#FFE0B2',
  },
  joinLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  codeInput: {
    backgroundColor: '#FFF8F0', borderRadius: 10, borderWidth: 1, borderColor: '#FFE0B2',
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 20, fontWeight: '700',
    letterSpacing: 4, textAlign: 'center', color: '#1A1A1A',
  },
  joinRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#666' },
  joinBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    backgroundColor: KIDS_ORANGE,
  },
  joinBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
