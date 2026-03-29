import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { BatchJobScriptJob } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

const DIFFICULTY_CONFIG = {
  beginner:     { color: '#2E7D32', label: 'Beginner' },
  intermediate: { color: '#E65100', label: 'Intermediate' },
  advanced:     { color: '#6A1B9A', label: 'Advanced' },
} as const;

type Difficulty = keyof typeof DIFFICULTY_CONFIG;

interface LocalScript {
  job: BatchJobScriptJob;
  editedScript: string;
  approved: boolean;
  approving: boolean;
}

export const ReviewScriptsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const batchId: string = route.params?.batchId;

  const [scripts, setScripts] = useState<LocalScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>('pending');

  const load = useCallback(async () => {
    const res = await adminApi.getBatchScripts(batchId);
    if (res.data) {
      setBatchStatus(res.data.batch.status);
      setScripts((prev) => {
        const prevMap = new Map(prev.map((s) => [s.job.id, s]));
        return (res.data!.jobs ?? []).map((job) => {
          const existing = prevMap.get(job.id);
          return {
            job,
            // Preserve any edits the user has already made; otherwise use latest from server
            editedScript: existing?.editedScript !== undefined && existing.editedScript !== (existing.job.cleaned_narration_text ?? '')
              ? existing.editedScript
              : (job.cleaned_narration_text ?? ''),
            approved: existing?.approved ?? job.script_approved ?? false,
            approving: existing?.approving ?? false,
          };
        });
      });
    }
    setLoading(false);
    setRefreshing(false);
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  // Poll while any script is still being generated
  useEffect(() => {
    const stillGenerating =
      batchStatus === 'pending' ||
      scripts.some((s) => !s.job.cleaned_narration_text && s.job.status !== 'failed');

    if (!stillGenerating) return;

    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [batchStatus, scripts, load]);

  const handleApprove = async (jobId: string) => {
    const local = scripts.find((s) => s.job.id === jobId);
    if (!local) return;

    const finalScript = local.editedScript.trim();
    if (!finalScript) {
      Alert.alert('Empty script', 'The script cannot be empty.');
      return;
    }

    setScripts((prev) => prev.map((s) => s.job.id === jobId ? { ...s, approving: true } : s));

    try {
      // Only send the edited script if it differs from the server version
      const scriptToSend =
        finalScript !== (local.job.cleaned_narration_text ?? '').trim() ? finalScript : undefined;

      const res = await adminApi.approveScript(batchId, jobId, scriptToSend);

      if (res.error) {
        Alert.alert('Error', String(res.error));
        setScripts((prev) => prev.map((s) => s.job.id === jobId ? { ...s, approving: false } : s));
        return;
      }

      setScripts((prev) =>
        prev.map((s) => s.job.id === jobId ? { ...s, approved: true, approving: false } : s),
      );
    } catch (err) {
      setScripts((prev) => prev.map((s) => s.job.id === jobId ? { ...s, approving: false } : s));
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const approvedCount = scripts.filter((s) => s.approved).length;
  const readyCount = scripts.filter((s) => !!s.job.cleaned_narration_text || s.job.status === 'failed').length;
  const generatingCount = scripts.length - readyCount;
  const allApproved = scripts.length > 0 && approvedCount === scripts.length;

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Review Scripts" />
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </SafeAreaView>
    );
  }

  const grouped = (['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((diff) => ({
    difficulty: diff,
    scripts: scripts.filter((s) => s.job.difficulty === diff),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Review Scripts" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status banner */}
        <View style={styles.progressBanner}>
          {generatingCount > 0 ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator size="small" color={adminColors.primary} />
              <Text style={styles.generatingText}>
                Generating {generatingCount} script{generatingCount !== 1 ? 's' : ''}… pull to refresh
              </Text>
            </View>
          ) : (
            <Text style={styles.progressText}>
              {approvedCount} / {scripts.length} approved
            </Text>
          )}
        </View>

        {allApproved && (
          <TouchableOpacity
            style={styles.viewBatchBtn}
            onPress={() => navigation.replace('AdminBatchDetail', { batchId })}
          >
            <Text style={styles.viewBatchBtnText}>All Approved — View Batch Progress</Text>
          </TouchableOpacity>
        )}

        {grouped.map(({ difficulty, scripts: diffScripts }) => {
          if (diffScripts.length === 0) return null;
          const config = DIFFICULTY_CONFIG[difficulty];
          return (
            <View key={difficulty} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.dot, { backgroundColor: config.color }]} />
                <Text style={[styles.sectionTitle, { color: config.color }]}>{config.label}</Text>
                <Text style={styles.sectionCount}>{diffScripts.length} videos</Text>
              </View>

              {diffScripts.map((local, idx) => (
                <ScriptCard
                  key={local.job.id}
                  index={idx + 1}
                  local={local}
                  onEdit={(v) =>
                    setScripts((prev) =>
                      prev.map((s) => s.job.id === local.job.id ? { ...s, editedScript: v } : s),
                    )
                  }
                  onApprove={() => handleApprove(local.job.id)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Script card component ────────────────────────────────────────────────────

interface ScriptCardProps {
  index: number;
  local: LocalScript;
  onEdit: (value: string) => void;
  onApprove: () => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ index, local, onEdit, onApprove }) => {
  const isGenerating = !local.job.cleaned_narration_text && local.job.status !== 'failed';
  const hasFailed = local.job.status === 'failed';
  const hasScript = !!local.job.cleaned_narration_text;

  return (
    <View style={[styles.card, local.approved && styles.cardApproved]}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardIndex}>#{index}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{local.job.title}</Text>
        {local.approved && (
          <View style={styles.approvedBadge}>
            <Text style={styles.approvedBadgeText}>✓ Approved</Text>
          </View>
        )}
      </View>

      {/* Generating state */}
      {isGenerating && (
        <View style={styles.generatingRow}>
          <ActivityIndicator size="small" color={adminColors.primary} />
          <Text style={styles.generatingText}>Generating script…</Text>
        </View>
      )}

      {/* Failed state */}
      {hasFailed && (
        <Text style={styles.errorText}>
          ✕ {local.job.error_message ?? 'Script generation failed'}
        </Text>
      )}

      {/* Script ready — always show it, fully editable */}
      {hasScript && !local.approved && (
        <>
          <Text style={styles.scriptLabel}>Script — edit if needed, then approve:</Text>
          <TextInput
            style={styles.scriptInput}
            value={local.editedScript}
            onChangeText={onEdit}
            multiline
            placeholder="Script text"
            placeholderTextColor={colors.text.tertiary}
            scrollEnabled={false}
          />
          <TouchableOpacity
            style={[styles.approveBtn, local.approving && styles.approveBtnDisabled]}
            onPress={onApprove}
            disabled={local.approving}
          >
            {local.approving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.approveBtnText}>Approve & Generate Video</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Approved — show script read-only */}
      {hasScript && local.approved && (
        <Text style={styles.scriptReadOnly} numberOfLines={4}>
          {local.editedScript}
        </Text>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  progressBanner: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  generatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  generatingText: { fontSize: typography.fontSize.sm, color: colors.text.tertiary },

  viewBatchBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  viewBatchBtnText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },

  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold, flex: 1 },
  sectionCount: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },

  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardApproved: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardIndex: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.bold,
    minWidth: 22,
    marginTop: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  approvedBadgeText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: typography.fontWeight.bold,
  },

  scriptLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scriptInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  scriptReadOnly: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#C62828',
    marginTop: 4,
  },

  approveBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  approveBtnDisabled: { opacity: 0.6 },
  approveBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
