/**
 * CoreMetrics — Displays key learning metrics in a grid
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface Metric {
  label: string;
  value: number | string;
  icon: string;
}

interface CoreMetricsProps {
  metrics: Metric[];
}

export const CoreMetrics: React.FC<CoreMetricsProps> = ({ metrics }) => {
  return (
    <View style={styles.grid}>
      {metrics.map((m) => (
        <View key={m.label} style={styles.card}>
          <Text style={styles.icon}>{m.icon}</Text>
          <Text style={styles.value}>{m.value}</Text>
          <Text style={styles.label}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  icon: { fontSize: 24, marginBottom: 4 },
  value: { ...kidsTypography.heading3, color: kidsColors.primary },
  label: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
});
