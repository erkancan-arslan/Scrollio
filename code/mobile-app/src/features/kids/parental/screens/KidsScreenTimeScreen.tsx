/**
 * KidsScreenTimeScreen — Screen time limits and scheduling
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchScreenTimeThunk, updateScreenTimeThunk } from '../store/parentalSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

export const KidsScreenTimeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { screenTime, isLoading } = useAppSelector((s) => s.kidsParental);

  const [dailyLimit, setDailyLimit] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchScreenTimeThunk());
  }, [dispatch]);

  useEffect(() => {
    if (screenTime) {
      setDailyLimit(screenTime.dailyLimitMinutes);
    }
  }, [screenTime]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updateScreenTimeThunk({ dailyLimitMinutes: dailyLimit })).unwrap();
      Alert.alert('Saved', 'Screen time limit updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update screen time.');
    }
    setIsSaving(false);
  };

  if (isLoading && !screenTime) {
    return <LoadingSpinner message="Loading screen time..." />;
  }

  const usedMinutes = screenTime?.usedMinutesToday ?? 0;
  const percentUsed = dailyLimit > 0 ? Math.min(100, Math.round((usedMinutes / dailyLimit) * 100)) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Usage Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today&apos;s Usage</Text>
        <View style={styles.usageCircle}>
          <Text style={styles.usageMinutes}>{usedMinutes}</Text>
          <Text style={styles.usageLabel}>min used</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentUsed}%`, backgroundColor: percentUsed > 80 ? kidsColors.error : kidsColors.success },
            ]}
          />
        </View>
        <Text style={styles.usageCaption}>
          {screenTime?.remainingMinutes ?? 0} minutes remaining
        </Text>
      </View>

      {/* Daily Limit Slider */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Limit</Text>
        <Text style={styles.limitValue}>{dailyLimit} minutes</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>15 min</Text>
          <View style={styles.sliderWrapper}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={15}
              maximumValue={240}
              step={15}
              value={dailyLimit}
              onValueChange={setDailyLimit}
              minimumTrackTintColor={kidsColors.primary}
              maximumTrackTintColor={kidsColors.border}
              thumbTintColor={kidsColors.primary}
            />
          </View>
          <Text style={styles.sliderLabel}>4 hrs</Text>
        </View>

        {/* Quick presets */}
        <View style={styles.presetsRow}>
          {[30, 60, 90, 120].map((mins) => (
            <KidsThemedButton
              key={mins}
              title={mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              variant={dailyLimit === mins ? 'primary' : 'outline'}
              onPress={() => setDailyLimit(mins)}
              style={styles.presetBtn}
              textStyle={styles.presetText}
            />
          ))}
        </View>

        <KidsThemedButton
          title="Save Changes"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </View>

      {/* Schedule */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Allowed Hours</Text>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>Start</Text>
            <Text style={styles.scheduleValue}>{screenTime?.allowedStartTime ?? '08:00'}</Text>
          </View>
          <Text style={styles.scheduleDash}>—</Text>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleLabel}>End</Text>
            <Text style={styles.scheduleValue}>{screenTime?.allowedEndTime ?? '20:00'}</Text>
          </View>
        </View>
        <Text style={{ ...kidsTypography.caption, color: kidsColors.text.muted, textAlign: 'center', marginTop: 12 }}>
          (Schedule editing will be available in a future update)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 12 },
  usageCircle: { alignItems: 'center', marginBottom: 12 },
  usageMinutes: { fontSize: 48, fontWeight: 'bold', color: kidsColors.primary },
  usageLabel: { ...kidsTypography.bodySmall, color: kidsColors.text.muted },
  progressBarBg: { height: 10, backgroundColor: kidsColors.border, borderRadius: 5, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5 },
  usageCaption: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, textAlign: 'center' },
  limitValue: { ...kidsTypography.heading2, color: kidsColors.primary, textAlign: 'center', marginBottom: 12 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sliderLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, width: 40 },
  sliderWrapper: { flex: 1, marginHorizontal: 8 },
  sliderTrack: { height: 6, backgroundColor: kidsColors.border, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: 6, backgroundColor: kidsColors.primary, borderRadius: 3 },
  presetsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  presetBtn: { minWidth: 60, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  presetText: { fontSize: 14 },
  saveButton: { marginTop: 8 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  scheduleItem: { alignItems: 'center' },
  scheduleLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, marginBottom: 4 },
  scheduleValue: { ...kidsTypography.heading3, color: kidsColors.text.primary },
  scheduleDash: { ...kidsTypography.heading3, color: kidsColors.text.muted },
});
