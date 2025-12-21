/**
 * ProfileStats Component
 * Displays user statistics including videos watched, XP, streak, and quiz performance
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Profile } from '../types';

interface ProfileStatsProps {
  profile: Profile;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ profile }) => {
  // Calculate XP needed for next level
  const currentLevelXp = (profile.level - 1) ** 2 * 100;
  const nextLevelXp = profile.level ** 2 * 100;
  const xpInCurrentLevel = profile.xp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const xpProgress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  // Format watch time
  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.totalVideosWatched}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{formatWatchTime(profile.totalWatchTime)}</Text>
          <Text style={styles.statLabel}>Watch Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.totalQuizzesCompleted}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.averageQuizScore.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      {/* XP Progress */}
      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>Experience Points</Text>
          <Text style={styles.xpValue}>
            {xpInCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP
          </Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpProgress, { width: `${Math.min(xpProgress, 100)}%` }]} />
        </View>
        <Text style={styles.xpSubtext}>
          {nextLevelXp - profile.xp} XP to Level {profile.level + 1}
        </Text>
      </View>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakIconContainer}>
          <Text style={styles.streakIcon}>🔥</Text>
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{profile.streakDays} Day Streak</Text>
          <Text style={styles.streakSubtext}>
            Longest: {profile.longestStreak} days
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F3ED',
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  xpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  xpValue: {
    fontSize: 14,
    color: '#FF8C42',
    fontWeight: '600',
  },
  xpBarContainer: {
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#FF8C42',
    borderRadius: 5,
  },
  xpSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#666666',
  },
});
