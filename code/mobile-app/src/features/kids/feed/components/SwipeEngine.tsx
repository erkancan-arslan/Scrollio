/**
 * SwipeEngine — Wrapper that detects vertical swipe gestures for feed navigation
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_HEIGHT * 0.15;

interface SwipeEngineProps {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
}

export const SwipeEngine: React.FC<SwipeEngineProps> = ({
  onSwipeUp,
  onSwipeDown,
  children,
}) => {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          onSwipeUp?.();
        } else if (gestureState.dy > SWIPE_THRESHOLD) {
          onSwipeDown?.();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
