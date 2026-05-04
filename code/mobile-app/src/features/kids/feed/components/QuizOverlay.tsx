/**
 * QuizOverlay — Modal overlay for in-feed quizzes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useAppDispatch } from '../../../../store/hooks';
import { submitQuizThunk } from '../store/feedSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

interface QuizOverlayProps {
  quiz: {
    id: string;
    contentId: string;
    questions: Array<{ id: string; question: string; options: string[] }>;
  };
  result: {
    correct: boolean;
    xpEarned: number;
    playgroundPointsAwarded?: number;
    correctAnswer: string;
    explanation: string | null;
  } | null;
  onDismiss: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_COLORS = ['#4ECDC4', '#FF6B35', '#4D96FF', '#FFD93D', '#C44DFF', '#6BCB77'];

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  quiz,
  result,
  onDismiss,
}) => {
  const dispatch = useAppDispatch();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show first question (single-question quiz flow for now)
  const question = quiz.questions[0];
  if (!question) {
    onDismiss();
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);
    await dispatch(
      submitQuizThunk({
        quizId: quiz.id,
        questionId: question.id,
        selectedAnswers: [selectedOption],
      }),
    );
    setIsSubmitting(false);
  };

  // ── Result View ──
  if (result) {
    return (
      <Modal transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.resultEmoji}>
              {result.correct ? '🎉' : '💪'}
            </Text>
            <Text style={styles.resultTitle}>
              {result.correct ? 'Great job!' : 'Almost!'}
            </Text>
            <Text style={styles.resultXp}>+{result.xpEarned} XP</Text>
            {(result.playgroundPointsAwarded ?? 0) > 0 ? (
              <Text style={styles.resultGamePts}>
                +{result.playgroundPointsAwarded} game points
              </Text>
            ) : null}
            {!result.correct ? (
              <Text style={styles.resultExplanation}>
                The correct answer was: {result.correctAnswer}
                {result.explanation ? `\n\n${result.explanation}` : ''}
              </Text>
            ) : null}
            <KidsThemedButton
              title="Continue Watching"
              onPress={onDismiss}
              style={styles.continueButton}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // ── Question View ──
  return (
    <Modal transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.quizTitle}>Quick Quiz!</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          <ScrollView style={styles.optionsList}>
            {question.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  { borderColor: OPTION_COLORS[idx % OPTION_COLORS.length] },
                  selectedOption === option && {
                    backgroundColor:
                      OPTION_COLORS[idx % OPTION_COLORS.length] + '30',
                  },
                ]}
                onPress={() => setSelectedOption(option)}
                activeOpacity={0.7}
                accessibilityLabel={`Option ${OPTION_LABELS[idx]}: ${option}`}
              >
                <View
                  style={[
                    styles.optionLabel,
                    {
                      backgroundColor:
                        OPTION_COLORS[idx % OPTION_COLORS.length],
                    },
                  ]}
                >
                  <Text style={styles.optionLabelText}>
                    {OPTION_LABELS[idx]}
                  </Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <KidsThemedButton
              title="Submit"
              onPress={handleSubmit}
              disabled={!selectedOption || isSubmitting}
              loading={isSubmitting}
            />
            <TouchableOpacity onPress={onDismiss} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: kidsColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  quizTitle: {
    ...kidsTypography.heading2,
    color: kidsColors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  questionText: {
    ...kidsTypography.heading3,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    ...kidsTypography.body,
    color: kidsColors.text.primary,
    flex: 1,
  },
  actions: {
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    ...kidsTypography.body,
    color: kidsColors.text.muted,
  },
  resultEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    ...kidsTypography.heading1,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  resultXp: {
    ...kidsTypography.heading2,
    color: kidsColors.xp,
    textAlign: 'center',
    marginBottom: 8,
  },
  resultGamePts: {
    ...kidsTypography.body,
    fontWeight: '700',
    color: kidsColors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resultExplanation: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  continueButton: {
    marginTop: 8,
  },
});
