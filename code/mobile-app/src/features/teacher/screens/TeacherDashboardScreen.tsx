import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherDashboard'>;
};

export const TeacherDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await apiClient.get<any>('/teacher/profile');
      if (res.data) setProfile(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={teacherColors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const cards: { title: string; icon: any; desc: string; route: keyof TeacherStackParamList }[] = [
    { title: 'Referans Video', icon: 'videocam', desc: 'Ders videoları için referans yükleme', route: 'TeacherReferenceVideo' },
    { title: 'Ders Oluştur', icon: 'create', desc: 'Yeni AI destekli ders hazırla', route: 'TeacherCreateLesson' },
    { title: 'Derslerim', icon: 'library', desc: 'Oluşturulan dersler ve durumları', route: 'TeacherLessonList' },
    { title: 'Sınıfım', icon: 'school', desc: 'Sınıf kodu ve öğrenci yönetimi', route: 'TeacherClassroom' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>
          Merhaba, {profile?.name || 'Öğretmen'}
        </Text>
        <Text style={styles.sub}>
          {profile?.school ? `${profile.school} • ` : ''}{profile?.subject || 'Öğretmen Paneli'}
        </Text>

        {profile?.reference_video_status === 'ready' ? (
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color={teacherColors.success} />
            <Text style={styles.statusText}>Referans video hazır</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="warning" size={16} color={teacherColors.warning} />
            <Text style={[styles.statusText, { color: teacherColors.warning }]}>
              Referans video yüklenmedi
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          {cards.map((c) => (
            <TouchableOpacity
              key={c.route}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(c.route as any)}
            >
              <Ionicons name={c.icon} size={32} color={teacherColors.primary} />
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.cardDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  greeting: { fontSize: 26, fontWeight: '700', color: teacherColors.text, marginBottom: 2 },
  sub: { fontSize: 15, color: teacherColors.textMuted, marginBottom: spacing.md },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: teacherColors.success },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: teacherColors.background,
    borderRadius: 16,
    padding: spacing.lg,
    width: '47%',
    borderWidth: 1,
    borderColor: teacherColors.border,
    minHeight: 150,
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: teacherColors.text, marginTop: 10, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: teacherColors.textMuted, lineHeight: 17 },
});
