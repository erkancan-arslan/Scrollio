import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { ReferenceVideo } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

export const CreateGenerationJobScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preselectedRefId: string | undefined = route.params?.referenceVideoId;

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [contentTarget, setContentTarget] = useState<'core' | 'kids'>('core');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'energetic'>('friendly');
  const [duration, setDuration] = useState('60');
  const [difficulty, setDifficulty] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceVideoId, setReferenceVideoId] = useState(preselectedRefId || '');
  const [refVideos, setRefVideos] = useState<ReferenceVideo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.listReferenceVideos({ limit: 100 }).then((res) => {
      if (res.data) setRefVideos(res.data.data);
    });
  }, []);

  const goToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AdminDashboard' }],
    });
  };

  const handleCreate = async () => {
    if (!title.trim() || !topic.trim() || !referenceVideoId) {
      Alert.alert('Eksik alan', 'Başlık, konu ve referans video zorunludur.', [
        { text: 'Tamam' },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.createGenerationJob({
        title: title.trim(),
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        contentTarget,
        language,
        tone,
        durationTargetSeconds: parseInt(duration, 10) || 60,
        difficulty: difficulty.trim() || undefined,
        customPrompt: customPrompt.trim() || undefined,
        referenceVideoId,
      });

      setLoading(false);

      if (res.error) {
        const errorMsg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error);
        Alert.alert('Job oluşturulamadı', errorMsg, [
          { text: 'Tamam' },
        ]);
        return;
      }

      Alert.alert(
        'Başarılı',
        'Video üretim job\'u oluşturuldu. Dashboard\'a yönlendiriliyorsunuz.',
        [{ text: 'Tamam', onPress: goToDashboard }],
      );
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      Alert.alert('Hata', `İstek başarısız: ${msg}`, [
        { text: 'Tamam' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Create Generation Job" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Quantum Physics Explained" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Topic *</Text>
        <TextInput style={styles.input} value={topic} onChangeText={setTopic} placeholder="e.g. Quantum Mechanics" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Subject</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="e.g. Physics" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Content Target *</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, contentTarget === 'core' && styles.segmentActive]} onPress={() => setContentTarget('core')}>
            <Text style={[styles.segmentText, contentTarget === 'core' && styles.segmentTextActive]}>Core</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, contentTarget === 'kids' && styles.segmentActive]} onPress={() => setContentTarget('kids')}>
            <Text style={[styles.segmentText, contentTarget === 'kids' && styles.segmentTextActive]}>Kids</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Language *</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, language === 'tr' && styles.segmentActive]} onPress={() => setLanguage('tr')}>
            <Text style={[styles.segmentText, language === 'tr' && styles.segmentTextActive]}>Turkish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, language === 'en' && styles.segmentActive]} onPress={() => setLanguage('en')}>
            <Text style={[styles.segmentText, language === 'en' && styles.segmentTextActive]}>English</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Tone</Text>
        <View style={styles.segmentRow}>
          {(['formal', 'friendly', 'energetic'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.segment, tone === t && styles.segmentActive]} onPress={() => setTone(t)}>
              <Text style={[styles.segmentText, tone === t && styles.segmentTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Duration (seconds)</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Difficulty</Text>
        <TextInput style={styles.input} value={difficulty} onChangeText={setDifficulty} placeholder="e.g. beginner, intermediate" placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Custom Prompt</Text>
        <TextInput style={[styles.input, styles.multiline]} value={customPrompt} onChangeText={setCustomPrompt} placeholder="Additional instructions for the AI..." multiline numberOfLines={3} placeholderTextColor={colors.text.tertiary} />

        <Text style={styles.label}>Reference Video *</Text>
        {refVideos.length === 0 ? (
          <Text style={styles.emptyText}>No reference videos. Upload one first.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.refScroll}>
            {refVideos.map((rv) => (
              <TouchableOpacity
                key={rv.id}
                style={[styles.refChip, referenceVideoId === rv.id && styles.refChipActive]}
                onPress={() => setReferenceVideoId(rv.id)}
              >
                <Text style={[styles.refChipText, referenceVideoId === rv.id && styles.refChipTextActive]} numberOfLines={1}>
                  {rv.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
  segmentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  segmentTextActive: { color: colors.text.inverse },
  refScroll: { marginTop: spacing.xs },
  refChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 200,
  },
  refChipActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
  refChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  refChipTextActive: { color: colors.text.inverse },
  emptyText: { color: colors.text.tertiary, paddingVertical: spacing.sm },
  createBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  createBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
