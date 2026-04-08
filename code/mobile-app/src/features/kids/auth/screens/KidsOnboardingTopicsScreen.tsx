/**
 * Kids topic onboarding — pick at least 3 interests before entering the main app (Core T-03 parity).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAllTopicsThunk,
  fetchSelectedTopicsThunk,
  selectTopicsThunk,
} from '../../profile/store/profileSlice';
import { fetchChildrenThunk } from '../store/authSlice';
import { resetFeed, fetchFeedThunk } from '../../feed/store/feedSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

const MIN_TOPICS = 3;

export const KidsOnboardingTopicsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { activeChildProfileId } = useAppSelector((s) => s.kidsAuth);
  const { allTopics, selectedTopics, error } = useAppSelector((s) => s.kidsProfile);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await Promise.all([
          dispatch(fetchAllTopicsThunk()).unwrap(),
          dispatch(fetchSelectedTopicsThunk()).unwrap(),
        ]);
      } catch {
        // errors surface via kidsProfile.error
      } finally {
        if (alive) setBootLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (selectedTopics.length > 0) {
      setSelectedIds(new Set(selectedTopics.map((t) => t.id)));
    }
  }, [selectedTopics]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const catalog = useMemo(
    () => [...allTopics].sort((a, b) => a.name.localeCompare(b.name)),
    [allTopics],
  );

  const canContinue = selectedIds.size >= MIN_TOPICS;

  const handleContinue = async () => {
    if (!activeChildProfileId) {
      Alert.alert('No profile', 'Go back and select who is learning.');
      return;
    }
    if (!canContinue) return;

    const ids = Array.from(selectedIds);
    setSaving(true);
    try {
      await dispatch(selectTopicsThunk(ids)).unwrap();
      dispatch(resetFeed());
      dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
      await dispatch(fetchChildrenThunk()).unwrap();
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'KidsMainTabs' }] }));
    } catch (e) {
      Alert.alert('Could not save', typeof e === 'string' ? e : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.title}>What do you like?</Text>
        <Text style={styles.subtitle}>
          Choose at least {MIN_TOPICS} topics so we can show you fun videos.
        </Text>
        <Text style={[styles.counter, canContinue && styles.counterReady]}>
          {selectedIds.size} selected{canContinue ? ' ✓' : ` / ${MIN_TOPICS} min`}
        </Text>
      </View>

      {error && !bootLoading ? <Text style={styles.errorText}>{error}</Text> : null}

      {bootLoading ? (
        <ActivityIndicator style={styles.spinner} color={kidsColors.primary} />
      ) : catalog.length === 0 ? (
        <Text style={styles.empty}>No topics yet. Ask a grown-up to add some in the catalog.</Text>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {catalog.map((t) => {
            const on = selectedIds.has(t.id);
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.row}
                onPress={() => toggle(t.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.check}>✓</Text> : null}</View>
                <View style={styles.labelCol}>
                  <Text style={styles.rowTitle}>{t.name}</Text>
                  {t.category ? <Text style={styles.cat}>{t.category}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, (!canContinue || saving || bootLoading) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || saving || bootLoading}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: kidsColors.background },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: {
    ...kidsTypography.heading2,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  counter: { fontSize: 14, color: kidsColors.text.muted, fontWeight: '600' },
  counterReady: { color: '#34C759' },
  errorText: {
    ...kidsTypography.bodySmall,
    color: kidsColors.error,
    textAlign: 'center',
    marginHorizontal: 24,
  },
  spinner: { marginVertical: 24 },
  empty: {
    ...kidsTypography.body,
    color: kidsColors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 24,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: kidsColors.border,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: kidsColors.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  boxOn: {
    borderColor: kidsColors.primary,
    backgroundColor: kidsColors.primary,
  },
  check: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  labelCol: { flex: 1 },
  rowTitle: { ...kidsTypography.body, fontWeight: '600', color: kidsColors.text.primary },
  cat: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: kidsColors.background,
    borderTopWidth: 1,
    borderTopColor: kidsColors.border,
  },
  continueBtn: {
    backgroundColor: kidsColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.45 },
  continueText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
