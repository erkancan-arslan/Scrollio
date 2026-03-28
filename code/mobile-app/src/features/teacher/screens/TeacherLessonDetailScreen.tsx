import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherLessonDetail'>;
  route: RouteProp<TeacherStackParamList, 'TeacherLessonDetail'>;
};

export const TeacherLessonDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: any;

    const load = async () => {
      const res = await apiClient.get<any>(`/teacher/lessons/${lessonId}`);
      if (res.data) {
        setLesson(res.data);
        if (res.data.status === 'published' || res.data.status === 'failed') {
          clearInterval(interval);
        }
      }
      setLoading(false);
    };

    load();
    interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, [lessonId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={teacherColors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Ders bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  const slides: any[] = lesson.slides_data || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.meta}>
          {lesson.subject} • {lesson.grade}. sınıf • {lesson.difficulty}
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Durum:</Text>
          <Text style={[styles.statusValue, { color: lesson.status === 'published' ? '#2E7D32' : lesson.status === 'failed' ? '#C62828' : '#F57F17' }]}>
            {lesson.status.toUpperCase()}
          </Text>
        </View>

        {lesson.status === 'processing' && (
          <View style={styles.progressSection}>
            <Text style={styles.stepText}>Adım: {lesson.current_step || '...'}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${lesson.progress_percent || 0}%` }]} />
            </View>
            <Text style={styles.percentText}>{lesson.progress_percent || 0}%</Text>
          </View>
        )}

        {lesson.error_message && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{lesson.error_message}</Text>
          </View>
        )}

        {slides.length > 0 && (
          <View style={styles.slidesSection}>
            <Text style={styles.slidesTitle}>Slaytlar ({slides.length})</Text>
            {slides.map((s: any, i: number) => (
              <View key={i} style={styles.slideCard}>
                <Text style={styles.slideNum}>#{i + 1}</Text>
                <Text style={styles.slideTitle}>{s.title}</Text>
                {s.bulletPoints?.map((bp: string, j: number) => (
                  <Text key={j} style={styles.bullet}>• {bp}</Text>
                ))}
                {s.videoUrl && <Text style={styles.mediaInfo}>Video ready</Text>}
                {s.audioUrl && !s.videoUrl && <Text style={styles.mediaInfo}>Audio ready</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: 16, fontWeight: '600', color: teacherColors.primary },
  title: { fontSize: 24, fontWeight: '700', color: teacherColors.text, marginBottom: 4 },
  meta: { fontSize: 14, color: teacherColors.textMuted, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  statusLabel: { fontSize: 14, fontWeight: '600', color: teacherColors.textSecondary },
  statusValue: { fontSize: 14, fontWeight: '700' },
  progressSection: { marginBottom: spacing.md },
  stepText: { fontSize: 13, color: teacherColors.textMuted, marginBottom: 4 },
  progressBar: {
    height: 8, backgroundColor: teacherColors.border, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: teacherColors.primary, borderRadius: 4 },
  percentText: { fontSize: 12, color: teacherColors.textMuted, marginTop: 2, textAlign: 'right' },
  errorBox: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: spacing.md },
  errorText: { color: '#C62828', fontSize: 13 },
  slidesSection: { marginTop: spacing.md },
  slidesTitle: { fontSize: 18, fontWeight: '700', color: teacherColors.text, marginBottom: 10 },
  slideCard: {
    backgroundColor: teacherColors.background, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: teacherColors.border,
  },
  slideNum: { fontSize: 12, fontWeight: '700', color: teacherColors.primary, marginBottom: 2 },
  slideTitle: { fontSize: 15, fontWeight: '600', color: teacherColors.text, marginBottom: 4 },
  bullet: { fontSize: 13, color: teacherColors.textSecondary, lineHeight: 19 },
  mediaInfo: { fontSize: 11, color: teacherColors.success, marginTop: 4, fontWeight: '600' },
});
