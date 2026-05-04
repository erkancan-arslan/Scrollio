/**
 * CoreQuizOverlay
 *
 * Full-screen modal that presents a single multiple-choice question drawn
 * from the server. Flow:
 *   1. Loads the first question via `coreQuizApi.getNextQuestion`.
 *   2. User taps an option → `coreQuizApi.submit`.
 *   3. On correct: show explanation + "Continue" (closes the overlay and
 *      signals the parent to refetch the feed so the next level's videos
 *      enter the stream).
 *   4. On wrong: show explanation + "Try another question" (fetches a
 *      fresh question; excluding already-answered ones is handled
 *      server-side via `core_quiz_attempts`).
 *
 * When the server reports an auto-unlock (pool exhausted, etc.) the overlay
 * closes and the parent is told the level was unlocked so it can refetch.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import {
  coreQuizApi,
  QuizLevel,
  QuizQuestionPublic,
  QuizSubmitResult,
  VideoDifficulty,
} from '../../../services/feed/coreQuizApi';
import { AppDispatch } from '../../../store/store';
import { applyXpAward, applyPlaygroundCoins } from '../../profile/store/profileSlice';
import { CoreQuizFeedback } from './CoreQuizFeedback';

const BRAND_ORANGE = '#FF8C42';
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface CoreQuizOverlayResult {
  unlockedLevel?: VideoDifficulty;
  /** True only if the user actually answered correctly (vs. auto-unlock). */
  correct?: boolean;
}

interface Props {
  visible: boolean;
  topic: string;
  level: QuizLevel;
  onClose: (result: CoreQuizOverlayResult) => void;
}

export const CoreQuizOverlay: React.FC<Props> = ({ visible, topic, level, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [question, setQuestion] = useState<QuizQuestionPublic | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<QuizSubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setSelectedOption(null);
    setFeedback(null);

    const res = await coreQuizApi.getNextQuestion(topic, level);
    setLoading(false);

    if (res.error || !res.data) {
      setErrorMessage(res.error || 'Could not load the quiz.');
      return;
    }

    if (res.data.autoUnlock) {
      // Pool exhausted — server already unlocked the next level.
      onCloseRef.current({ unlockedLevel: res.data.unlockedLevel, correct: false });
      return;
    }

    setQuestion(res.data);
  }, [topic, level]);

  useEffect(() => {
    if (!visible) return;
    setQuestion(null);
    setFeedback(null);
    setSelectedOption(null);
    fetchQuestion();
  }, [visible, fetchQuestion]);

  const handleSubmit = async () => {
    if (selectedOption == null || !question || submitting) return;
    setSubmitting(true);
    const res = await coreQuizApi.submit({
      topic,
      level,
      questionId: question.questionId,
      videoId: question.videoId,
      selectedAnswer: selectedOption,
    });
    setSubmitting(false);

    if (res.error || !res.data) {
      setErrorMessage(res.error || 'Could not submit your answer.');
      return;
    }

    const result = res.data;
    setFeedback(result);

    // If correct and XP was awarded, update the in-memory profile state so
    // the Profile tab reflects the new XP/level without a full refetch.
    if (result.correct && result.xpAwarded != null && result.newXp != null && result.newLevel != null) {
      dispatch(applyXpAward({
        xpAwarded: result.xpAwarded,
        newXp: result.newXp,
        newLevel: result.newLevel,
        levelUp: result.levelUp ?? false,
      }));
    }
    if (result.correct && result.playgroundCoins != null && (result.coinsAwarded ?? 0) > 0) {
      dispatch(applyPlaygroundCoins({ playgroundCoins: result.playgroundCoins }));
    }
  };

  const handleContinue = () => {
    if (!feedback) return onClose({});
    if (feedback.correct) {
      onClose({ unlockedLevel: feedback.unlockedLevel, correct: true });
    } else {
      // Try again — fetch another question from the pool.
      fetchQuestion();
    }
  };

  // Prevent dismissing the quiz with the hardware back button — the user
  // has to answer (or the server auto-unlocks).
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        /* block back-dismiss */
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Level-up quiz</Text>
          <Text style={styles.subtitle}>
            {topicLabel(topic)} · {levelLabel(level)}
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={BRAND_ORANGE} />
              <Text style={styles.loadingText}>Preparing your question…</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.loadingBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchQuestion}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : feedback ? (
            <CoreQuizFeedback
              correct={feedback.correct}
              explanation={feedback.explanation}
              onPrimaryAction={handleContinue}
              primaryLabel={feedback.correct ? 'Continue' : 'Try another question'}
              xpAwarded={feedback.xpAwarded}
              levelUp={feedback.levelUp}
              coinsAwarded={feedback.coinsAwarded}
            />
          ) : question ? (
            <>
              <Text style={styles.question}>{question.question}</Text>

              <ScrollView style={styles.optionsList}>
                {question.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => !submitting && setSelectedOption(idx)}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={`Option ${OPTION_LABELS[idx]}: ${option}`}
                    >
                      <View
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLabelText,
                            isSelected && styles.optionLabelTextSelected,
                          ]}
                        >
                          {OPTION_LABELS[idx]}
                        </Text>
                      </View>
                      <Text
                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (selectedOption == null || submitting) && styles.submitBtnDisabled,
                ]}
                disabled={selectedOption == null || submitting}
                onPress={handleSubmit}
                accessibilityRole="button"
                accessibilityLabel="Submit answer"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

// ── small helpers for display ──────────────────────────────────────────────

function topicLabel(topic: string): string {
  if (!topic) return '';
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}
function levelLabel(level: QuizLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#1C1C22',
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  title: {
    color: BRAND_ORANGE,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  question: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 18,
  },
  optionsList: {
    maxHeight: 340,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A32',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 14,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: BRAND_ORANGE,
    backgroundColor: 'rgba(255, 140, 66, 0.15)',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A42',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelSelected: {
    backgroundColor: BRAND_ORANGE,
  },
  optionLabelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  optionLabelTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    color: '#E5E5EA',
    fontSize: 15,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: BRAND_ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND_ORANGE,
  },
  retryText: {
    color: BRAND_ORANGE,
    fontWeight: '600',
  },
});
