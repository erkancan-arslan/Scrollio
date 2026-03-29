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
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { StatusBadge } from '../components/StatusBadge';
import { BatchJobDetail } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#2E7D32',
  intermediate: '#E65100',
  advanced: '#6A1B9A',
};

export const BatchJobDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const batchId: string = route.params?.batchId;

  const [detail, setDetail] = useState<BatchJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    const res = await adminApi.getBatchJob(batchId);
    if (res.data) setDetail(res.data);
    setLoading(false);
    setRefreshing(false);
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  // Auto-poll while running
  useEffect(() => {
    if (!detail || detail.batch.status !== 'running') return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [detail?.batch.status, load]);

  const handleStart = async () => {
    setStarting(true);
    const res = await adminApi.startBatchJob(batchId);
    setStarting(false);
    if (res.error) {
      Alert.alert('Error', String(res.error));
    } else {
      load();
    }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Batch Detail" />
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </SafeAreaView>
    );
  }

  const { batch, jobs } = detail;

  const overallProgress = batch.total_jobs > 0
    ? Math.round(((batch.completed_jobs + batch.failed_jobs) / batch.total_jobs) * 100)
    : 0;

  const grouped = (['beginner', 'intermediate', 'advanced'] as const).map((diff) => ({
    difficulty: diff,
    jobs: jobs.filter((j) => j.difficulty === diff),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title={batch.title} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Batch status row */}
        <View style={styles.statusRow}>
          <BatchStatusBadge status={batch.status} />
          <Text style={styles.meta}>
            {batch.content_target.toUpperCase()} · {batch.language.toUpperCase()} · {batch.tone}
          </Text>
        </View>

        {/* Overall progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPct}>{overallProgress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressStat}>
              <Text style={styles.statNum}>{batch.completed_jobs}</Text> completed
            </Text>
            <Text style={styles.progressStat}>
              <Text style={[styles.statNum, { color: '#C62828' }]}>{batch.failed_jobs}</Text> failed
            </Text>
            <Text style={styles.progressStat}>
              <Text style={styles.statNum}>{batch.total_jobs}</Text> total
            </Text>
          </View>
        </View>

        {/* Start button (only when pending) */}
        {batch.status === 'pending' && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} disabled={starting}>
            {starting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.startBtnText}>Start All 15 Pipelines</Text>
            }
          </TouchableOpacity>
        )}

        {/* Jobs grouped by difficulty */}
        {grouped.map(({ difficulty, jobs: diffJobs }) => (
          <View key={difficulty} style={styles.diffGroup}>
            <View style={styles.diffHeader}>
              <View style={[styles.diffDot, { backgroundColor: DIFFICULTY_COLORS[difficulty] }]} />
              <Text style={[styles.diffTitle, { color: DIFFICULTY_COLORS[difficulty] }]}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
              <Text style={styles.diffCount}>{diffJobs.length} videos</Text>
            </View>

            {diffJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => navigation.navigate('AdminJobDetail', { jobId: job.id })}
                activeOpacity={0.7}
              >
                <View style={styles.jobCardTop}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                  <StatusBadge status={job.status} />
                </View>

                {(job.status === 'processing' || job.status === 'queued') && (
                  <View style={styles.jobProgressRow}>
                    <View style={styles.jobProgressTrack}>
                      <View style={[styles.jobProgressFill, { width: `${job.progress_percent}%` }]} />
                    </View>
                    <Text style={styles.jobProgressPct}>{job.progress_percent}%</Text>
                  </View>
                )}

                {job.current_step && job.status === 'processing' && (
                  <Text style={styles.jobStep}>{job.current_step.replace(/_/g, ' ')}</Text>
                )}

                {job.error_message && (
                  <Text style={styles.jobError} numberOfLines={2}>{job.error_message}</Text>
                )}

                <Text style={styles.jobTapHint}>Tap to view details</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const BatchStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: '#E3F2FD', text: '#1565C0', label: 'Pending' },
    running:   { bg: '#FFF3E0', text: '#E65100', label: 'Running' },
    completed: { bg: '#E8F5E9', text: '#2E7D32', label: 'Completed' },
    failed:    { bg: '#FFEBEE', text: '#C62828', label: 'Failed' },
  };
  const c = config[status] ?? config.pending;
  return (
    <View style={[styles.batchBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.batchBadgeText, { color: c.text }]}>{c.label}</Text>
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
  meta: { fontSize: typography.fontSize.sm, color: colors.text.tertiary },
  batchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  batchBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },

  progressCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, fontWeight: typography.fontWeight.semibold },
  progressPct: { fontSize: typography.fontSize.sm, color: adminColors.primary, fontWeight: typography.fontWeight.bold },
  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: adminColors.primary,
    borderRadius: 4,
  },
  progressStats: { flexDirection: 'row', gap: spacing.md },
  progressStat: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  statNum: { fontWeight: typography.fontWeight.bold, color: colors.text.primary },

  startBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  startBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },

  diffGroup: { marginBottom: spacing.lg },
  diffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  diffDot: { width: 10, height: 10, borderRadius: 5 },
  diffTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  diffCount: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },

  jobCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.sm,
  },
  jobProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  jobProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  jobProgressFill: {
    height: '100%',
    backgroundColor: adminColors.primary,
    borderRadius: 2,
  },
  jobProgressPct: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, minWidth: 30 },
  jobStep: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  jobError: {
    fontSize: typography.fontSize.xs,
    color: '#C62828',
    marginTop: 4,
  },
  jobTapHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: 'right',
  },
});
