import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAppDispatch } from '../../../../store/hooks';
import { submitAnswer, toggleLanguage as toggleLangAction } from '../../store/playgroundSlice';
import { SwipeableCardStack } from '../../components/SwipeableCardStack';
import { colors, spacing } from '../../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { BaseSession, GameResult } from '../../platform/types';
import { InfiniteFlowState } from './types';
import { INFINITE_FLOW_QUESTIONS_ENGLISH, INFINITE_FLOW_QUESTIONS_TURKISH } from '../../data/infiniteFlowQuestions';

// Props passed from PlaygroundGameShell
interface InfiniteFlowScreenProps {
    session: BaseSession;
    state: InfiniteFlowState;
    dispatchGameAction: (action: any) => void;
    onGameOver: (result: GameResult) => void;
    onExit: () => void;
}

const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const InfiniteFlowScreen: React.FC<InfiniteFlowScreenProps> = ({ session, state, dispatchGameAction, onGameOver, onExit }) => {
    const dispatch = useAppDispatch();

    // Local state for timer (ephemeral UI state, not persisted in Redux for perf/simplicity)
    const [timer, setTimer] = useState(10);

    // We derive questions based on seed in state
    const shuffledQuestions = useMemo(() => {
        const sourceData = state.language === 'tr' ? INFINITE_FLOW_QUESTIONS_TURKISH : INFINITE_FLOW_QUESTIONS_ENGLISH;
        return shuffleArray(sourceData);
    }, [state.shuffledQuestionsSeed, state.language]);
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    // Schedule the dispatch for after the state update completes
                    // to avoid "Cannot update component while rendering another"
                    setTimeout(() => handleWrongAnswer(), 0);
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [dispatch]); // Dependencies simplified

    const handleWrongAnswer = () => {
        dispatch(submitAnswer({ isCorrect: false }));
        // No need to manually call onGameOver, store handles it
    };

    const handleCorrectAnswer = () => {
        dispatch(submitAnswer({ isCorrect: true }));
    };

    const handleSwipe = (item: any, direction: 'left' | 'right') => {
        setTimer(10);
        const isTrue = direction === 'right';
        const correct = item.answer === isTrue;

        if (correct) {
            handleCorrectAnswer();
        } else {
            handleWrongAnswer();
        }
    };

    const toggleLanguage = () => {
        dispatch(toggleLangAction());
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* A. Top HUD */}
            <View style={styles.hud}>
                <TouchableOpacity onPress={onExit} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>

                <View style={styles.modeIndicator}>
                    <Text style={styles.modeText}>Infinite Flow</Text>
                </View>

                <View style={styles.statsMini}>
                    <View style={[styles.coinBadge, { backgroundColor: colors.error }]}>
                        <Ionicons name="heart" size={14} color="white" />
                        <Text style={styles.streakMiniText}>{state.lives}</Text>
                    </View>
                    <View style={[styles.coinBadge, { marginLeft: 0 }]}>
                        <Ionicons name="flame" size={14} color={colors.primary} />
                        <Text style={styles.streakMiniText}>{state.streak}</Text>
                    </View>
                    <View style={[styles.coinBadge, { marginLeft: 8, backgroundColor: timer <= 3 ? colors.error : '#333' }]}>
                        <Ionicons name="timer-outline" size={14} color="white" />
                        <Text style={styles.streakMiniText}>{timer}s</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.coinBadge, { marginLeft: 8, backgroundColor: '#444' }]}
                        onPress={toggleLanguage}
                    >
                        <Ionicons name="language" size={14} color="white" />
                        <Text style={styles.streakMiniText}>{state.language.toUpperCase()}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* B. Card Stack */}
            <View style={styles.stackArea}>
                <SwipeableCardStack
                    data={shuffledQuestions}
                    onSwipeLeft={(item) => handleSwipe(item, 'left')}
                    onSwipeRight={(item) => handleSwipe(item, 'right')}
                    onFinished={() => {
                        // Deck finished - maybe reload or game over?
                        // For Infinite Flow, we usually just reshuffle or end.
                        // Let's just end for MVP safety, or reshuffle in future.
                        onGameOver({ endedAt: Date.now(), score: state.score, outcome: 'win' });
                    }}
                    renderItem={(item) => (
                        <View style={styles.cardInternal}>
                            <View style={styles.cardHeader}>
                                <View style={styles.pillBadge}>
                                    <Text style={styles.pillText}>TRUE / FALSE</Text>
                                </View>
                            </View>

                            <View style={styles.cardBody}>
                                <Text style={styles.questionText}>{item.question}</Text>
                                {item.hint && <Text style={styles.hintText}>{item.hint}</Text>}
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.instructionText}>Swipe Right for TRUE</Text>
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* C. Bottom Action Row / Hints */}
            <View style={styles.bottomBar}>
                <View style={styles.actionHint}>
                    <Ionicons name="close-circle-outline" size={24} color={colors.error || '#F44336'} />
                    <Text style={[styles.actionText, { color: colors.error || '#F44336' }]}>False</Text>
                </View>

                <View style={styles.dividerVertical} />

                <View style={styles.actionHint}>
                    <Text style={[styles.actionText, { color: colors.success || '#4CAF50' }]}>True</Text>
                    <Ionicons name="checkmark-circle-outline" size={24} color={colors.success || '#4CAF50'} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Deep Dark Mode
    },
    // HUD
    hud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        height: 60,
        zIndex: 50
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    modeIndicator: {
        flex: 1,
        alignItems: 'center',
    },
    modeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 0.5
    },
    statsMini: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    coinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    streakMiniText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14
    },
    // Stack
    stackArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Card Internal Layout
    cardInternal: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        paddingVertical: spacing.xl
    },
    cardHeader: {
        alignItems: 'center'
    },
    pillBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100
    },
    pillText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1
    },
    cardBody: {
        paddingHorizontal: spacing.md,
        alignItems: 'center'
    },
    questionText: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: spacing.md
    },
    hintText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontStyle: 'italic'
    },
    cardFooter: {
        alignItems: 'center',
        opacity: 0.4
    },
    instructionText: {
        color: 'white',
        fontSize: 12
    },
    // Bottom Bar
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        gap: spacing.xl
    },
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        opacity: 0.7
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    dividerVertical: {
        width: 1,
        height: 24,
        backgroundColor: '#333'
    },
    // Game Over Sheet (REMOVED - Shell handles this now)
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl
    },
    // ... Any other styles needed ...
});
