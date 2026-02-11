/**
 * KidsParentalDashboardScreen — Main parental controls dashboard
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchScreenTimeThunk, fetchActivityThunk } from '../store/parentalSlice';
import { useActiveChild } from '../../shared/hooks/useActiveChild';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

export const KidsParentalDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<{ navigate: (s: string) => void }>();
  const { childProfile } = useActiveChild();
  const { screenTime, activities, isLoading } = useAppSelector((s) => s.kidsParental);

  useEffect(() => {
    dispatch(fetchScreenTimeThunk());
    dispatch(fetchActivityThunk());
  }, [dispatch]);

  if (isLoading && !screenTime) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const usedMinutes = screenTime?.usedMinutesToday ?? 0;
  const limitMinutes = screenTime?.dailyLimitMinutes ?? 60;
  const percentUsed = limitMinutes > 0 ? Math.min(100, Math.round((usedMinutes / limitMinutes) * 100)) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Child Info */}
      <View style={styles.childHeader}>
        <Text style={styles.childName}>{childProfile?.displayName ?? 'Child'}</Text>
        <Text style={styles.childSubtitle}>Parental Dashboard</Text>
      </View>

      {/* Screen Time Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('KidsScreenTime' as never)}
        accessibilityRole="button"
      >
        <Text style={styles.cardIcon}>⏱️</Text>
        <Text style={styles.cardTitle}>Screen Time</Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentUsed}%`, backgroundColor: percentUsed > 80 ? kidsColors.error : kidsColors.success },
            ]}
          />
        </View>
        <Text style={styles.cardValue}>
          {usedMinutes} / {limitMinutes} min today
        </Text>
      </TouchableOpacity>

      {/* Activity Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('KidsParentalActivity' as never)}
        accessibilityRole="button"
      >
        <Text style={styles.cardIcon}>📊</Text>
        <Text style={styles.cardTitle}>Activity Log</Text>
        <Text style={styles.cardValue}>
          {activities.length} recent activities
        </Text>
      </TouchableOpacity>

      {/* Content Safety Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('KidsContentSafety' as never)}
        accessibilityRole="button"
      >
        <Text style={styles.cardIcon}>🛡️</Text>
        <Text style={styles.cardTitle}>Content Safety</Text>
        <Text style={styles.cardValue}>Manage filters and blocked topics</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { padding: 16, paddingBottom: 40 },
  childHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  childName: { ...kidsTypography.heading2, color: kidsColors.text.primary },
  childSubtitle: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 8 },
  cardValue: { ...kidsTypography.body, color: kidsColors.text.secondary },
  progressBarBg: { height: 8, backgroundColor: kidsColors.border, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },
});
