import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherClassroom'>;
};

export const TeacherClassroomScreen: React.FC<Props> = ({ navigation }) => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');

  const load = async () => {
    const res = await apiClient.get<any[]>('/teacher/classrooms');
    if (res.data) setClassrooms(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('Hata', 'Sınıf adı zorunludur.');
      return;
    }
    setCreating(true);
    const res = await apiClient.post<any>('/teacher/classrooms', {
      name: newName.trim(),
      subject: newSubject.trim() || undefined,
      grade: newGrade.trim() || undefined,
    });
    setCreating(false);

    if (res.error) {
      Alert.alert('Hata', res.error);
      return;
    }

    setNewName('');
    setNewSubject('');
    setNewGrade('');
    load();
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Kopyalandı', `Sınıf kodu: ${code}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={teacherColors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Geri</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Sınıflarım</Text>

        {classrooms.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardName}>{c.name}</Text>
              <TouchableOpacity onPress={() => copyCode(c.code)}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{c.code}</Text>
                  <Ionicons name="copy-outline" size={14} color={teacherColors.primary} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardMeta}>
              {c.subject || ''} {c.grade ? `• ${c.grade}. sınıf` : ''}
            </Text>
            <Text style={styles.memberCount}>
              {c.classroom_members?.[0]?.count || 0} öğrenci
            </Text>
          </View>
        ))}

        <View style={styles.createSection}>
          <Text style={styles.createTitle}>Yeni Sınıf Oluştur</Text>
          <TextInput
            style={styles.input}
            placeholder="Sınıf Adı *"
            placeholderTextColor={teacherColors.textMuted}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Branş (opsiyonel)"
            placeholderTextColor={teacherColors.textMuted}
            value={newSubject}
            onChangeText={setNewSubject}
          />
          <TextInput
            style={styles.input}
            placeholder="Sınıf seviyesi (opsiyonel)"
            placeholderTextColor={teacherColors.textMuted}
            value={newGrade}
            onChangeText={setNewGrade}
          />
          <TouchableOpacity
            style={[styles.createBtn, creating && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={teacherColors.inverse} />
            ) : (
              <Text style={styles.createBtnText}>Oluştur</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: 16, fontWeight: '600', color: teacherColors.primary },
  heading: { fontSize: 24, fontWeight: '700', color: teacherColors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: teacherColors.background, borderRadius: 14, padding: spacing.md,
    marginBottom: 10, borderWidth: 1, borderColor: teacherColors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 17, fontWeight: '600', color: teacherColors.text },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: teacherColors.backgroundTint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  codeText: { fontSize: 16, fontWeight: '700', color: teacherColors.primary, letterSpacing: 2 },
  cardMeta: { fontSize: 13, color: teacherColors.textMuted, marginTop: 4 },
  memberCount: { fontSize: 12, color: teacherColors.textSecondary, marginTop: 2 },
  createSection: {
    marginTop: spacing.xl, backgroundColor: teacherColors.background,
    borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: teacherColors.border,
  },
  createTitle: { fontSize: 18, fontWeight: '700', color: teacherColors.text, marginBottom: spacing.md },
  input: {
    backgroundColor: teacherColors.backgroundTint, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: 15, color: teacherColors.text, borderWidth: 1, borderColor: teacherColors.border,
    marginBottom: 10,
  },
  createBtn: {
    backgroundColor: teacherColors.primary, borderRadius: 12, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: 4,
  },
  createBtnText: { color: teacherColors.inverse, fontSize: 16, fontWeight: '700' },
});
