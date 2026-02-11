/**
 * ScreenTimeSlider — Visual slider control for setting screen time limits
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface ScreenTimeSliderProps {
  minutes: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const PRESETS = [15, 30, 60, 90, 120, 180, 240];

export const ScreenTimeSlider: React.FC<ScreenTimeSliderProps> = ({
  minutes,
  onChange,
  min = 15,
  max = 240,
}) => {
  const percentage = max > min ? ((minutes - min) / (max - min)) * 100 : 0;

  const formatTime = (m: number): string => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const remainder = m % 60;
    return remainder > 0 ? `${h}h ${remainder}m` : `${h}h`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.currentValue}>{formatTime(minutes)}</Text>

      {/* Visual track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.labels}>
        <Text style={styles.label}>{formatTime(min)}</Text>
        <Text style={styles.label}>{formatTime(max)}</Text>
      </View>

      {/* Preset buttons */}
      <View style={styles.presetsRow}>
        {PRESETS.filter((p) => p >= min && p <= max).map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.preset, minutes === preset && styles.presetActive]}
            onPress={() => onChange(preset)}
            accessibilityRole="button"
            accessibilityLabel={`Set ${formatTime(preset)}`}
          >
            <Text style={[styles.presetText, minutes === preset && styles.presetTextActive]}>
              {formatTime(preset)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  currentValue: { ...kidsTypography.heading2, color: kidsColors.primary, textAlign: 'center' },
  track: { height: 8, backgroundColor: kidsColors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: kidsColors.primary, borderRadius: 4 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...kidsTypography.caption, color: kidsColors.text.muted },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
  presetActive: {
    backgroundColor: kidsColors.primary,
    borderColor: kidsColors.primary,
  },
  presetText: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '600' },
  presetTextActive: { color: '#FFF' },
});
