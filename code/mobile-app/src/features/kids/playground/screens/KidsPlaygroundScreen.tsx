/**
 * KidsPlaygroundScreen — Creative playground with drawing, daily missions, and progress
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchProgressThunk,
  fetchMissionsThunk,
} from '../store/progressionSlice';
import {
  clearPaths,
  setSelectedColor,
  setBrushSize,
  setEraser,
} from '../store/canvasSlice';
import { uploadDrawing, generateMentor, type GenerateMentorResponse } from '../services/drawingApi';
import { exportCanvasToPng, type ViewShotRef } from '../utils/exportCanvas';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { UndoRedoControls } from '../components/UndoRedoControls';

const COLORS = [
  '#000000', '#FF6B35', '#4ECDC4', '#FFD93D', '#FF6B9D',
  '#C44DFF', '#6BCB77', '#4D96FF', '#FF6B6B', '#FFFFFF',
];

const BRUSH_SIZES = [3, 5, 8, 12, 18];
const MAX_CANVAS_WIDTH = 400;
const CANVAS_ASPECT = 300 / 400; // height/width

type DrawPhase = 'draw' | 'generating' | 'mentorReady';

export const KidsPlaygroundScreen: React.FC = () => {
  const { width: windowWidth } = useWindowDimensions();
  const canvasWidth = Math.min(MAX_CANVAS_WIDTH, Math.max(200, windowWidth - 32));
  const canvasHeight = Math.round(canvasWidth * CANVAS_ASPECT);

  const dispatch = useAppDispatch();
  const {
    level,
    xp,
    xpToNextLevel,
    playgroundPoints,
    missions,
    completedMissionIds,
    isLoading,
  } = useAppSelector((s) => s.kidsProgression);
  const { selectedColor, brushSize, paths, isEraser } = useAppSelector((s) => s.kidsCanvas);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'missions' | 'rewards'>('draw');
  const [drawPhase, setDrawPhase] = useState<DrawPhase>('draw');
  const [mentorResult, setMentorResult] = useState<GenerateMentorResponse | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);
  const canvasRef = useRef<View>(null);
  const viewShotRef = useRef<ViewShotRef>(null);

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

  const handleCreateMentor = useCallback(async () => {
    if (paths.length === 0) {
      Alert.alert('Empty Canvas', 'Draw something first!');
      return;
    }
    setDrawError(null);
    setDrawPhase('generating');
    try {
      const dataUrl = await exportCanvasToPng({
        paths,
        width: canvasWidth,
        height: canvasHeight,
        viewShotRef,
      });
      if (!dataUrl) {
        setDrawError('Could not export drawing.');
        setDrawPhase('draw');
        return;
      }
      const res = await generateMentor(dataUrl);
      if (res.error || !res.data) {
        const message = res.status === 408
          ? 'Request timeout. Check your connection and try again.'
          : (res.error ?? 'Something went wrong. Try again.');
        setDrawError(message);
        setDrawPhase('draw');
        return;
      }
      setMentorResult(res.data);
      setDrawPhase('mentorReady');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setDrawError(msg);
      setDrawPhase('draw');
    }
  }, [paths, canvasWidth, canvasHeight]);

  const handleBackToDraw = useCallback(() => {
    setDrawPhase('draw');
    setMentorResult(null);
    setDrawError(null);
  }, []);

  const xpPercent = xpToNextLevel > 0 ? Math.round((xp / xpToNextLevel) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={activeTab !== 'draw'}
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
        <View style={styles.playgroundPtsBadge}>
          <Text style={styles.playgroundPtsLabel}>🎮</Text>
          <Text style={styles.playgroundPtsValue}>{playgroundPoints}</Text>
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
          {drawPhase === 'generating' && (
            <View style={styles.generatingBlock}>
              <LoadingSpinner message="Creating your mentor in Pixar style…" />
            </View>
          )}

          {drawPhase === 'mentorReady' && mentorResult && (
            <View style={styles.mentorReadyBlock}>
              <Text style={styles.mentorTitle}>Your mentor is ready!</Text>
              <Image
                source={{ uri: mentorResult.characterImageUrl }}
                style={[styles.mentorImage, { width: canvasWidth, height: canvasHeight }]}
                resizeMode="contain"
                accessibilityLabel="Generated Pixar-style character"
              />
              <KidsThemedButton
                title="Draw again"
                variant="outline"
                onPress={handleBackToDraw}
                style={styles.mentorAction}
              />
            </View>
          )}

          {drawPhase === 'draw' && (
            <>
              <View style={[styles.canvasArea, { minHeight: canvasHeight }]}>
                {Platform.OS === 'web' ? (
                  <DrawingCanvas
                    width={canvasWidth}
                    height={canvasHeight}
                    canvasRef={canvasRef}
                  />
                ) : (
                  <ViewShot
                    ref={viewShotRef}
                    options={{ format: 'png', result: 'data-uri', width: canvasWidth, height: canvasHeight }}
                    style={{ width: canvasWidth, height: canvasHeight }}
                    collapsable={false}
                  >
                    <DrawingCanvas
                      width={canvasWidth}
                      height={canvasHeight}
                      canvasRef={canvasRef}
                    />
                  </ViewShot>
                )}
              </View>
              {drawError ? (
                <Text style={styles.drawErrorText}>{drawError}</Text>
              ) : null}
              <UndoRedoControls />
              <View style={styles.paletteRow}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      selectedColor === color && !isEraser && styles.colorDotSelected,
                    ]}
                    onPress={() => {
                      dispatch(setSelectedColor(color));
                      dispatch(setEraser(false));
                    }}
                    accessibilityLabel={`Select color ${color}`}
                  />
                ))}
              </View>
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
                          backgroundColor: isEraser ? kidsColors.border : selectedColor,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.eraserBtn, isEraser && styles.eraserBtnActive]}
                  onPress={() => dispatch(setEraser(!isEraser))}
                  accessibilityLabel="Eraser"
                  accessibilityRole="button"
                >
                  <Text style={styles.eraserText}>Eraser</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.drawActions}>
                <KidsThemedButton
                  title="Clear"
                  variant="outline"
                  onPress={() => dispatch(clearPaths())}
                  style={styles.actionBtn}
                />
                <KidsThemedButton
                  title="Save Drawing"
                  variant="outline"
                  onPress={handleSaveDrawing}
                  style={styles.actionBtn}
                />
                <KidsThemedButton
                  title="Create my mentor"
                  onPress={handleCreateMentor}
                  style={styles.actionBtn}
                />
              </View>
            </>
          )}
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
  playgroundPtsBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    minWidth: 44,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
  playgroundPtsLabel: { fontSize: 12 },
  playgroundPtsValue: {
    ...kidsTypography.bodySmall,
    fontWeight: '800',
    color: kidsColors.primary,
  },
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
  eraserBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 2, borderColor: kidsColors.border, justifyContent: 'center' },
  eraserBtnActive: { borderColor: kidsColors.primary, backgroundColor: kidsColors.primary + '15' },
  eraserText: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600' },
  generatingBlock: { minHeight: 280, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mentorReadyBlock: { marginBottom: 16, alignItems: 'center' },
  mentorTitle: { ...kidsTypography.heading3, color: kidsColors.text.primary, marginBottom: 12 },
  mentorImage: { borderRadius: 20, backgroundColor: kidsColors.border },
  mentorAction: { marginTop: 16, minWidth: 160 },
  drawErrorText: { ...kidsTypography.caption, color: kidsColors.error ?? '#B00020', marginBottom: 8, textAlign: 'center' },
  drawActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  actionBtn: { minWidth: 100, flex: 1 },
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
