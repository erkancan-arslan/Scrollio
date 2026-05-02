/**
 * CoreQuizFeedback
 *
 * Shown inside CoreQuizOverlay after the user submits an answer. Displays a
 * success / try-again state with the server-provided explanation and a
 * single primary action that either dismisses the overlay (correct) or
 * fetches another question (incorrect).
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BRAND_ORANGE = '#FF8C42';

interface Props {
  correct: boolean;
  explanation?: string;
  primaryLabel: string;
  onPrimaryAction: () => void;
  xpAwarded?: number;
  levelUp?: boolean;
}

export const CoreQuizFeedback: React.FC<Props> = ({
  correct,
  explanation,
  primaryLabel,
  onPrimaryAction,
  xpAwarded,
  levelUp,
}) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          correct ? styles.badgeCorrect : styles.badgeIncorrect,
        ]}
      >
        <Text style={styles.badgeIcon}>{correct ? '✓' : '✕'}</Text>
      </View>

      <Text style={styles.title}>
        {correct ? 'Nice work!' : 'Not quite'}
      </Text>
      <Text style={styles.subtitle}>
        {correct
          ? 'The next level just unlocked for this topic.'
          : "Let's try another question."}
      </Text>

      {correct && xpAwarded != null && (
        <View style={styles.xpRow}>
          <View style={styles.xpPill}>
            <Text style={styles.xpText}>+{xpAwarded} XP</Text>
          </View>
          {levelUp && (
            <View style={styles.levelUpPill}>
              <Text style={styles.levelUpText}>LEVEL UP!</Text>
            </View>
          )}
        </View>
      )}

      {explanation ? <Text style={styles.explanation}>{explanation}</Text> : null}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onPrimaryAction}
        accessibilityRole="button"
      >
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeCorrect: {
    backgroundColor: '#34C759',
  },
  badgeIncorrect: {
    backgroundColor: '#FF6B6B',
  },
  badgeIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  xpPill: {
    backgroundColor: BRAND_ORANGE,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  levelUpPill: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  levelUpText: {
    color: '#1C1C22',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  explanation: {
    color: '#E5E5EA',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: BRAND_ORANGE,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
