import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { SwipeableCardStack } from '../components/SwipeableCardStack';
import { colors, spacing } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { startGame, incrementScore, endGame, resetStreak } from '../store/playgroundSlice';
import { useGameExit } from '../hooks/useGameExit';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardService } from '../services/leaderboardService';
import { Leaderboard } from '../components/Leaderboard';

// Hardcoded Mock Data (unchanged logic)
// In real app, this would be dynamic.
const MOCK_DATA = [
    { id: 1, type: 'true_false', question: 'Octopuses have 3 hearts.', answer: true, hint: 'Nature is weird.' },
    { id: 2, type: 'true_false', question: 'The Great Wall of China is visible from space.', answer: false, hint: 'Common myth.' },
    { id: 3, type: 'true_false', question: 'Bananas are berries.', answer: true, hint: 'Botanically speaking.' },
    { id: 4, type: 'true_false', question: 'Goldfish have a 3-second memory.', answer: false, hint: 'They can remember for months.' },
    { id: 5, type: 'true_false', question: 'Lightning never strikes the same place twice.', answer: false, hint: 'Empire State Building gets hit ~25 times/year.' },
];

export const InfiniteFlowScreen = () => {
    const dispatch = useAppDispatch();
    const { activeSession } = useAppSelector(state => state.playground);
    const scoreSubmittedRef = useRef(false);

    const handleExit = useGameExit();

    useEffect(() => {
        dispatch(startGame({ gameType: 'infinite_flow' }));
        scoreSubmittedRef.current = false;
    }, [dispatch]);

    useEffect(() => {
        if (activeSession?.isGameOver && activeSession.score > 0 && !scoreSubmittedRef.current) {
            scoreSubmittedRef.current = true;
            leaderboardService.submitScore('infinite_flow', activeSession.score)
                .catch(err => console.error('Score submission failed', err));
        }
    }, [activeSession?.isGameOver, activeSession?.score]);

    const handleSwipe = (item: any, direction: 'left' | 'right') => {
        const isTrue = direction === 'right'; // Right = True, Left = False
        const correct = item.answer === isTrue;

        if (correct) {
            dispatch(incrementScore(10));
            // Optional: Add haptic feedback here
        } else {
            dispatch(resetStreak());
            // resetStreak() in slice creates logic: lives -= 1. If lives <= 0, gameOver = true.
        }
    };

    if (!activeSession) {
        return <View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View>;
    }

    if (activeSession.isGameOver) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.resultContainer}>
                    <Text style={styles.gameOverTitle}>RUN OVER</Text>

                    <View style={styles.statRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>SCORE</Text>
                            <Text style={styles.statValue}>{activeSession.score}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>STREAK</Text>
                            <Text style={styles.statValue}>{activeSession.streak}</Text>
                        </View>
                    </View>

                    {/* Leaderboard Section */}
                    <View style={{ flex: 1, width: '100%', marginBottom: spacing.md }}>
                        <Leaderboard gameId="infinite_flow" />
                    </View>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => {
                            scoreSubmittedRef.current = false;
                            dispatch(startGame({ gameType: 'infinite_flow' }));
                        }}
                    >
                        <Text style={styles.btnText}>Play Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={handleExit}
                    >
                        <Text style={styles.secondaryBtnText}>Back to Playground</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* A. Top HUD */}
            <View style={styles.hud}>
                <TouchableOpacity onPress={handleExit} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>

                <View style={styles.modeIndicator}>
                    <Text style={styles.modeText}>Infinite Flow</Text>
                </View>

                <View style={styles.statsMini}>
                    <View style={styles.coinBadge}>
                        <Ionicons name="heart" size={14} color={colors.error} />
                        <Text style={styles.streakMiniText}>{activeSession.lives}</Text>
                    </View>
                    <View style={[styles.coinBadge, { marginLeft: 8 }]}>
                        <Ionicons name="flame" size={14} color={colors.primary} />
                        <Text style={styles.streakMiniText}>{activeSession.streak}</Text>
                    </View>
                </View>
            </View>

            {/* B. Card Stack */}
            <View style={styles.stackArea}>
                <SwipeableCardStack
                    data={MOCK_DATA}
                    onSwipeLeft={(item) => handleSwipe(item, 'left')}
                    onSwipeRight={(item) => handleSwipe(item, 'right')}
                    onFinished={() => dispatch(endGame())}
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: 'white',
        fontSize: 16
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
        width: 40,
        justifyContent: 'flex-end'
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
        // We ensure cards fit well between HUD and Bottom Bar
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
    // Game Over Sheet
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl
    },
    gameOverTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: 'white',
        marginBottom: spacing.xxl,
        letterSpacing: 2
    },
    statRow: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginBottom: spacing.xxl
    },
    statBox: {
        alignItems: 'center'
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4
    },
    statValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold'
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        marginBottom: spacing.md
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    secondaryBtn: {
        paddingVertical: 12
    },
    secondaryBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600'
    }
});
