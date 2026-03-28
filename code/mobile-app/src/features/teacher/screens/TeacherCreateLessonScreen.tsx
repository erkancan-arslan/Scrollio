import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TeacherStackParamList } from '../../../navigation/TeacherNavigator';
import { spacing } from '../../../theme';
import { teacherColors } from '../theme';
import { apiClient } from '../../../services/api/apiClient';

type Props = {
  navigation: NativeStackNavigationProp<TeacherStackParamList, 'TeacherCreateLesson'>;
};

const TONES = ['friendly', 'formal', 'energetic'] as const;
const LANGS = ['tr', 'en'] as const;
const DIFFS = ['easy', 'medium', 'hard'] as const;

export const TeacherCreateLessonScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [tone, setTone] = useState<string>('friendly');
  const [language, setLanguage] = useState<string>('tr');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiClient.get<any[]>('/teacher/classrooms');
      if (res.data) setClassrooms(res.data);
    })();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !topic.trim()) {
      Alert.alert('Hata', 'Başlık ve konu zorunludur.');
      return;
    }
    setLoading(true);

    const res = await apiClient.post<any>('/teacher/lessons', {
      title: title.trim(),
      topic: topic.trim(),
      description: description.trim() || undefined,
      subject: subject.trim() || undefined,
      grade: grade.trim() || undefined,
      tone,
      language,
      difficulty,
      classroomId: classroomId || undefined,
    });

    if (res.error || !res.data) {
      setLoading(false);
      Alert.alert('Hata', res.error || 'Ders oluşturulamadı.');
      return;
    }

    const lessonId = res.data.id;

    const genRes = await apiClient.post<any>(`/teacher/lessons/${lessonId}/generate`);
    setLoading(false);

    if (genRes.error) {
      Alert.alert('Uyarı', 'Ders oluşturuldu fakat pipeline başlatılamadı: ' + genRes.error);
    } else {
      Alert.alert('Başarılı', 'Ders oluşturuldu ve AI üretimi başlatıldı.', [
        { text: 'Tamam', onPress: () => navigation.navigate('TeacherLessonList') },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>{'<'} Geri</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Ders Oluştur</Text>

          <Field label="Başlık *" value={title} onChangeText={setTitle} placeholder="Kesirlerde Toplama" />
          <Field label="Konu *" value={topic} onChangeText={setTopic} placeholder="Payda eşitleme ve toplama" />
          <Field label="Açıklama" value={description} onChangeText={setDescription} multiline placeholder="Dersin kısa açıklaması" />
          <Field label="Branş" value={subject} onChangeText={setSubject} placeholder="Matematik" />
          <Field label="Sınıf" value={grade} onChangeText={setGrade} placeholder="5" />

          <Text style={styles.sectionLabel}>Ton</Text>
          <OptionRow options={TONES} selected={tone} onSelect={setTone} />

          <Text style={styles.sectionLabel}>Dil</Text>
          <OptionRow options={LANGS} selected={language} onSelect={setLanguage} />

          <Text style={styles.sectionLabel}>Zorluk</Text>
          <OptionRow options={DIFFS} selected={difficulty} onSelect={setDifficulty} />

          {classrooms.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Sınıf (Opsiyonel)</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity
                  style={[styles.optionChip, !classroomId && styles.optionChipActive]}
                  onPress={() => setClassroomId(null)}
                >
                  <Text style={[styles.optionText, !classroomId && styles.optionTextActive]}>Yok</Text>
                </TouchableOpacity>
                {classrooms.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.optionChip, classroomId === c.id && styles.optionChipActive]}
                    onPress={() => setClassroomId(c.id)}
                  >
                    <Text style={[styles.optionText, classroomId === c.id && styles.optionTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={teacherColors.inverse} />
            ) : (
              <Text style={styles.btnText}>Oluştur & Başlat</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Field: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean;
}> = ({ label, value, onChangeText, placeholder, multiline }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
      placeholder={placeholder}
      placeholderTextColor={teacherColors.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
    />
  </View>
);

const OptionRow: React.FC<{
  options: readonly string[]; selected: string; onSelect: (v: string) => void;
}> = ({ options, selected, onSelect }) => (
  <View style={styles.optionRow}>
    {options.map((o) => (
      <TouchableOpacity
        key={o}
        style={[styles.optionChip, selected === o && styles.optionChipActive]}
        onPress={() => onSelect(o)}
      >
        <Text style={[styles.optionText, selected === o && styles.optionTextActive]}>
          {o}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: teacherColors.backgroundTint },
  scroll: { padding: spacing.lg, paddingBottom: 60 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: 16, fontWeight: '600', color: teacherColors.primary },
  title: { fontSize: 24, fontWeight: '700', color: teacherColors.text, marginBottom: spacing.lg },
  inputWrap: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: teacherColors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: teacherColors.background,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: teacherColors.text,
    borderWidth: 1,
    borderColor: teacherColors.border,
  },
  sectionLabel: {
    fontSize: 14, fontWeight: '600', color: teacherColors.textSecondary,
    marginBottom: 6, marginTop: 4,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: teacherColors.border, backgroundColor: teacherColors.background,
  },
  optionChipActive: { backgroundColor: teacherColors.primary, borderColor: teacherColors.primary },
  optionText: { fontSize: 13, color: teacherColors.textSecondary },
  optionTextActive: { color: teacherColors.inverse, fontWeight: '600' },
  btn: {
    backgroundColor: teacherColors.primary,
    borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: teacherColors.inverse, fontSize: 16, fontWeight: '700' },
});
