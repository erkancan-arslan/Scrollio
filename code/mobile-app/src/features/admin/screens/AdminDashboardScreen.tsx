import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { GenerationJobCard } from '../components/GenerationJobCard';
import { AdminStats, GenerationJob } from '../types/admin.types';
import * as adminApi from '../services/adminApi';
import { secureStorage } from '../../../services/storage/secureStorage';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);

  const load = useCallback(async () => {
    const { accessToken } = await secureStorage.getSession();
    if (!accessToken) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const [statsRes, jobsRes] = await Promise.all([
        adminApi.getAdminStats(),
        adminApi.listGenerationJobs({ limit: 5 }),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403 ||
          jobsRes.status === 401 || jobsRes.status === 403) {
        setAuthError(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (statsRes.data) setStats(statsRes.data);
      if (jobsRes.data) setRecentJobs(jobsRes.data.data);
    } catch (err) {
      console.error('[Admin Dashboard]', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (authError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Admin Dashboard" showBack />
        <View style={styles.authGate}>
          <Text style={styles.authIcon}>🔒</Text>
          <Text style={styles.authTitle}>Sign in required</Text>
          <Text style={styles.authMessage}>
            Please sign in with an admin account first, then come back to the Admin panel.
          </Text>
          <TouchableOpacity
            style={styles.authBtn}
            onPress={() => navigation.navigate('AdminSignIn')}
          >
            <Text style={styles.authBtnText}>Admin girişi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Admin Dashboard" showBack />
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Admin Dashboard" showBack={true} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          <StatCard label="Reference Videos" value={stats?.totalReferenceVideos ?? 0} color="#1565C0" />
          <StatCard label="Total Jobs" value={stats?.totalJobs ?? 0} color={adminColors.primary} />
          <StatCard label="Processing" value={stats?.processingJobs ?? 0} color="#E65100" />
          <StatCard label="Published" value={stats?.publishedJobs ?? 0} color="#2E7D32" />
          <StatCard label="Failed" value={stats?.failedJobs ?? 0} color="#C62828" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AdminUploadReferenceVideo')}
          >
            <Text style={styles.actionBtnText}>Upload Reference Video</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={() => navigation.navigate('AdminCreateJob')}
          >
            <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Create Job</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnBatch]}
          onPress={() => navigation.navigate('AdminCreateBatch')}
        >
          <Text style={styles.actionBtnText}>Create Batch (15 Videos)</Text>
        </TouchableOpacity>

        {/* Recent Jobs */}
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        {recentJobs.length === 0 ? (
          <Text style={styles.emptyText}>No jobs yet. Create your first generation job.</Text>
        ) : (
          recentJobs.map((job) => (
            <GenerationJobCard
              key={job.id}
              job={job}
              onPress={() => navigation.navigate('AdminJobDetail', { jobId: job.id })}
            />
          ))
        )}

        {recentJobs.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('AdminJobsList')}>
            <Text style={styles.seeAll}>See all jobs →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: adminColors.background,
    borderRadius: 12,
    padding: spacing.md,
    minWidth: '30%',
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.sm + 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: adminColors.background,
    borderWidth: 1,
    borderColor: adminColors.primary,
  },
  actionBtnBatch: {
    marginTop: spacing.xs,
    backgroundColor: '#6A1B9A',
  },
  actionBtnText: {
    color: adminColors.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  actionBtnTextSecondary: {
    color: adminColors.primary,
  },
  emptyText: {
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  seeAll: {
    color: adminColors.primary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
    paddingVertical: spacing.sm,
  },
  authGate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  authIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  authTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  authMessage: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  authBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
  },
  authBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
