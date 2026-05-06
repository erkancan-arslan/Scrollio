/**
 * KidsTopicPreferencesScreen — choose catalog topics for the active child (kids_child_topics).
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAllTopicsThunk,
  fetchSelectedTopicsThunk,
  selectTopicsThunk,
} from '../../profile/store/profileSlice';
import { resetFeed, fetchFeedThunk } from '../../feed/store/feedSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';

const MIN_ONBOARDING_TOPICS = 1;
const MAX_ONBOARDING_TOPICS = 10;

export const KidsTopicPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<KidsStackParamList, 'KidsTopicPreferences'>>();
  const dispatch = useAppDispatch();
  const { allTopics, selectedTopics, error } = useAppSelector((s) => s.kidsProfile);
  const isOnboarding = route.params?.mode === 'onboarding';

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
      if (next.has(id)) {
        next.delete(id);
      } else if (!isOnboarding || next.size < MAX_ONBOARDING_TOPICS) {
        next.add(id);
      }
      return next;
    });
  }, [isOnboarding]);

  const catalog = useMemo(
    () => [...allTopics].sort((a, b) => a.name.localeCompare(b.name)),
    [allTopics],
  );

  const handleSave = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length < MIN_ONBOARDING_TOPICS) {
      Alert.alert(
        'Pick at least one topic',
        'Choose at least one topic so your feed can show matching videos.',
      );
      return;
    }
    setSaving(true);
    try {
      await dispatch(selectTopicsThunk(ids)).unwrap();
      dispatch(resetFeed());
      dispatch(fetchFeedThunk({ page: 1, limit: 10 }));
      if (isOnboarding) {
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'KidsMainTabs' }] }),
        );
      } else {
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Could not save', typeof e === 'string' ? e : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  // On web, @react-navigation/stack's CardContainer is `position: absolute` and
  // a flex:1 child doesn't always produce a measured height for ScrollView,
  // which leaves the inner div as `overflow: auto` with no bounded height —
  // i.e. unscrollable. Anchoring the wrapper to all four edges on web gives
  // ScrollView a concrete frame so its content scrolls as expected.
  const webWrapperFix =
    Platform.OS === 'web'
      ? ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        } as const)
      : null;

  return (
    <View style={[styles.container, webWrapperFix]}>
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      scrollEnabled
    >
      <Text style={styles.hint}>
        {isOnboarding
          ? `Pick 1–${MAX_ONBOARDING_TOPICS} topics to personalize your first feed.`
          : 'Videos in your feed use these topic names. Pick what you like — you can change them anytime.'}
      </Text>

      {isOnboarding ? (
        <Text style={[styles.counter, selectedIds.size >= MAX_ONBOARDING_TOPICS && styles.counterMax]}>
          {selectedIds.size} / {MAX_ONBOARDING_TOPICS}
          {selectedIds.size >= MAX_ONBOARDING_TOPICS ? ' (max)' : selectedIds.size > 0 ? ' ✓' : ' — pick at least 1'}
        </Text>
      ) : null}

      {error && !bootLoading ? <Text style={styles.errorText}>{error}</Text> : null}

      {bootLoading ? (
        <ActivityIndicator style={styles.spinner} color={kidsColors.primary} />
      ) : catalog.length === 0 ? (
        <Text style={styles.empty}>No topics in the catalog yet. Ask a grown-up to add them.</Text>
      ) : (
        <View style={styles.list}>
          {catalog.map((t) => {
            const on = selectedIds.has(t.id);
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.row, !on && isOnboarding && selectedIds.size >= MAX_ONBOARDING_TOPICS && styles.rowDisabled]}
                onPress={() => toggle(t.id)}
                activeOpacity={0.7}
                disabled={!on && isOnboarding && selectedIds.size >= MAX_ONBOARDING_TOPICS}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.check}>✓</Text> : null}</View>
                <View style={styles.labelCol}>
                  <Text style={styles.title}>{t.name}</Text>
                  {t.category ? <Text style={styles.cat}>{t.category}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, (saving || bootLoading) && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving || bootLoading}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveBtnText}>
            {isOnboarding ? 'Continue' : 'Save'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  hint: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.secondary,
    marginBottom: 16,
  },
  counter: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.secondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  counterMax: {
    color: kidsColors.primary,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  errorText: { ...kidsTypography.bodySmall, color: kidsColors.error, marginBottom: 8 },
  spinner: { marginVertical: 24 },
  empty: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
  list: { gap: 0 },
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
  title: { ...kidsTypography.body, fontWeight: '600', color: kidsColors.text.primary },
  cat: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
  saveBtn: {
    marginTop: 24,
    backgroundColor: kidsColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
