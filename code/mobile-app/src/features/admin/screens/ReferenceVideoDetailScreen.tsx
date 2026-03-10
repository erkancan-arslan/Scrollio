import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ReferenceVideo } from '../types/admin.types';
import * as adminApi from '../services/adminApi';

export const ReferenceVideoDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const videoId: string = route.params?.videoId;
  const [video, setVideo] = useState<ReferenceVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await adminApi.getReferenceVideo(videoId);
      if (res.data) setVideo(res.data);
      setLoading(false);
    })();
  }, [videoId]);

  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await adminApi.deleteReferenceVideo(videoId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading || !video) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AdminHeader title="Reference Video" />
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title={video.title} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.metaRow}>
          <StatusBadge status={video.status} />
          <Text style={styles.meta}>{video.language.toUpperCase()}</Text>
          {video.audience_tag && <Text style={styles.meta}>{video.audience_tag}</Text>}
        </View>

        {video.public_url && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Video URL</Text>
            <Text style={styles.urlText} selectable>{video.public_url}</Text>
          </View>
        )}

        <DetailRow label="Persona" value={video.persona_name} />
        <DetailRow label="Description" value={video.description} />
        <DetailRow label="Duration" value={video.duration_seconds ? `${video.duration_seconds}s` : undefined} />
        <DetailRow label="Created" value={new Date(video.created_at).toLocaleString()} />

        <TouchableOpacity
          style={styles.createJobBtn}
          onPress={() => navigation.navigate('AdminCreateJob', { referenceVideoId: video.id })}
        >
          <Text style={styles.createJobBtnText}>Create Generation Job</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Video</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  urlText: {
    fontSize: typography.fontSize.sm,
    color: adminColors.primary,
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
  createJobBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  createJobBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  deleteBtn: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
