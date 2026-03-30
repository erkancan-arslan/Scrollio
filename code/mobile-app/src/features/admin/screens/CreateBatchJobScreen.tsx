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

export const CreateBatchJobScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preselectedRefId: string | undefined = route.params?.referenceVideoId;

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [contentTarget, setContentTarget] = useState<'core' | 'kids'>('core');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'energetic'>('friendly');
  const [customPrompt, setCustomPrompt] = useState('');
  const [referenceVideoId, setReferenceVideoId] = useState(preselectedRefId || '');
  const [refVideos, setRefVideos] = useState<ReferenceVideo[]>([]);
  const [brainrotVideoId, setBrainrotVideoId] = useState('');
  const [brainrotVideos, setBrainrotVideos] = useState<ReferenceVideo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.listReferenceVideos({ type: 'reference', limit: 100 }).then((res) => {
      if (res.data) setRefVideos(res.data.data);
    });
    adminApi.listReferenceVideos({ type: 'brainrot', limit: 100 }).then((res) => {
      if (res.data) setBrainrotVideos(res.data.data);
    });
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !topic.trim() || !referenceVideoId) {
      Alert.alert('Missing fields', 'Title, topic, and reference video are required.', [
        { text: 'OK' },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.createBatchJob({
        title: title.trim(),
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        contentTarget,
        language,
        tone,
        customPrompt: customPrompt.trim() || undefined,
        referenceVideoId,
        brainrotVideoId: brainrotVideoId || undefined,
      });

      setLoading(false);

      if (res.error || !res.data) {
        const errorMsg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error ?? 'Unknown error');
        Alert.alert('Failed to create batch', errorMsg, [{ text: 'OK' }]);
        return;
      }

      const batchId = res.data.batch.id;
      const jobs = res.data.jobs ?? [];

      // Navigate to topic review — user approves/edits suggested topics before scripts are generated
      navigation.replace('AdminReviewTopics', { batchId, jobs });
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', msg, [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Create Batch (15 Videos)" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Generates 15 videos from one prompt: 5 beginner · 5 intermediate · 5 advanced, each 20 seconds. You'll review the suggested topics, then the scripts, before videos are generated.
          </Text>
        </View>

        <Text style={styles.label}>Batch Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Quantum Physics Series"
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Topic *</Text>
        <TextInput
          style={styles.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. Quantum Mechanics"
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g. Physics"
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Content Target *</Text>
        <View style={styles.segmentRow}>
          {(['core', 'kids'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.segment, contentTarget === t && styles.segmentActive]}
              onPress={() => setContentTarget(t)}
            >
              <Text style={[styles.segmentText, contentTarget === t && styles.segmentTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Language *</Text>
        <View style={styles.segmentRow}>
          {(['tr', 'en'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.segment, language === l && styles.segmentActive]}
              onPress={() => setLanguage(l)}
            >
              <Text style={[styles.segmentText, language === l && styles.segmentTextActive]}>
                {l === 'tr' ? 'Turkish' : 'English'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tone</Text>
        <View style={styles.segmentRow}>
          {(['formal', 'friendly', 'energetic'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.segment, tone === t && styles.segmentActive]}
              onPress={() => setTone(t)}
            >
              <Text style={[styles.segmentText, tone === t && styles.segmentTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Custom Prompt</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={customPrompt}
          onChangeText={setCustomPrompt}
          placeholder="Additional instructions applied to all 15 videos..."
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Reference Video (avatar) *</Text>
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
                <Text
                  style={[styles.refChipText, referenceVideoId === rv.id && styles.refChipTextActive]}
                  numberOfLines={1}
                >
                  {rv.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Brainrot Video (split-screen background)</Text>
        <Text style={styles.hintText}>
          Select a gameplay video to show in the bottom half of the screen. Leave as "None" to skip split-screen.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.refScroll}>
          <TouchableOpacity
            style={[styles.refChip, !brainrotVideoId && styles.refChipActive]}
            onPress={() => setBrainrotVideoId('')}
          >
            <Text style={[styles.refChipText, !brainrotVideoId && styles.refChipTextActive]}>
              None
            </Text>
          </TouchableOpacity>
          {brainrotVideos.map((bv) => (
            <TouchableOpacity
              key={bv.id}
              style={[styles.refChip, brainrotVideoId === bv.id && styles.refChipActive]}
              onPress={() => setBrainrotVideoId(bv.id)}
            >
              <Text
                style={[styles.refChipText, brainrotVideoId === bv.id && styles.refChipTextActive]}
                numberOfLines={1}
              >
                {bv.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Batch & Review Topics</Text>
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
  infoBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: '#0D47A1',
    lineHeight: 20,
  },
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
  refChipText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  refChipTextActive: { color: colors.text.inverse },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  emptyText: { color: colors.text.tertiary, paddingVertical: spacing.sm },
  createBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
