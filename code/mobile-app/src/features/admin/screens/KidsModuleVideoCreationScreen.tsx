import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../../../theme';
import { adminColors } from '../theme';
import { AdminHeader } from '../components/AdminHeader';
import { ReferenceVideo, KidsCatalogTopic } from '../types/admin.types';
import * as adminApi from '../services/adminApi';
import * as kidsAdminApi from '../services/kidsAdminApi';
import type { AdminStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminKidsModuleVideoCreation'>;

export const KidsModuleVideoCreationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'energetic'>('friendly');
  const [ageGroup, setAgeGroup] = useState<'7-9' | '10-12'>('7-9');
  const [customPrompt, setCustomPrompt] = useState('');

  const [catalogTopics, setCatalogTopics] = useState<KidsCatalogTopic[]>([]);
  const [selectedTopicNames, setSelectedTopicNames] = useState<string[]>([]);

  const [kidsRefs, setKidsRefs] = useState<ReferenceVideo[]>([]);
  const [selectedBundleRefIds, setSelectedBundleRefIds] = useState<string[]>([]);
  const [singleRefId, setSingleRefId] = useState('');

  const [lastGroupId, setLastGroupId] = useState<string | null>(null);
  const [lastBundleJobs, setLastBundleJobs] = useState<Array<{ id: string; title: string; reference_video_id: string }>>(
    [],
  );

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [startGroupLoading, setStartGroupLoading] = useState(false);
  const [singleLoading, setSingleLoading] = useState(false);

  const [videoCountStr, setVideoCountStr] = useState('3');
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [lastBatchJobs, setLastBatchJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [lastBatchMeta, setLastBatchMeta] = useState<{
    videoCount: number;
    mascotCount: number;
    totalJobs: number;
  } | null>(null);
  const [batchCreateLoading, setBatchCreateLoading] = useState(false);
  const [batchScriptsLoading, setBatchScriptsLoading] = useState(false);

  const topicTagsPayload = useMemo(
    () => [...new Set(selectedTopicNames.map((n) => n.trim()).filter(Boolean))],
    [selectedTopicNames],
  );

  const loadKidsRefs = useCallback(async () => {
    setLoadingRefs(true);
    const res = await adminApi.listReferenceVideos({ audienceTag: 'kids', limit: 100 });
    if (res.data?.data) {
      const withMascot = res.data.data.filter((r) => r.character_id);
      setKidsRefs(withMascot);
    }
    setLoadingRefs(false);
  }, []);

  const loadCatalogTopics = useCallback(async () => {
    setLoadingTopics(true);
    const res = await kidsAdminApi.listKidsCatalogTopics();
    if (res.data && Array.isArray(res.data)) {
      setCatalogTopics(res.data);
    }
    setLoadingTopics(false);
  }, []);

  useEffect(() => {
    loadKidsRefs();
    loadCatalogTopics();
  }, [loadKidsRefs, loadCatalogTopics]);

  const toggleBundleRef = (id: string) => {
    setSelectedBundleRefIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleTopicName = (name: string) => {
    setSelectedTopicNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleCreateBundle = async () => {
    if (!title.trim() || !topic.trim() || topicTagsPayload.length === 0) {
      Alert.alert('Missing fields', 'Title, lesson topic, and at least one feed topic (from the list) are required.');
      return;
    }
    setBundleLoading(true);
    try {
      const res = await kidsAdminApi.createKidsMascotVideoBundle({
        title: title.trim(),
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        language,
        tone,
        customPrompt: customPrompt.trim() || undefined,
        ageGroup,
        topicTags: topicTagsPayload,
        referenceVideoIds: selectedBundleRefIds.length > 0 ? selectedBundleRefIds : undefined,
      });
      setBundleLoading(false);
      if (res.error) {
        const msg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error);
        Alert.alert('Bundle failed', msg);
        return;
      }
      if (res.data) {
        setLastGroupId(res.data.kidsGenerationGroupId);
        setLastBundleJobs(res.data.jobs);
        Alert.alert(
          'Bundle created',
          `${res.data.jobs.length} job(s) in draft. Tap "Start bundle pipeline" to run script → TTS → merge → publish.`,
        );
      }
    } catch (e) {
      setBundleLoading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const parseVideoCount = (): number | null => {
    const n = parseInt(videoCountStr.trim(), 10);
    if (Number.isNaN(n) || n < 1 || n > 40) return null;
    return n;
  };

  const handleCreateKidsBatch = async () => {
    const n = parseVideoCount();
    if (n === null) {
      Alert.alert('Video count', 'Enter a number from 1 to 40 (how many lesson angles).');
      return;
    }
    if (!title.trim() || !topic.trim() || topicTagsPayload.length === 0) {
      Alert.alert('Missing fields', 'Title, lesson topic, and at least one feed topic are required.');
      return;
    }
    setBatchCreateLoading(true);
    try {
      const res = await kidsAdminApi.createKidsBatchJob({
        videoCount: n,
        title: title.trim(),
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        language,
        tone,
        customPrompt: customPrompt.trim() || undefined,
        ageGroup,
        topicTags: topicTagsPayload,
        referenceVideoIds: selectedBundleRefIds.length > 0 ? selectedBundleRefIds : undefined,
      });
      setBatchCreateLoading(false);
      if (res.error) {
        const msg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error);
        Alert.alert('Batch failed', msg);
        return;
      }
      if (res.data) {
        setLastBatchId(res.data.batch.id);
        setLastBatchJobs(res.data.jobs.map((j) => ({ id: j.id, title: j.title })));
        setLastBatchMeta(res.data.meta);
        Alert.alert(
          'Batch created',
          `${res.data.meta.totalJobs} jobs (${res.data.meta.videoCount} angles × ${res.data.meta.mascotCount} mascots). Tap Start pipeline to begin script generation, or open the batch to track progress.`,
        );
      }
    } catch (e) {
      setBatchCreateLoading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleGenerateKidsBatchScripts = async () => {
    if (!lastBatchId) {
      Alert.alert('No batch', 'Create a batch first.');
      return;
    }
    setBatchScriptsLoading(true);
    try {
      const res = await kidsAdminApi.startKidsBatchPipeline(lastBatchId, {});
      setBatchScriptsLoading(false);
      if (res.error) {
        const msg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error);
        Alert.alert('Scripts', msg);
        return;
      }
      Alert.alert('Started', 'The pipeline is running on the server. Open the batch to watch progress.');
    } catch (e) {
      setBatchScriptsLoading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleOpenKidsBatch = () => {
    if (!lastBatchId) return;
    navigation.navigate('AdminBatchDetail', { batchId: lastBatchId, kidsApi: true });
  };

  const handleStartGroup = async () => {
    if (!lastGroupId) {
      Alert.alert('No group', 'Create a bundle first.');
      return;
    }
    setStartGroupLoading(true);
    try {
      const res = await kidsAdminApi.startKidsMascotGroup(lastGroupId);
      setStartGroupLoading(false);
      if (res.error) {
        const msg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error);
        Alert.alert('Start failed', msg);
        return;
      }
      Alert.alert('Started', 'Pipeline runs on the server. Open a job below to watch progress.', [
        {
          text: 'OK',
          onPress: () => {
            if (lastBundleJobs[0]) {
              navigation.navigate('AdminJobDetail', { jobId: lastBundleJobs[0].id, kidsApi: true });
            }
          },
        },
      ]);
    } catch (e) {
      setStartGroupLoading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleCreateSingleJob = async (andOpen: boolean) => {
    if (!title.trim() || !topic.trim() || !singleRefId) {
      Alert.alert('Missing fields', 'Title, topic, and a mascot reference video are required for a single job.');
      return;
    }
    if (topicTagsPayload.length === 0) {
      Alert.alert('Feed topics', 'Select at least one topic for kids_content.topic_tags (or create a new one).');
      return;
    }
    setSingleLoading(true);
    try {
      const res = await kidsAdminApi.createKidsGenerationJob({
        title: title.trim(),
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        contentTarget: 'kids',
        language,
        tone,
        customPrompt: customPrompt.trim() || undefined,
        referenceVideoId: singleRefId,
        ageGroup,
        topicTags: topicTagsPayload,
      });
      setSingleLoading(false);
      if (res.error) {
        const msg = Array.isArray(res.error) ? res.error.join(', ') : String(res.error);
        Alert.alert('Job failed', msg);
        return;
      }
      if (res.data && andOpen) {
        navigation.navigate('AdminJobDetail', { jobId: res.data.id, kidsApi: true });
      } else if (res.data) {
        Alert.alert('Job created', `Draft job ${res.data.id}. Open job detail to start the pipeline.`, [
          { text: 'Open', onPress: () => navigation.navigate('AdminJobDetail', { jobId: res.data!.id, kidsApi: true }) },
          { text: 'OK' },
        ]);
      }
    } catch (e) {
      setSingleLoading(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdminHeader title="Kids module videos" showBack />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Reference videos: audience <Text style={styles.mono}>kids</Text> + <Text style={styles.mono}>character_id</Text>{' '}
          (bird, cat, dragon). Feed topics must match <Text style={styles.mono}>kids_topics.name</Text> so children who
          follow those topics see the video. Create missing topics below — they are stored in Supabase.
        </Text>

        <Text style={styles.section}>Lesson / script</Text>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Lesson title"
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Topic * (for AI script)</Text>
        <TextInput
          style={styles.input}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g. Photosynthesis"
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g. Science"
          placeholderTextColor={colors.text.tertiary}
        />

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

        <Text style={styles.label}>Custom prompt</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={customPrompt}
          onChangeText={setCustomPrompt}
          placeholder="Optional extra instructions for the script"
          multiline
          numberOfLines={2}
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.section}>Kids feed metadata</Text>
        <Text style={styles.label}>Age group *</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, ageGroup === '7-9' && styles.segmentActive]} onPress={() => setAgeGroup('7-9')}>
            <Text style={[styles.segmentText, ageGroup === '7-9' && styles.segmentTextActive]}>7–9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, ageGroup === '10-12' && styles.segmentActive]} onPress={() => setAgeGroup('10-12')}>
            <Text style={[styles.segmentText, ageGroup === '10-12' && styles.segmentTextActive]}>10–12</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Feed topics * (kids_topics)</Text>
        <Text style={styles.subLabel}>
          Check at least one. Labels must match children&apos;s selected topics in the app. Add rows in Supabase or via API
          if the catalog is empty.
        </Text>
        {loadingTopics ? (
          <ActivityIndicator style={{ marginVertical: spacing.md }} />
        ) : catalogTopics.length === 0 ? (
          <Text style={styles.emptyText}>No topics in database yet. Run the seed migration or insert into kids_topics.</Text>
        ) : (
          <View style={styles.checkboxList}>
            {catalogTopics.map((t) => {
              const on = selectedTopicNames.includes(t.name);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleTopicName(t.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkboxOuter, on && styles.checkboxOuterChecked]}>
                    {on ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                  <View style={styles.checkboxLabelCol}>
                    <Text style={styles.checkboxTitle}>{t.name}</Text>
                    {t.category ? <Text style={styles.checkboxCat}>{t.category}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {topicTagsPayload.length > 0 && (
          <Text style={styles.selectedSummary}>Selected for publish: {topicTagsPayload.join(', ')}</Text>
        )}

        {/* Bundle + batch share mascot selection */}
        <Text style={styles.section}>Mascot bundle (one script × all mascots)</Text>
        <Text style={styles.label}>Mascots (optional — also used for batch below)</Text>
        <Text style={styles.subLabel}>Leave none selected to include every kids reference with a character.</Text>
        {loadingRefs ? (
          <ActivityIndicator style={{ marginVertical: spacing.md }} />
        ) : kidsRefs.length === 0 ? (
          <Text style={styles.emptyText}>No kids mascot references. Upload in Reference library (audience kids + character).</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.refScroll}>
            {kidsRefs.map((rv) => {
              const active = selectedBundleRefIds.includes(rv.id);
              const slug = rv.character_id ? ` (${rv.character_id})` : '';
              return (
                <TouchableOpacity
                  key={rv.id}
                  style={[styles.refChip, active && styles.refChipActive]}
                  onPress={() => toggleBundleRef(rv.id)}
                >
                  <Text style={[styles.refChipText, active && styles.refChipTextActive]} numberOfLines={2}>
                    {rv.title}
                    {slug}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing.sm }]} onPress={() => setSelectedBundleRefIds([])}>
          <Text style={styles.secondaryBtnText}>Clear mascot selection (use all)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateBundle} disabled={bundleLoading}>
          {bundleLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create bundle</Text>}
        </TouchableOpacity>

        {lastGroupId && (
          <View style={styles.groupBox}>
            <Text style={styles.groupLabel}>Last group id</Text>
            <Text style={styles.groupId} selectable>
              {lastGroupId}
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={handleStartGroup} disabled={startGroupLoading}>
              {startGroupLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Start bundle pipeline</Text>
              )}
            </TouchableOpacity>
            {lastBundleJobs.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: spacing.md }]}>Jobs</Text>
                {lastBundleJobs.map((j) => (
                  <TouchableOpacity
                    key={j.id}
                    style={styles.jobLink}
                    onPress={() => navigation.navigate('AdminJobDetail', { jobId: j.id, kidsApi: true })}
                  >
                    <Text style={styles.jobLinkText}>Open job · {j.id.slice(0, 8)}…</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        <Text style={styles.section}>Batch (multiple lesson angles × mascots)</Text>
        <Text style={styles.subLabel}>
          No difficulty tiers. Enter how many distinct lesson angles you want; the server creates that many jobs per
          mascot (e.g. 3 × 3 mascots = 9 jobs). Uses the same title, topic, feed topics, and mascot selection as above.
        </Text>
        <Text style={styles.label}>Number of lesson angles *</Text>
        <TextInput
          style={styles.input}
          value={videoCountStr}
          onChangeText={setVideoCountStr}
          placeholder="1–40"
          keyboardType="number-pad"
          placeholderTextColor={colors.text.tertiary}
        />

        <TouchableOpacity
          style={styles.createBtn}
          onPress={handleCreateKidsBatch}
          disabled={batchCreateLoading}
        >
          {batchCreateLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create batch</Text>}
        </TouchableOpacity>

        {lastBatchId && lastBatchMeta && (
          <View style={styles.groupBox}>
            <Text style={styles.groupLabel}>Last batch</Text>
            <Text style={styles.metaLine}>
              {lastBatchMeta.totalJobs} jobs · {lastBatchMeta.videoCount} angles × {lastBatchMeta.mascotCount} mascots
            </Text>
            <Text style={styles.groupId} selectable>
              {lastBatchId}
            </Text>
            <View style={styles.rowBtns}>
              <TouchableOpacity
                style={[styles.halfBtn, styles.outlineBtn]}
                onPress={handleGenerateKidsBatchScripts}
                disabled={batchScriptsLoading}
              >
                {batchScriptsLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.outlineBtnText}>Start pipeline</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.halfBtn, styles.createBtn]} onPress={handleOpenKidsBatch}>
                <Text style={styles.createBtnText}>Open batch</Text>
              </TouchableOpacity>
            </View>
            {lastBatchJobs.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: spacing.md }]}>Jobs</Text>
                {lastBatchJobs.map((j) => (
                  <TouchableOpacity
                    key={j.id}
                    style={styles.jobLink}
                    onPress={() => navigation.navigate('AdminJobDetail', { jobId: j.id, kidsApi: true })}
                  >
                    <Text style={styles.jobLinkText} numberOfLines={1}>
                      {j.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        {/* Single mascot */}
        <Text style={styles.section}>Single mascot job</Text>
        <Text style={styles.label}>Reference video *</Text>
        {kidsRefs.length === 0 && !loadingRefs ? (
          <Text style={styles.emptyText}>Add a kids reference first.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.refScroll}>
            {kidsRefs.map((rv) => (
              <TouchableOpacity
                key={rv.id}
                style={[styles.refChip, singleRefId === rv.id && styles.refChipActive]}
                onPress={() => setSingleRefId(rv.id)}
              >
                <Text style={[styles.refChipText, singleRefId === rv.id && styles.refChipTextActive]} numberOfLines={2}>
                  {rv.character_id ? `${rv.character_id}: ` : ''}
                  {rv.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.rowBtns}>
          <TouchableOpacity
            style={[styles.halfBtn, styles.outlineBtn]}
            onPress={() => handleCreateSingleJob(false)}
            disabled={singleLoading}
          >
            {singleLoading ? <ActivityIndicator /> : <Text style={styles.outlineBtnText}>Create draft</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.halfBtn, styles.createBtn]} onPress={() => handleCreateSingleJob(true)} disabled={singleLoading}>
            {singleLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create & open</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            loadKidsRefs();
            loadCatalogTopics();
          }}
        >
          <Text style={styles.secondaryBtnText}>Refresh references & topics</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: adminColors.backgroundTint },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  hint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  mono: { fontWeight: typography.fontWeight.semibold, color: adminColors.primary },
  section: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
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
  multiline: { minHeight: 72, textAlignVertical: 'top' },
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
  checkboxList: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  checkboxOuterChecked: {
    borderColor: adminColors.primary,
    backgroundColor: adminColors.primary,
  },
  checkboxMark: { color: adminColors.inverse, fontSize: 14, fontWeight: '700' },
  checkboxLabelCol: { flex: 1 },
  checkboxTitle: { fontSize: typography.fontSize.md, color: colors.text.primary, fontWeight: '600' },
  checkboxCat: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: 2 },
  refScroll: { marginTop: spacing.xs },
  refChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 220,
  },
  refChipActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
  refChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  refChipTextActive: { color: colors.text.inverse },
  emptyText: { color: colors.text.tertiary, paddingVertical: spacing.sm },
  selectedSummary: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  createBtn: {
    backgroundColor: adminColors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createBtnText: {
    color: adminColors.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  secondaryBtnText: {
    color: adminColors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  groupBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupLabel: { fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  metaLine: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  groupId: { fontSize: typography.fontSize.sm, color: colors.text.primary, marginVertical: spacing.xs },
  jobLink: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  jobLinkText: { color: adminColors.primary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  rowBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  halfBtn: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: adminColors.primary,
  },
  outlineBtnText: { color: adminColors.primary, fontWeight: typography.fontWeight.bold },
});
