/**
 * KidsPlaygroundScreen — Creative playground with drawing, daily missions, and progress
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchProgressThunk,
  fetchMissionsThunk,
  completeMissionThunk,
  fetchRewardsThunk,
} from '../store/progressionSlice';
import { clearPaths, setSelectedColor, setBrushSize } from '../store/canvasSlice';
import { uploadDrawing } from '../services/drawingApi';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

const COLORS = [
  '#000000', '#FF6B35', '#4ECDC4', '#FFD93D', '#FF6B9D',
  '#C44DFF', '#6BCB77', '#4D96FF', '#FF6B6B', '#FFFFFF',
];

const BRUSH_SIZES = [3, 5, 8, 12, 18];

export const KidsPlaygroundScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { level, xp, xpToNextLevel, progressPercentage, missions, completedMissionIds, isLoading } =
    useAppSelector((s) => s.kidsProgression);
  const { selectedColor, brushSize, paths } = useAppSelector((s) => s.kidsCanvas);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'missions' | 'rewards'>('draw');

  useEffect(() => {
    dispatch(fetchProgressThunk());
    dispatch(fetchMissionsThunk());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchProgressThunk()),
      dispatch(fetchMissionsThunk()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const handleSaveDrawing = async () => {
    if (paths.length === 0) {
      Alert.alert('Empty Canvas', 'Draw something first!');
      return;
    }
    // Convert paths to a simple JSON string as "drawing data"
    const drawingData = JSON.stringify(paths);
    const res = await uploadDrawing(drawingData, `Drawing ${Date.now()}`);
    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      Alert.alert('Saved!', `Drawing saved! +${res.data?.xpEarned ?? 0} XP`);
      dispatch(clearPaths());
      dispatch(fetchProgressThunk());
    }
  };

  const xpPercent = xpToNextLevel > 0 ? Math.round((xp / xpToNextLevel) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={kidsColors.primary} />
      }
    >
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv. {level}</Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.xpLabel}>{xp}/{xpToNextLevel} XP</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {(['draw', 'missions', 'rewards'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'draw' ? '🎨 Draw' : tab === 'missions' ? '🎯 Missions' : '🏆 Rewards'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'draw' && (
        <View style={styles.drawSection}>
          {/* Simple Canvas Placeholder */}
          <View style={styles.canvasArea}>
            <View style={styles.canvasPlaceholder}>
              {paths.length === 0 ? (
                <Text style={styles.canvasHint}>Tap and draw here!</Text>
              ) : (
                <Text style={styles.canvasHint}>{paths.length} strokes drawn</Text>
              )}
            </View>
          </View>

          {/* Color Palette */}
          <View style={styles.paletteRow}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
                onPress={() => dispatch(setSelectedColor(color))}
                accessibilityLabel={`Select color ${color}`}
              />
            ))}
          </View>

          {/* Brush Size */}
          <View style={styles.brushRow}>
            {BRUSH_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.brushOption, brushSize === size && styles.brushSelected]}
                onPress={() => dispatch(setBrushSize(size))}
                accessibilityLabel={`Brush size ${size}`}
              >
                <View
                  style={[
                    styles.brushDot,
                    {
                      width: size * 2,
                      height: size * 2,
                      borderRadius: size,
                      backgroundColor: selectedColor,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.drawActions}>
            <KidsThemedButton
              title="Clear"
              variant="outline"
              onPress={() => dispatch(clearPaths())}
              style={styles.actionBtn}
            />
            <KidsThemedButton
              title="Save Drawing"
              onPress={handleSaveDrawing}
              style={styles.actionBtn}
            />
          </View>
        </View>
      )}

      {activeTab === 'missions' && (
        <View style={styles.missionsSection}>
          <Text style={styles.sectionTitle}>Daily Missions</Text>
          {missions.length === 0 ? (
            <Text style={styles.emptyText}>No missions today. Check back tomorrow!</Text>
          ) : (
            missions.map((mission) => {
              const isDone = completedMissionIds.includes(mission.id);
              return (
                <View key={mission.id} style={[styles.missionCard, isDone && styles.missionDone]}>
                  <View style={styles.missionInfo}>
                    <Text style={styles.missionTitle}>
                      {isDone ? '✅ ' : ''}{mission.title}
                    </Text>
                    <Text style={styles.missionDesc}>{mission.description}</Text>
                    <View style={styles.missionProgress}>
                      <View style={styles.missionBarBg}>
                        <View
                          style={[
                            styles.missionBarFill,
                            {
                              width: `${Math.min(100, ((mission.current ?? 0) / mission.target) * 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.missionProgressText}>
                        {mission.current ?? 0}/{mission.target}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.missionReward}>
                    <Text style={styles.missionXp}>+{mission.xpReward}</Text>
                    <Text style={styles.missionXpLabel}>XP</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {activeTab === 'rewards' && (
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>My Rewards</Text>
          <View style={styles.rewardsGrid}>
            {/* Level milestone badges */}
            {Array.from({ length: level }, (_, i) => i + 1).map((lvl) => (
              <View key={lvl} style={styles.rewardBadge}>
                <Text style={styles.rewardEmoji}>⭐</Text>
                <Text style={styles.rewardLabel}>Level {lvl}</Text>
              </View>
            ))}
            {level === 0 && (
              <Text style={styles.emptyText}>Complete missions to earn rewards!</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { paddingBottom: 100 },
  // Progress Header
  progressHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 48 },
  levelBadge: { backgroundColor: kidsColors.xp, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  levelText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  xpBarContainer: { flex: 1, marginLeft: 12 },
  xpBarBg: { height: 8, backgroundColor: kidsColors.border, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: 8, backgroundColor: kidsColors.xp, borderRadius: 4 },
  xpLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2, textAlign: 'right' },
  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: kidsColors.primary },
  tabText: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  // Draw
  drawSection: { paddingHorizontal: 16 },
  canvasArea: { height: 300, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  canvasPlaceholder: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderRadius: 20, borderWidth: 2, borderColor: kidsColors.border, borderStyle: 'dashed' },
  canvasHint: { ...kidsTypography.body, color: kidsColors.text.muted },
  paletteRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorDotSelected: { borderColor: kidsColors.text.primary, borderWidth: 3 },
  brushRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  brushOption: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  brushSelected: { borderColor: kidsColors.primary },
  brushDot: { /* dynamic */ },
  drawActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  actionBtn: { flex: 1 },
  // Missions
  missionsSection: { paddingHorizontal: 16 },
  sectionTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 12 },
  missionCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  missionDone: { opacity: 0.6 },
  missionInfo: { flex: 1 },
  missionTitle: { ...kidsTypography.body, fontWeight: '700', color: kidsColors.text.primary, marginBottom: 4 },
  missionDesc: { ...kidsTypography.caption, color: kidsColors.text.secondary, marginBottom: 8 },
  missionProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  missionBarBg: { flex: 1, height: 6, backgroundColor: kidsColors.border, borderRadius: 3, overflow: 'hidden' },
  missionBarFill: { height: 6, backgroundColor: kidsColors.success, borderRadius: 3 },
  missionProgressText: { ...kidsTypography.caption, color: kidsColors.text.muted, width: 30 },
  missionReward: { justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  missionXp: { ...kidsTypography.heading3, color: kidsColors.xp },
  missionXpLabel: { ...kidsTypography.caption, color: kidsColors.xp },
  // Rewards
  rewardsSection: { paddingHorizontal: 16 },
  rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rewardBadge: { width: 80, height: 80, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  rewardEmoji: { fontSize: 32 },
  rewardLabel: { ...kidsTypography.caption, color: kidsColors.text.muted, marginTop: 2 },
  emptyText: { ...kidsTypography.body, color: kidsColors.text.muted, fontStyle: 'italic' },
});
