import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressCard } from '../components/ProgressCard';
import { LogsViewer } from '../components/LogsViewer';
import { GenerationJob, JobLog } from '../types/admin.types';
import * as adminApi from '../services/adminApi';
import * as kidsAdminApi from '../services/kidsAdminApi';

export const GenerationJobDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const jobId: string = route.params?.jobId;
  const useKidsApi = route.params?.kidsApi === true;
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    const [jobRes, logsRes] = await Promise.all([
      useKidsApi ? kidsAdminApi.getKidsGenerationJob(jobId) : adminApi.getGenerationJob(jobId),
      useKidsApi ? kidsAdminApi.getKidsJobLogs(jobId) : adminApi.getJobLogs(jobId),
    ]);
    if (jobRes.data) setJob(jobRes.data);
    if (logsRes.data) setLogs(logsRes.data);
    setLoading(false);
    setRefreshing(false);
  }, [jobId, useKidsApi]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!job || !['processing', 'queued'].includes(job.status)) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [job?.status, load]);

  const handleStart = async () => {
    setActionLoading(true);
    const res = useKidsApi ? await kidsAdminApi.startKidsGenerationJob(jobId) : await adminApi.startGenerationJob(jobId);
    setActionLoading(false);
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      load();
    }
  };

  const handleRetry = async () => {
    setActionLoading(true);
    const res = useKidsApi ? await kidsAdminApi.retryKidsGenerationJob(jobId) : await adminApi.retryGenerationJob(jobId);
    setActionLoading(false);
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      load();
    }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading || !job) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Job Detail" />
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title={job.title} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status & Progress */}
        <View style={styles.statusRow}>
          <StatusBadge status={job.status} />
          <View style={[styles.targetBadge, job.content_target === 'kids' && styles.targetKids]}>
            <Text style={styles.targetText}>{job.content_target.toUpperCase()}</Text>
          </View>
          <Text style={styles.meta}>{job.language.toUpperCase()} · {job.tone}</Text>
        </View>

        {(job.status === 'processing' || job.status === 'queued') && (
          <ProgressCard progressPercent={job.progress_percent} currentStep={job.current_step} />
        )}

        {job.error_message && (
          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>Error</Text>
            <Text style={styles.errorText}>{job.error_message}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {job.status === 'draft' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Start Pipeline</Text>}
            </TouchableOpacity>
          )}
          {job.status === 'failed' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Retry</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow label="Topic" value={job.topic} />
        <DetailRow label="Subject" value={job.subject} />
        <DetailRow label="Duration Target" value={job.duration_target_seconds ? `${job.duration_target_seconds}s` : undefined} />
        <DetailRow label="Difficulty" value={job.difficulty} />
        <DetailRow label="Custom Prompt" value={job.custom_prompt} />

        {/* Script */}
        {job.generated_script && (
          <>
            <Text style={styles.sectionTitle}>Generated Script</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText} selectable>{job.generated_script}</Text>
            </View>
          </>
        )}

        {/* Audio */}
        {job.audio_url && (
          <DetailRow label="Audio URL" value={job.audio_url} />
        )}

        {/* Video */}
        {job.final_video_url && (
          <DetailRow label="Final Video URL" value={job.final_video_url} />
        )}

        {/* Logs */}
        <Text style={styles.sectionTitle}>Logs</Text>
        <LogsViewer logs={logs} />
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  targetBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetKids: { backgroundColor: '#FFF3E0' },
  targetText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#C62828',
    marginBottom: 4,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#C62828',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.sm + 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: adminColors.inverse,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  codeBox: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  codeText: {
    fontSize: typography.fontSize.sm,
    color: '#EBEBF5',
    lineHeight: 20,
  },
});
