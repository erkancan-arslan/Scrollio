/**
 * KidsDrawingCountdownOverlay
 *
 * Floating top-left badge that shows "next drawing video in HH:MM:SS".
 * - Pulls cycle status from Redux (loaded by useDrawingVideoCycle hook).
 * - Updates every second using server-time drift compensation.
 * - When the countdown hits zero it dispatches a tick and shows the
 *   in-progress label until the job becomes ready.
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
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  computeCycleClock,
  isJobInFlight,
  pollJobThunk,
  refreshCycleStatusThunk,
  tickCycleThunk,
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
  const tickRequestedRef = useRef<string | null>(null);
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

  // When the cycle hits zero (and no job is already in flight) fire one tick.
  // Guard with a ref so we don't spam the endpoint on every render.
  useEffect(() => {
    if (!activeChildProfileId) return;
    if (!clock?.isDue || inFlight || state.isTicking) return;
    if (tickRequestedRef.current === activeChildProfileId) return;
    tickRequestedRef.current = activeChildProfileId;
    dispatch(tickCycleThunk());
  }, [activeChildProfileId, clock?.isDue, inFlight, state.isTicking, dispatch]);

  // Reset the tick guard whenever a new cycle begins.
  useEffect(() => {
    if (clock && !clock.isDue) {
      tickRequestedRef.current = null;
    }
  }, [clock]);

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

  // All hooks must be called before any early return.
  const caption = useMemo(() => {
    if (inFlight || clock?.isDue) {
      return 'Çizimini gerçeğe dönüştürüyoruz…';
    }
    return 'Çizimini gerçeğe dönüştürmeye kalan süre';
  }, [inFlight, clock?.isDue]);

  const label = useMemo(() => {
    if (inFlight) {
      return state.latestJob?.currentStep === 'image_to_video'
        ? 'Animating…'
        : 'Creating…';
    }
    if (clock?.isDue) return 'Starting…';
    return clock ? formatRemaining(clock.remainingMs) : '';
  }, [inFlight, state.latestJob?.currentStep, clock]);

  const animatedOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  if (!activeChildProfileId) return null;
  if (!clock && !inFlight) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
      <View style={styles.timerRow}>
        <Animated.View style={[styles.pill, inFlight ? { opacity: animatedOpacity } : null]}>
          <View style={styles.dot} />
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
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
