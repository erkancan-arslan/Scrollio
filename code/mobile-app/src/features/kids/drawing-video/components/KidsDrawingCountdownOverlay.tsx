/**
 * KidsDrawingCountdownOverlay
 *
 * Floating top-left badge for the drawing-to-video cycle.
 * Three visual states:
 *   1. ready  — child has never generated, or 48h elapsed: tappable pill
 *               "Click to create your personalized video".
 *   2. inFlight — pipeline running: pulsing "Creating…/Animating…".
 *   3. counting down — generation finished, 48h ticking back to 0.
 *
 * The cycle is strictly child-initiated: nothing auto-fires. Tapping the
 * ready pill dispatches `tickCycleThunk`, which starts a job server-side.
 * The 48h countdown only resets after the pipeline completes (per-child).
 *
 * Render this once at the root of the Kids navigator (above the tab bar).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  computeCycleClock,
  isJobInFlight,
  pollJobThunk,
  refreshCycleStatusThunk,
} from '../store/drawingVideoSlice';

const TICK_MS = 1000;
const STATUS_REFRESH_MS = 60_000;
const JOB_POLL_MS = 5_000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatRemaining(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export const KidsDrawingCountdownOverlay: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const activeChildProfileId = useAppSelector((s) => s.kidsAuth.activeChildProfileId);
  const state = useAppSelector((s) => s.kidsDrawingVideo);

  const onKidsPlusLockPress = useCallback(() => {
    Alert.alert(
      'Scrollio Kids+',
      'You should get Scrollio Kids+ to unlock.',
      [{ text: 'OK', style: 'default' }],
    );
  }, []);

  const [tickNow, setTickNow] = useState(() => Date.now());
  const pulse = useRef(new Animated.Value(0)).current;

  // Refresh status whenever the active child changes, plus a periodic refresh
  // so a job started elsewhere (e.g. cron) eventually appears in the UI.
  useEffect(() => {
    if (!activeChildProfileId) return;
    dispatch(refreshCycleStatusThunk());
    const id = setInterval(() => {
      dispatch(refreshCycleStatusThunk());
    }, STATUS_REFRESH_MS);
    return () => clearInterval(id);
  }, [dispatch, activeChildProfileId]);

  // 1 Hz local tick for the countdown text — doesn't hit the network.
  useEffect(() => {
    const id = setInterval(() => setTickNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const clock = computeCycleClock(state, tickNow);
  const inFlight = isJobInFlight(state.latestJob);

  // Poll the active job until it leaves queued/processing.
  useEffect(() => {
    const job = state.latestJob;
    if (!job || !isJobInFlight(job)) return;
    const id = setInterval(() => {
      dispatch(pollJobThunk(job.id)).then((result) => {
        if (pollJobThunk.fulfilled.match(result)) {
          const next = result.payload;
          if (!isJobInFlight(next)) {
            // Job done (ready or failed) — refresh full status to pick up pinned URL.
            dispatch(refreshCycleStatusThunk());
          }
        }
      });
    }, JOB_POLL_MS);
    return () => clearInterval(id);
  }, [dispatch, state.latestJob]);

  // Subtle pulse animation while we're waiting on the pipeline.
  useEffect(() => {
    if (!inFlight) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [inFlight, pulse]);

  // The cycle is "ready" (tappable) when the child has never generated a
  // video, OR the 48h cycle has elapsed. Treating !lastGeneratedAt as ready
  // makes the very first visit show the call-to-action immediately, even if
  // the cycle row was created earlier with a future cycle_due_at.
  const isReady = !inFlight && (clock?.isDue === true || !state.lastGeneratedAt);

  // Tap handler for the ready pill — opens the drawing canvas in
  // "drawingVideo" mode. The kid draws, taps Create, and the canvas screen
  // calls startFromCanvas which kicks off the mentor-photo → mentor-video
  // pipeline. The 24h pin + 48h cycle reset happen on pipeline completion.
  const onGeneratePress = useCallback(() => {
    if (state.isTicking || inFlight) return;
    (navigation as unknown as {
      navigate: (n: string, params?: Record<string, unknown>) => void;
    }).navigate('KidsMascotDraw', { mode: 'drawingVideo' });
  }, [inFlight, state.isTicking, navigation]);

  const caption = useMemo(() => {
    if (inFlight) return 'Turning your drawing into a real video…';
    if (isReady) return 'Your personalized video is ready to be created';
    return 'Time left to turn your drawing into a real video';
  }, [inFlight, isReady]);

  const label = useMemo(() => {
    if (inFlight) {
      return state.latestJob?.currentStep === 'image_to_video'
        ? 'Animating…'
        : 'Creating…';
    }
    if (state.isTicking) return 'Starting…';
    if (isReady) return 'Click to create your video!';
    return clock ? formatRemaining(clock.remainingMs) : '';
  }, [inFlight, state.latestJob?.currentStep, state.isTicking, isReady, clock]);

  const animatedOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  if (!activeChildProfileId) return null;
  if (!clock && !inFlight) return null;

  // The pill is wrapped in a Touchable only in the ready state; while in flight
  // or counting down, taps are no-ops (TouchableOpacity disabled).
  const pillCore = (
    <Animated.View style={[styles.pill, inFlight ? { opacity: animatedOpacity } : null, isReady ? styles.pillReady : null]}>
      <View style={[styles.dot, isReady ? styles.dotReady : null]} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
      <View style={styles.timerRow}>
        {isReady ? (
          <TouchableOpacity
            onPress={onGeneratePress}
            disabled={state.isTicking}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Click to create your personalized video"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {pillCore}
          </TouchableOpacity>
        ) : (
          pillCore
        )}
        <TouchableOpacity
          style={styles.lockChip}
          onPress={onKidsPlusLockPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Unlock with Scrollio Kids plus"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="lock-closed" size={14} color="#FFD93D" />
          <Text style={styles.lockChipLabel}>Kids+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    maxWidth: '78%',
    zIndex: 100,
    elevation: 10,
  },
  caption: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexShrink: 1,
  },
  pillReady: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dotReady: {
    backgroundColor: '#FFFFFF',
  },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,217,61,0.45)',
  },
  lockChipLabel: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD93D',
    marginRight: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
});
