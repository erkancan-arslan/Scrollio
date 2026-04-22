/**
 * KidsContentSafetyScreen — Content filtering and safety settings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchContentFiltersThunk, updateContentFiltersThunk } from '../store/parentalSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy Only', description: 'Simple content suitable for younger kids' },
  { value: 'medium', label: 'Up to Medium', description: 'Moderate difficulty included' },
  { value: 'hard', label: 'All Levels', description: 'Including challenging content' },
];

export const KidsContentSafetyScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { contentFilters, isLoading } = useAppSelector((s) => s.kidsParental);

  const [safeSearch, setSafeSearch] = useState(true);
  const [maxDifficulty, setMaxDifficulty] = useState('hard');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchContentFiltersThunk());
  }, [dispatch]);

  useEffect(() => {
    if (contentFilters) {
      setSafeSearch(contentFilters.safeSearchEnabled);
      setMaxDifficulty(contentFilters.maxDifficulty);
    }
  }, [contentFilters]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(
        updateContentFiltersThunk({
          safeSearchEnabled: safeSearch,
          maxDifficulty,
        }),
      ).unwrap();
      Alert.alert('Saved', 'Content filters updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update filters.');
    }
    setIsSaving(false);
  };

  if (isLoading && !contentFilters) {
    return <LoadingSpinner message="Loading filters..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Safe Search */}
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.cardTitle}>Safe Search</Text>
            <Text style={styles.cardDesc}>
              Filter out potentially inappropriate content
            </Text>
          </View>
          <Switch
            value={safeSearch}
            onValueChange={setSafeSearch}
            trackColor={{ false: kidsColors.border, true: kidsColors.success + '80' }}
            thumbColor={safeSearch ? kidsColors.success : '#CCC'}
          />
        </View>
      </View>

      {/* Difficulty Level */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Maximum Difficulty</Text>
        <Text style={styles.cardDesc}>
          Control the difficulty level of content shown
        </Text>
        <View style={styles.optionsList}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <KidsThemedButton
              key={option.value}
              title={option.label}
              variant={maxDifficulty === option.value ? 'primary' : 'outline'}
              onPress={() => setMaxDifficulty(option.value)}
              style={styles.optionBtn}
            />
          ))}
        </View>
      </View>

      {/* Blocked Topics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Blocked Topics</Text>
        <Text style={styles.cardDesc}>
          {contentFilters?.blockedTopicIds.length ?? 0} topics are currently blocked.
        </Text>
        <View style={styles.topicsPlaceholder}>
          <Text style={styles.topicsPlaceholderText}>Topic selection interface will be integrated with the main topic directory in an upcoming update.</Text>
        </View>
      </View>

      {/* Save */}
      <KidsThemedButton
        title="Save Filters"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving}
        style={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchInfo: { flex: 1, marginRight: 12 },
  cardTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 4 },
  cardDesc: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary },
  optionsList: { marginTop: 12, gap: 8 },
  optionBtn: { width: '100%' },
  topicsPlaceholder: { marginTop: 16, padding: 16, backgroundColor: kidsColors.background, borderRadius: 12, alignItems: 'center' },
  topicsPlaceholderText: { ...kidsTypography.caption, color: kidsColors.text.muted, textAlign: 'center', fontStyle: 'italic' },
  saveButton: { marginTop: 8 },
});
