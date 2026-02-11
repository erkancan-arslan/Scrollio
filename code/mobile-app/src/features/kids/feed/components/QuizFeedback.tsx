/**
 * QuizFeedback — Shows correct/incorrect feedback after quiz answer
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface QuizFeedbackProps {
  isCorrect: boolean;
  xpEarned?: number;
  correctAnswer?: string;
  onDismiss?: () => void;
}

export const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  isCorrect,
  xpEarned = 0,
  correctAnswer,
  onDismiss,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    if (onDismiss) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [opacity, translateY, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.container,
        isCorrect ? styles.correct : styles.incorrect,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.icon}>{isCorrect ? '🎉' : '😕'}</Text>
      <Text style={styles.title}>
        {isCorrect ? 'Correct!' : 'Not quite...'}
      </Text>
      {xpEarned > 0 && (
        <Text style={styles.xp}>+{xpEarned} XP</Text>
      )}
      {!isCorrect && correctAnswer && (
        <Text style={styles.hint}>Answer: {correctAnswer}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  correct: { backgroundColor: kidsColors.success + '20' },
  incorrect: { backgroundColor: kidsColors.error + '20' },
  icon: { fontSize: 48 },
  title: { ...kidsTypography.heading3, color: kidsColors.text.primary },
  xp: { ...kidsTypography.body, color: kidsColors.xp, fontWeight: '700' },
  hint: { ...kidsTypography.bodySmall, color: kidsColors.text.secondary, fontStyle: 'italic' },
});
