/**
 * XpToast
 *
 * A brief animated pill that shows "+N XP" when the user earns XP from
 * watching a video. Renders absolutely so it floats above the feed.
 * Automatically hides itself after ~2 seconds.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
  xpAwarded: number;
  levelUp?: boolean;
  coinsAwarded?: number;
  /** Called after the exit animation finishes so the parent can clear state. */
  onDismiss: () => void;
}

const SHOW_DURATION_MS = 1800;
const ANIM_IN_MS = 300;
const ANIM_OUT_MS = 400;

export const XpToast: React.FC<Props> = ({ xpAwarded, levelUp, coinsAwarded, onDismiss }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: ANIM_IN_MS, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: ANIM_IN_MS, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: ANIM_OUT_MS, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -12, duration: ANIM_OUT_MS, useNativeDriver: true }),
        ]).start(() => onDismiss());
      }, SHOW_DURATION_MS);
    });
  }, [opacity, translateY, onDismiss]);

  return (
    <Animated.View style={[styles.pill, { opacity, transform: [{ translateY }] }]}>
      <View style={{ flexDirection: 'column', gap: 2 }}>
        <Text style={styles.xpText}>+{xpAwarded} XP</Text>
        {(coinsAwarded ?? 0) > 0 ? (
          <Text style={styles.coinsText}>+{coinsAwarded} playground pts</Text>
        ) : null}
      </View>
      {levelUp && (
        <View style={styles.levelUpBadge}>
          <Text style={styles.levelUpText}>LEVEL UP!</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 140, 66, 0.92)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  coinsText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
  },
  levelUpBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelUpText: {
    color: '#1C1C22',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
