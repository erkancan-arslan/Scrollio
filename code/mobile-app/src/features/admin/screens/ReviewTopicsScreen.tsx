import React, { useState } from 'react';
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
import { BatchJobSummaryJob } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; label: string; description: string }> = {
  beginner:     {
    color: '#2E7D32',
    label: 'Beginner',
    description: 'Foundational concepts — what things ARE. Zero prior knowledge assumed.',
  },
  intermediate: {
    color: '#E65100',
    label: 'Intermediate',
    description: 'How things WORK mechanically — builds on the beginner topics above.',
  },
  advanced:     {
    color: '#6A1B9A',
    label: 'Advanced',
    description: 'Sophisticated mechanisms & professional strategies — builds on both previous levels.',
  },
};

const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

interface EditableJob {
  jobId: string;
  title: string;
  subTopic: string;
}

interface StepData {
  difficulty: Difficulty;
  jobs: EditableJob[];
}

export const ReviewTopicsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const batchId: string = route.params?.batchId;
  const rawJobs: BatchJobSummaryJob[] = route.params?.jobs ?? [];

  // Current step state
  const [currentStep, setCurrentStep] = useState<Difficulty>('beginner');
  const [currentJobs, setCurrentJobs] = useState<EditableJob[]>(
    rawJobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      subTopic: j.suggested_sub_topic ?? j.topic,
    })),
  );

  const [loading, setLoading] = useState(false);

  const updateJob = (jobId: string, field: 'title' | 'subTopic', value: string) => {
    setCurrentJobs((prev) => prev.map((j) => (j.jobId === jobId ? { ...j, [field]: value } : j)));
  };

  // ── Step advance: beginner → intermediate ─────────────────────────────────

  const handleApproveAndNext = async () => {
    const invalid = currentJobs.find((j) => !j.title.trim() || !j.subTopic.trim());
    if (invalid) {
      Alert.alert('Missing fields', 'All titles and topics must be filled in.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.approveAndSuggestNext(
        batchId,
        currentStep as 'beginner' | 'intermediate',
        currentJobs.map((j) => ({ jobId: j.jobId, title: j.title.trim(), subTopic: j.subTopic.trim() })),
      );

      if (res.error || !res.data) {
        Alert.alert('Error', String(res.error ?? 'Unknown error'));
        setLoading(false);
        return;
      }

      // Advance to next step with freshly suggested jobs
      const nextJobs: EditableJob[] = (res.data.jobs ?? []).map((j: any) => ({
        jobId: j.id,
        title: j.title,
        subTopic: j.suggested_sub_topic ?? j.topic,
      }));

      setCurrentStep(res.data.nextDifficulty as Difficulty);
      setCurrentJobs(nextJobs);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // ── Final step: approve advanced → generate scripts ───────────────────────

  const handleFinalApprove = async () => {
    const invalid = currentJobs.find((j) => !j.title.trim() || !j.subTopic.trim());
    if (invalid) {
      Alert.alert('Missing fields', 'All titles and topics must be filled in.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.approveTopics(
        batchId,
        currentJobs.map((j) => ({ jobId: j.jobId, title: j.title.trim(), subTopic: j.subTopic.trim() })),
      );

      if (res.error) {
        Alert.alert('Error', String(res.error));
        setLoading(false);
        return;
      }

      navigation.replace('AdminReviewScripts', { batchId });
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const isLastStep = currentStep === 'advanced';
  const config = DIFFICULTY_CONFIG[currentStep];
  const stepIndex = DIFFICULTY_ORDER.indexOf(currentStep);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Review Topics" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {DIFFICULTY_ORDER.map((d, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            const dc = DIFFICULTY_CONFIG[d];
            return (
              <React.Fragment key={d}>
                <View style={[
                  styles.stepDot,
                  active && { backgroundColor: dc.color, borderColor: dc.color },
                  done && { backgroundColor: dc.color, borderColor: dc.color },
                ]}>
                  {done
                    ? <Text style={styles.stepDotTextDone}>✓</Text>
                    : <Text style={[styles.stepDotText, (active || done) && { color: '#fff' }]}>{i + 1}</Text>
                  }
                </View>
                {i < 2 && (
                  <View style={[styles.stepLine, done && { backgroundColor: DIFFICULTY_CONFIG[DIFFICULTY_ORDER[i]].color }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Current difficulty header */}
        <View style={[styles.diffHeader, { borderLeftColor: config.color }]}>
          <Text style={[styles.diffTitle, { color: config.color }]}>{config.label} Topics</Text>
          <Text style={styles.diffDescription}>{config.description}</Text>
        </View>

        {/* Context note for non-beginner steps */}
        {currentStep !== 'beginner' && (
          <View style={styles.contextBanner}>
            <Text style={styles.contextText}>
              {currentStep === 'intermediate'
                ? 'These topics were suggested based on your approved beginner topics.'
                : 'These topics were suggested based on your approved beginner and intermediate topics.'}
            </Text>
          </View>
        )}

        {/* Editable job cards */}
        {currentJobs.map((job, idx) => (
          <View key={job.jobId} style={styles.card}>
            <Text style={styles.cardIndex}>#{idx + 1}</Text>

            <Text style={styles.fieldLabel}>Video title</Text>
            <TextInput
              style={styles.input}
              value={job.title}
              onChangeText={(v) => updateJob(job.jobId, 'title', v)}
              placeholder="Short video title"
              placeholderTextColor={colors.text.tertiary}
            />

            <Text style={styles.fieldLabel}>Specific topic / concept</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={job.subTopic}
              onChangeText={(v) => updateJob(job.jobId, 'subTopic', v)}
              placeholder="What this video will explain"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={2}
            />
          </View>
        ))}

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: config.color }, loading && styles.actionBtnDisabled]}
          onPress={isLastStep ? handleFinalApprove : handleApproveAndNext}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.actionBtnText}>
                {isLastStep ? 'Approving…' : `Generating ${DIFFICULTY_CONFIG[DIFFICULTY_ORDER[stepIndex + 1]]?.label} topics…`}
              </Text>
            </View>
          ) : (
            <Text style={styles.actionBtnText}>
              {isLastStep
                ? 'Approve Advanced & Generate Scripts'
                : `Approve ${config.label} → Get ${DIFFICULTY_CONFIG[DIFFICULTY_ORDER[stepIndex + 1]]?.label} Topics`}
            </Text>
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

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { fontSize: 13, fontWeight: '700', color: colors.text.tertiary },
  stepDotTextDone: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },

  // Current difficulty header
  diffHeader: {
    borderLeftWidth: 4,
    paddingLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  diffTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  diffDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  contextBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  contextText: {
    fontSize: typography.fontSize.xs,
    color: '#2E7D32',
    lineHeight: 18,
  },

  // Job cards
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIndex: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 52, textAlignVertical: 'top' },

  // Action button
  actionBtn: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
