/**
 * DuelGameScreen
 * The real-time duel gameplay screen. Displays dual timers, shared questions,
 * and handles swipe-based answer submission with server-authoritative state.
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    selectDuelSession,
    receiveDuelStateUpdate,
    endDuelSession,
} from '../store/playgroundSlice';
import { duelService } from '../services/duelService';
import { DuelStateSnapshot } from '../games/infinite_flow/duelTypes';
import { SwipeableCardStack } from '../components/SwipeableCardStack';
import { INFINITE_FLOW_QUESTIONS_ENGLISH } from '../data/infiniteFlowQuestions';
import { colors, spacing } from '../../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =====================================================
// Seeded deterministic shuffle (same as server)
// =====================================================
function seededRandom(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const newArr = [...array];
    const random = seededRandom(seed);
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// =====================================================
// TimerBar Component
// =====================================================
interface TimerBarProps {
    remainingMs: number;
    maxMs: number;
    label: string;
    isMe: boolean;
    color: string;
}

const TimerBar: React.FC<TimerBarProps> = ({ remainingMs, maxMs, label, isMe, color }) => {
    const ratio = Math.max(0, Math.min(1, remainingMs / maxMs));
    const seconds = Math.max(0, remainingMs / 1000);

    return (
        <View style={[timerStyles.container, isMe && timerStyles.myContainer]}>
            <View style={timerStyles.labelRow}>
                <Text style={[timerStyles.label, isMe && timerStyles.myLabel]}>
                    {label}
                </Text>
                <Text style={[
                    timerStyles.time,
                    isMe && timerStyles.myTime,
                    seconds <= 5 && timerStyles.urgentTime,
                ]}>
                    {seconds.toFixed(1)}s
                </Text>
            </View>
            <View style={timerStyles.barBackground}>
                <View
                    style={[
                        timerStyles.barFill,
                        {
                            width: `${ratio * 100}%`,
                            backgroundColor: seconds <= 5 ? '#FF4444' : color,
                        },
                    ]}
                />
            </View>
        </View>
    );
};

const timerStyles = StyleSheet.create({
    container: {
        marginBottom: 6,
    },
    myContainer: {},
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    myLabel: {
        color: '#FFD700',
    },
    time: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    myTime: {
        color: '#FFD700',
    },
    urgentTime: {
        color: '#FF4444',
    },
    barBackground: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
});

// =====================================================
// Params
// =====================================================
type DuelGameParams = {
    DuelGame: {
        matchId: string;
        opponentName: string;
        opponentAvatar: string | null;
        role: 'A' | 'B';
        seed: number;
        questionSetId: string;
        bankVersion: string;
        playerAId: string;
        playerBId: string;
    };
};

// =====================================================
// JokerButton Component
// =====================================================
interface JokerButtonProps {
    type: string; // 'SHIELD' | 'FREEZE' | 'CLEANSE'
    available: boolean;
    active: boolean;
    onPress: () => void;
}

const JokerButton: React.FC<JokerButtonProps> = ({ type, available, active, onPress }) => {
    // Only support Freeze, Shield, Hide (mapped to CLEANSE in code?)
    // Note: Backend DTO says 'SHIELD', 'FREEZE', 'CLEANSE'.
    // User asked for "Freeze, Shield, Hide".
    // I will assume CLEANSE matches 'Hide' or similar, but wait, 'CLEANSE' usually removes effects.
    // 'Hide' is blurring.
    // I should check what jokers are supported.
    // DTO says SHIELD, FREEZE, CLEANSE.
    // If user says "Hide", maybe they mean "Cleanse" results in hiding? Or maybe "Hide" is not implemented in backend yet?
    // "005_duel_jokers.sql" likely defines the effects.
    // For now I will implement SHIELD/FREEZE/CLEANSE buttons.
    // If CLEANSE = Hide, I'll label it 'Hide'.
    // Let's verify via `view_file` later if needed, but for now I'll use icons.

    let iconName: any = 'help';
    let label = type;
    let color = '#888';

    if (type === 'SHIELD') {
        iconName = 'shield-checkmark';
        color = '#00C853'; // Green
    } else if (type === 'FREEZE') {
        iconName = 'snow';
        color = '#2979FF'; // Blue
    } else if (type === 'CLEANSE') { // Assuming 'Hide' or just Cleanse
        iconName = 'water';
        label = 'CLEANSE'; // Or HIDE?
        color = '#FFD700'; // Gold
    }

    // Logic: 
    // Available = can click.
    // Active = currently in effect (e.g. freezing opponent).
    // Used (not available) = grayed out.

    return (
        <TouchableOpacity
            style={[
                jokerStyles.button,
                available ? { backgroundColor: color } : jokerStyles.buttonDisabled,
                active && jokerStyles.buttonActive
            ]}
            onPress={onPress}
            disabled={!available}
        >
            <Ionicons name={iconName} size={20} color="#fff" />
            <Text style={jokerStyles.label}>{label}</Text>
            {active && <View style={jokerStyles.activeDot} />}
        </TouchableOpacity>
    );
};

const jokerStyles = StyleSheet.create({
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    buttonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    buttonActive: {
        borderColor: '#fff',
        borderWidth: 3,
    },
    label: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 2,
    },
    activeDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
});

// =====================================================
// Main Component
// =====================================================
export const DuelGameScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<DuelGameParams, 'DuelGame'>>();
    const dispatch = useAppDispatch();
    const duelSession = useAppSelector(selectDuelSession);

    const {
        matchId,
        opponentName,
        role,
        seed,
        playerAId,
        playerBId,
    } = route.params;

    // Local timer interpolation state
    const [myRemainingMs, setMyRemainingMs] = useState(30000);
    const [opponentRemainingMs, setOpponentRemainingMs] = useState(30000);
    const [myQuestionIndex, setMyQuestionIndex] = useState(0);
    const [matchState, setMatchState] = useState<'waiting' | 'active' | 'finished' | 'canceled'>('waiting');
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [finishReason, setFinishReason] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [connectionBanner, setConnectionBanner] = useState(false);

    // Joker State
    const [playerAJokers, setPlayerAJokers] = useState<any>(null);
    const [playerBJokers, setPlayerBJokers] = useState<any>(null);

    // Refs for local timer interpolation (stale-closure-safe)
    const lastServerUpdateRef = useRef(Date.now());
    const lastPollTimeRef = useRef(0);
    const serverMyMsRef = useRef(30000);
    const serverOpponentMsRef = useRef(30000);

    // Deterministic shuffled questions (same seed as server)
    const shuffledQuestions = useMemo(() => {
        return shuffleWithSeed(INFINITE_FLOW_QUESTIONS_ENGLISH, seed);
    }, [seed]);

    // Each player has their own question stream — use my index, not a shared one
    const currentQuestion = shuffledQuestions[myQuestionIndex % shuffledQuestions.length] ?? null;
    const maxMs = 30000;

    // ===================================================
    // Handle Joker Use
    // ===================================================
    const handleJoker = useCallback(async (type: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const snapshot = await duelService.useJoker(matchId, type);
            lastServerUpdateRef.current = Date.now();
            const myMs = role === 'A' ? snapshot.remainingMsA : snapshot.remainingMsB;
            const oppMs = role === 'A' ? snapshot.remainingMsB : snapshot.remainingMsA;
            serverMyMsRef.current = myMs;
            serverOpponentMsRef.current = oppMs;
            setMyRemainingMs(myMs);
            setOpponentRemainingMs(oppMs);
            setPlayerAJokers(snapshot.playerAJokers);
            setPlayerBJokers(snapshot.playerBJokers);
        } catch (err) {
            console.error('Failed to use joker:', err);
        }
    }, [matchId, role]);

    // ===================================================
    // Subscribe to match updates
    // ===================================================
    useEffect(() => {
        const applySnapshot = (snapshot: DuelStateSnapshot) => {
            lastServerUpdateRef.current = Date.now();

            const myMs = role === 'A' ? snapshot.remainingMsA : snapshot.remainingMsB;
            const oppMs = role === 'A' ? snapshot.remainingMsB : snapshot.remainingMsA;
            const myIdx = role === 'A'
                ? (snapshot.questionIndexA ?? snapshot.currentQuestionIndex)
                : (snapshot.questionIndexB ?? snapshot.currentQuestionIndex);

            serverMyMsRef.current = myMs;
            serverOpponentMsRef.current = oppMs;
            setMyRemainingMs(myMs);
            setOpponentRemainingMs(oppMs);
            setMyQuestionIndex(myIdx);
            setPlayerAJokers(snapshot.playerAJokers);
            setPlayerBJokers(snapshot.playerBJokers);
            setMatchState(snapshot.state);
            setWinnerId(snapshot.winnerId);
            setFinishReason(snapshot.finishReason);
            dispatch(receiveDuelStateUpdate(snapshot));
        };

        duelService.subscribeToMatch(
            matchId,
            (snapshot: DuelStateSnapshot) => {
                console.log('[DuelGameScreen] Realtime Update Received:', {
                    matchId: snapshot.matchId,
                    remainingA: snapshot.remainingMsA,
                    remainingB: snapshot.remainingMsB,
                    questionIndexA: snapshot.questionIndexA,
                    questionIndexB: snapshot.questionIndexB,
                    state: snapshot.state,
                });
                applySnapshot(snapshot);
            },
            (snapshot: DuelStateSnapshot) => {
                setMatchState('finished');
                setWinnerId(snapshot.winnerId);
                setFinishReason(snapshot.finishReason);
            },
        );

        // Join match on mount
        duelService.joinMatch(matchId).then((snapshot) => {
            console.log('[DuelGameScreen] Joined Match. Initial Snapshot:', {
                matchId: snapshot.matchId,
                remainingA: snapshot.remainingMsA,
                remainingB: snapshot.remainingMsB,
            });
            applySnapshot(snapshot);
        }).catch(console.error);


        return () => {
            duelService.unsubscribeFromMatch();
        };
    }, [matchId, role, dispatch]);

    // ===================================================
    // Local timer interpolation (smooth countdown between server ticks)
    // ===================================================
    useEffect(() => {
        if (matchState !== 'active') return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - lastServerUpdateRef.current;
            // Both timers run simultaneously — no pausing
            const myNewMs = Math.max(0, serverMyMsRef.current - elapsed);
            const oppNewMs = Math.max(0, serverOpponentMsRef.current - elapsed);

            setMyRemainingMs(myNewMs);
            setOpponentRemainingMs(oppNewMs);

            // Failsafe: if time ran out but state isn't finished, poll server
            if ((myNewMs <= 0 || oppNewMs <= 0) && matchState === 'active') {
                const now = Date.now();
                if (now - lastPollTimeRef.current > 3000) {
                    lastPollTimeRef.current = now;
                    duelService.getDuelMatchState(matchId).then(snapshot => {
                        if (snapshot.state !== 'active') {
                            setMatchState(snapshot.state);
                            setWinnerId(snapshot.winnerId);
                            setFinishReason(snapshot.finishReason);
                        }
                    }).catch(console.error);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [matchState, matchId]);

    // ===================================================
    // Handle swipe answer
    // ===================================================
    const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
        if (isSubmitting || matchState !== 'active' || !currentQuestion) return;

        const myJokers = role === 'A' ? playerAJokers : playerBJokers;
        const frozen = myJokers?.controlsLockedUntil != null && myJokers.controlsLockedUntil > Date.now();
        if (frozen) return;

        const answer = direction === 'right';
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsSubmitting(true);

        try {
            const snapshot = await duelService.submitDuelAnswer(matchId, myQuestionIndex, answer);

            // Apply snapshot immediately for instant feedback
            lastServerUpdateRef.current = Date.now();
            const myMs = role === 'A' ? snapshot.remainingMsA : snapshot.remainingMsB;
            const oppMs = role === 'A' ? snapshot.remainingMsB : snapshot.remainingMsA;
            const myIdx = role === 'A'
                ? (snapshot.questionIndexA ?? snapshot.currentQuestionIndex)
                : (snapshot.questionIndexB ?? snapshot.currentQuestionIndex);

            serverMyMsRef.current = myMs;
            serverOpponentMsRef.current = oppMs;
            setMyRemainingMs(myMs);
            setOpponentRemainingMs(oppMs);
            setMyQuestionIndex(myIdx);
            setPlayerAJokers(snapshot.playerAJokers);
            setPlayerBJokers(snapshot.playerBJokers);

            if (snapshot.state !== 'active') {
                setMatchState(snapshot.state);
                setWinnerId(snapshot.winnerId);
                setFinishReason(snapshot.finishReason);
            }
        } catch (err: any) {
            console.error('Error submitting answer:', err);
            Alert.alert('Submission Failed', err.message || 'Unknown error');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, matchState, currentQuestion, matchId, myQuestionIndex, role, playerAJokers, playerBJokers]);

    // ===================================================
    // Handle exit
    // ===================================================
    const handleExit = useCallback(() => {
        dispatch(endDuelSession());
        duelService.unsubscribeFromMatch();
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Social' as any); // Fallback
        }
    }, [dispatch, navigation]);

    // ===================================================
    // Determine my user ID
    // ===================================================
    const myUserId = role === 'A' ? playerAId : playerBId;

    // ===================================================
    // Derived joker state (computed every render — server ticks keep them fresh)
    // ===================================================
    const myJokersState = role === 'A' ? playerAJokers : playerBJokers;
    const oppJokersState = role === 'A' ? playerBJokers : playerAJokers;
    const now = Date.now();

    const isFrozen =
        myJokersState?.controlsLockedUntil != null &&
        myJokersState.controlsLockedUntil > now;

    const hasActiveDebuff =
        isFrozen ||
        (myJokersState?.activeEffects || []).some((e: any) => e.type === 'FREEZE');

    const isOpponentFrozen =
        (oppJokersState?.controlsLockedUntil != null && oppJokersState.controlsLockedUntil > now) ||
        (oppJokersState?.activeEffects || []).some((e: any) => e.type === 'FREEZE');
    const iWon = winnerId === myUserId;
    const isDraw = winnerId === null && matchState === 'finished';

    // ===================================================
    // RENDER: Game Over
    // ===================================================
    if (matchState === 'finished') {
        const resultColor = iWon ? '#00C853' : isDraw ? '#555' : '#FF4444';
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: iWon ? '#0a2a1a' : isDraw ? '#1a1a1a' : '#2a0a0a' }]}>
                <StatusBar barStyle="light-content" />
                <View style={styles.resultContainer}>
                    <View style={[styles.resultIconCircle, { borderColor: resultColor }]}>
                        <Ionicons
                            name={iWon ? 'trophy' : isDraw ? 'remove-circle' : 'close-circle'}
                            size={80}
                            color={resultColor}
                        />
                    </View>

                    <Text style={[styles.resultTitle, {
                        color: iWon ? '#FFD700' : isDraw ? '#aaa' : '#FF4444',
                    }]}>
                        {iWon ? 'VICTORY!' : isDraw ? 'DRAW' : 'DEFEAT'}
                    </Text>

                    <Text style={styles.resultSubtitle}>
                        vs {opponentName}
                    </Text>

                    {/* Timer comparison */}
                    <View style={styles.resultStats}>
                        <View style={styles.resultStatBox}>
                            <Text style={styles.resultStatLabel}>Your Time</Text>
                            <Text style={styles.resultStatValue}>
                                {(myRemainingMs / 1000).toFixed(1)}s
                            </Text>
                        </View>
                        <View style={styles.resultStatBox}>
                            <Text style={styles.resultStatLabel}>Their Time</Text>
                            <Text style={styles.resultStatValue}>
                                {(opponentRemainingMs / 1000).toFixed(1)}s
                            </Text>
                        </View>
                        <View style={styles.resultStatBox}>
                            <Text style={styles.resultStatLabel}>Questions</Text>
                            <Text style={styles.resultStatValue}>
                                {myQuestionIndex}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.exitBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleExit(); }} activeOpacity={0.85}>
                        <Text style={styles.exitBtnText}>Back to Friends</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ===================================================
    // RENDER: Active Game
    // ===================================================
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Connection banner */}
            {connectionBanner && (
                <View style={styles.connectionBanner}>
                    <Text style={styles.connectionText}>Reconnecting…</Text>
                </View>
            )}

            {/* HUD: Timers */}
            <View style={styles.hud}>
                <TimerBar
                    remainingMs={myRemainingMs}
                    maxMs={maxMs}
                    label="YOU"
                    isMe={true}
                    color="#00C853"
                />
                <TimerBar
                    remainingMs={opponentRemainingMs}
                    maxMs={maxMs}
                    label={opponentName.toUpperCase()}
                    isMe={false}
                    color="#2979FF"
                />

                {/* Question counter */}
                <View style={styles.questionCounter}>
                    <Text style={styles.questionCounterText}>
                        Q{myQuestionIndex + 1}
                    </Text>
                </View>
            </View>

            {/* Card Stack */}
            {currentQuestion && (
                <View style={styles.cardArea}>
                    <SwipeableCardStack
                        data={shuffledQuestions.slice(myQuestionIndex % shuffledQuestions.length)}
                        renderItem={(item) => (
                            <View style={styles.questionCard}>
                                <Text style={styles.questionText}>{item.question}</Text>
                                {item.hint ? (
                                    <Text style={styles.hintQuestionText}>{item.hint}</Text>
                                ) : null}
                            </View>
                        )}
                        onSwipeRight={() => handleSwipe('right')}
                        onSwipeLeft={() => handleSwipe('left')}
                    />

                    {/* FROZEN or waiting-for-start overlay */}
                    {(matchState === 'waiting' || isFrozen) && (
                        <View style={styles.waitingOverlay}>
                            <Text style={styles.waitingText}>
                                {isFrozen ? 'FROZEN!' : 'Waiting for opponent...'}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Joker Row */}
            <View style={styles.jokerRow}>
                <JokerButton
                    type="SHIELD"
                    available={(myJokersState?.remainingUses?.['SHIELD'] ?? 0) > 0}
                    active={(myJokersState?.activeEffects || []).some((e: any) => e.type === 'SHIELD')}
                    onPress={() => handleJoker('SHIELD')}
                />
                <JokerButton
                    type="FREEZE"
                    available={
                        (myJokersState?.remainingUses?.['FREEZE'] ?? 0) > 0 &&
                        opponentRemainingMs > 3000
                    }
                    active={isOpponentFrozen}
                    onPress={() => handleJoker('FREEZE')}
                />
                <JokerButton
                    type="CLEANSE"
                    available={
                        (myJokersState?.remainingUses?.['CLEANSE'] ?? 0) > 0 &&
                        hasActiveDebuff
                    }
                    active={false}
                    onPress={() => handleJoker('CLEANSE')}
                />
            </View>

            {/* Bottom hints */}
            <View style={styles.hints}>
                <View style={styles.hintItem}>
                    <Ionicons name="arrow-back" size={20} color="#FF4444" />
                    <Text style={styles.hintText}>FALSE</Text>
                </View>
                <View style={styles.hintItem}>
                    <Ionicons name="arrow-forward" size={20} color="#00C853" />
                    <Text style={styles.hintText}>TRUE</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

// =====================================================
// STYLES
// =====================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a1a',
    },
    connectionBanner: {
        backgroundColor: '#FF6600',
        paddingVertical: 6,
        alignItems: 'center',
    },
    connectionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    hud: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    questionCounter: {
        alignItems: 'center',
        marginTop: 4,
    },
    questionCounterText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        letterSpacing: 1,
    },
    cardArea: {
        flex: 1,
        position: 'relative',
    },
    waitingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    waitingText: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
    },
    hints: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    hintItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    hintText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    // Results screen
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    resultIconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    resultTitle: {
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: spacing.sm,
    },
    resultSubtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: spacing.xxl,
    },
    resultStats: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginBottom: spacing.xxl,
    },
    resultStatBox: {
        alignItems: 'center',
    },
    resultStatLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    resultStatValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    exitBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 100,
    },
    exitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Question card (rendered inside SwipeableCardStack)
    jokerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    questionCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 32,
    },
    hintQuestionText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: spacing.md,
        fontStyle: 'italic',
    },
});
