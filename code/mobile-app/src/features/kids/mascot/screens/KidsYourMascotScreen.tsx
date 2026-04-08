/**
 * Your Mascot screen — shows create CTA, live generation progress, or the finished video.
 *
 * Key behaviours fixed here:
 *  - Video pauses when the screen loses focus (prevents double audio when navigating to draw).
 *  - Cancel button aborts the in-flight poll loop via abortActiveGeneration().
 *  - hydrateKidsMascot short-circuits if a video is already ready (no redundant network call).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  hydrateKidsMascot,
  cancelMascotGeneration,
  abortActiveGeneration,
  PIPELINE_STEPS,
} from '../store/mascotSlice';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_W = Math.min(SCREEN_W - 48, 360);
const VIDEO_H = (VIDEO_W * 16) / 9;

type Nav = StackNavigationProp<KidsStackParamList, 'KidsYourMascot'>;

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEP_KEYS = PIPELINE_STEPS.map((s) => s.key);

function currentStepIndex(progressMessage: string): number {
  const match = PIPELINE_STEPS.findIndex((s) => progressMessage.includes(s.label.toLowerCase()) || progressMessage.toLowerCase().includes(s.key));
  return match >= 0 ? match : -1;
}

function resolveActiveStep(activeJobStep: string | null, progressMessage: string): number {
  if (activeJobStep) {
    const idx = STEP_KEYS.indexOf(activeJobStep as typeof STEP_KEYS[number]);
    if (idx >= 0) return idx;
  }
  return currentStepIndex(progressMessage);
}

const StepProgressBar: React.FC<{ activeStep: number }> = ({ activeStep }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  return (
    <View style={stepStyles.container}>
      {PIPELINE_STEPS.map((step, idx) => {
        const done = idx < activeStep;
        const active = idx === activeStep;
        const pending = idx > activeStep;
        return (
          <View key={step.key} style={stepStyles.stepWrap}>
            <Animated.View
              style={[
                stepStyles.dot,
                done && stepStyles.dotDone,
                active && stepStyles.dotActive,
                pending && stepStyles.dotPending,
                active && { opacity: pulseAnim },
              ]}
            >
              {done ? <Text style={stepStyles.checkmark}>✓</Text> : null}
              {active ? <View style={stepStyles.dotInner} /> : null}
            </Animated.View>
            <Text
              style={[
                stepStyles.label,
                done && stepStyles.labelDone,
                active && stepStyles.labelActive,
                pending && stepStyles.labelPending,
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
            {idx < PIPELINE_STEPS.length - 1 && (
              <View style={[stepStyles.connector, done && stepStyles.connectorDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  stepWrap: { alignItems: 'center', flex: 1, position: 'relative' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#e8e0d8',
    backgroundColor: '#f9f4ef',
  },
  dotDone: { backgroundColor: kidsColors.accentGreen, borderColor: kidsColors.accentGreen },
  dotActive: { backgroundColor: kidsColors.primary, borderColor: kidsColors.primary },
  dotPending: { backgroundColor: '#f0ebe5', borderColor: '#d8d0c8' },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  connector: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e0d8d0',
    zIndex: -1,
  },
  connectorDone: { backgroundColor: kidsColors.accentGreen },
  label: { fontSize: 10, textAlign: 'center', color: '#aaa' },
  labelDone: { color: kidsColors.accentGreen, fontWeight: '600' },
  labelActive: { color: kidsColors.primary, fontWeight: '700' },
  labelPending: { color: '#ccc' },
});

// ── Video player ──────────────────────────────────────────────────────────────

const MascotVideoPlayer: React.FC<{ uri: string; isFocused: boolean }> = ({ uri, isFocused }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Pause when screen loses focus (e.g. navigating to draw screen) to prevent double audio
  useEffect(() => {
    try {
      if (isFocused) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      /* noop — player may not be ready */
    }
  }, [isFocused, player]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        player.pause();
        player.release();
      } catch {
        /* already released */
      }
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={playerStyles.video}
      contentFit="contain"
      nativeControls
    />
  );
};

const playerStyles = StyleSheet.create({
  video: {
    width: VIDEO_W,
    height: VIDEO_H,
    borderRadius: 20,
    backgroundColor: '#000',
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export const KidsYourMascotScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();

  const { status, progressMessage, videoUrl, error, activeJobId } = useAppSelector(
    (s) => s.kidsMascot,
  );

  useEffect(() => {
    dispatch(hydrateKidsMascot());
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel mascot creation?',
      'Your drawing will not be saved. You can draw a new one anytime.',
      [
        { text: 'Keep waiting', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            abortActiveGeneration();
            dispatch(cancelMascotGeneration());
          },
        },
      ],
    );
  }, [dispatch]);

  const showGenerating = status === 'generating';
  const showVideo = status === 'ready' && !!videoUrl;
  const showCreate = status === 'none' || status === 'failed';

  // Derive the active step index from the job's current step label embedded in progressMessage
  const activeStepIdx = resolveActiveStep(
    // Extract step key from progressMessage via a simple heuristic
    (() => {
      for (const s of PIPELINE_STEPS) {
        if (progressMessage.toLowerCase().includes(s.key.replace('_', ' ')) ||
            progressMessage.includes(s.label)) {
          return s.key;
        }
      }
      return activeJobId ? null : null;
    })(),
    progressMessage,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Generating state ── */}
      {showGenerating && (
        <View style={styles.generatingCard}>
          <Text style={styles.generatingTitle}>Creating your mascot</Text>
          <Text style={styles.generatingSubtitle}>{progressMessage || 'Working on it…'}</Text>

          <StepProgressBar activeStep={activeStepIdx >= 0 ? activeStepIdx : 0} />

          <Text style={styles.mutedHint}>
            This takes about 2–3 minutes. You can leave this screen — we'll notify you when it's ready.
          </Text>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel mascot creation"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Error state ── */}
      {status === 'failed' && !!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Ready: video ── */}
      {showVideo && videoUrl && (
        <View style={styles.videoSection}>
          <Text style={styles.readyTitle}>Your mascot is ready! 🎉</Text>
          <View style={styles.videoCard}>
            <MascotVideoPlayer uri={videoUrl} isFocused={isFocused} />
          </View>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('KidsMascotDraw')}
            accessibilityRole="button"
            accessibilityLabel="Draw a new mascot"
          >
            <Text style={styles.secondaryBtnText}>Draw a new mascot</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty state ── */}
      {showCreate && (
        <View style={styles.emptySection}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyEmoji}>🎨</Text>
          </View>
          <Text style={styles.emptyTitle}>No mascot yet</Text>
          <Text style={styles.emptySubtitle}>
            Draw a character and we'll turn it into a 3D-style mascot with a welcome video — just for you!
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('KidsMascotDraw')}
            accessibilityRole="button"
            accessibilityLabel="Create your own mascot"
          >
            <Text style={styles.primaryBtnText}>Create your mascot</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kidsColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    flexGrow: 1,
  },

  // ── Generating ──
  generatingCard: {
    backgroundColor: kidsColors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  generatingTitle: {
    ...kidsTypography.heading3,
    color: kidsColors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  generatingSubtitle: {
    ...kidsTypography.body,
    color: kidsColors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  mutedHint: {
    ...kidsTypography.caption,
    color: kidsColors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: kidsColors.border,
  },
  cancelBtnText: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.secondary,
    fontWeight: '600',
  },

  // ── Error ──
  errorBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 20,
  },
  errorTitle: {
    ...kidsTypography.bodySmall,
    color: '#dc2626',
    fontWeight: '700',
    marginBottom: 4,
  },
  errorText: {
    ...kidsTypography.caption,
    color: '#ef4444',
  },

  // ── Video ready ──
  videoSection: {
    alignItems: 'center',
  },
  readyTitle: {
    ...kidsTypography.heading3,
    color: kidsColors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  videoCard: {
    width: VIDEO_W,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },

  // ── Empty / create ──
  emptySection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: kidsColors.accent + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    ...kidsTypography.heading3,
    color: kidsColors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...kidsTypography.body,
    color: kidsColors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    lineHeight: 24,
  },

  // ── Buttons ──
  primaryBtn: {
    backgroundColor: kidsColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: kidsColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: kidsColors.primary,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: kidsColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
