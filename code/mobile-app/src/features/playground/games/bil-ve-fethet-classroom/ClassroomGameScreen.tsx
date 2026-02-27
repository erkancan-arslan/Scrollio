/**
 * Bil ve Fethet: Classroom — Game Screen
 *
 * Main in-game screen. Renders based on server match state:
 * - Draft phase: Tap empty seats to claim
 * - Attack phase: Tap enemy-owned adjacent seats to attack
 * - Question phase: QuestionModal overlay
 * - Ended: GameResultScreen
 *
 * Uses REST responses as primary state source + polling fallback.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { classroomService } from './services/classroomService';
import { ClassroomMatchState, PLAYER_COLOR_HEX, QuestionResultInfo } from './types';
import { getValidAttackTargets, getEmptySeats } from './logic/adjacency';
import { SeatGrid } from './components/SeatGrid';
import { QuestionModal } from './components/QuestionModal';
import { GameResultScreen } from './components/GameResultScreen';
import { colors, spacing } from '../../../../theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type GameRouteProp = RouteProp<RootStackParamList, 'ClassroomGame'>;

export const ClassroomGameScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<GameRouteProp>();
    const { matchId } = route.params;

    const [matchState, setMatchState] = useState<ClassroomMatchState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [myPlayerId, setMyPlayerId] = useState<string>('');
    const [answeredQuestionId, setAnsweredQuestionId] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showResult, setShowResult] = useState<QuestionResultInfo | null>(null);
    const lastResultTimestamp = useRef<number>(0);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // =====================================================
    // Single state update handler — all flows go through here
    // =====================================================

    const applyStateUpdate = useCallback((state: ClassroomMatchState) => {
        setMatchState(state);

        // Show result feedback when lastQuestionResult changes
        if (state.lastQuestionResult && state.lastQuestionResult.timestamp > lastResultTimestamp.current) {
            lastResultTimestamp.current = state.lastQuestionResult.timestamp;
            setShowResult(state.lastQuestionResult);
            setTimeout(() => setShowResult(null), 2500);
        }
    }, []);

    // =====================================================
    // Setup: Fetch initial state + start polling
    // =====================================================

    useEffect(() => {
        let mounted = true;

        const init = async (): Promise<void> => {
            try {
                const state = await classroomService.getMatchState(matchId);
                if (!mounted) return;
                const me = state.players.find(p => !p.isBot);
                if (me) setMyPlayerId(me.id);
                applyStateUpdate(state);
                setIsLoading(false);
            } catch (error: any) {
                if (!mounted) return;
                Alert.alert('Hata', error.message || 'Maç durumu alınamadı');
                navigation.goBack();
            }
        };

        init();

        // Also try Supabase Realtime (bonus, not relied upon)
        classroomService.subscribeToMatch(matchId, (state) => {
            if (mounted) applyStateUpdate(state);
        });

        // Poll every 1.5 seconds as the PRIMARY state update mechanism.
        // This catches all bot turns, question phases, etc.
        pollRef.current = setInterval(async () => {
            if (!mounted) return;
            try {
                const state = await classroomService.getMatchState(matchId);
                if (mounted) applyStateUpdate(state);
            } catch {
                // Silently ignore poll errors
            }
        }, 1500);

        return () => {
            mounted = false;
            classroomService.unsubscribeFromMatch();
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [matchId]);

    // =====================================================
    // Computed State
    // =====================================================

    const isMyTurn = matchState?.currentTurnPlayerId === myPlayerId;
    const currentPlayer = matchState?.players.find(
        p => p.id === matchState.currentTurnPlayerId,
    );

    const validTargets = matchState && matchState.phase === 'attack' && isMyTurn
        ? getValidAttackTargets(matchState.grid, myPlayerId)
        : matchState && matchState.phase === 'draft' && isMyTurn
            ? getEmptySeats(matchState.grid)
            : [];

    // Check if we already answered the current question
    const hasAnswered = matchState?.question
        ? answeredQuestionId === matchState.question.questionId
        : false;

    // Show question modal during question phase
    const showQuestion = matchState?.phase === 'question' && !!matchState.question;

    // =====================================================
    // Handlers
    // =====================================================

    const handleSeatPress = useCallback(async (seatIndex: number): Promise<void> => {
        if (!matchState || actionLoading) return;

        try {
            setActionLoading(true);
            let newState: ClassroomMatchState | undefined;

            if (matchState.phase === 'draft' && isMyTurn) {
                newState = await classroomService.submitDraftPick(matchId, seatIndex);
            } else if (matchState.phase === 'attack' && isMyTurn) {
                newState = await classroomService.submitAttack(matchId, seatIndex);
            }

            // Use the REST response to update state immediately
            if (newState) {
                applyStateUpdate(newState);
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'İşlem gerçekleştirilemedi');
        } finally {
            setActionLoading(false);
        }
    }, [matchState, isMyTurn, matchId, actionLoading, applyStateUpdate]);

    const handleAnswer = useCallback(async (answer: boolean): Promise<void> => {
        if (!matchState || !matchState.question || hasAnswered) return;

        try {
            // Mark as answered immediately (optimistic)
            setAnsweredQuestionId(matchState.question.questionId);

            // Submit to server and update state from response
            const newState = await classroomService.submitAnswer(matchId, answer);
            applyStateUpdate(newState);
        } catch (error: any) {
            setAnsweredQuestionId(null);
            Alert.alert('Hata', error.message || 'Cevap gönderilemedi');
        }
    }, [matchState, matchId, hasAnswered, applyStateUpdate]);

    const handleRematch = useCallback((): void => {
        navigation.goBack();
    }, [navigation]);

    const handleExit = useCallback((): void => {
        classroomService.cleanup();
        navigation.popToTop();
    }, [navigation]);

    // =====================================================
    // Render
    // =====================================================

    if (isLoading || !matchState) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Maç yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Game Over
    if (matchState.phase === 'ended') {
        return (
            <GameResultScreen
                matchState={matchState}
                myPlayerId={myPlayerId}
                onRematch={handleRematch}
                onExit={handleExit}
            />
        );
    }

    // Phase label
    const phaseLabels: Record<string, string> = {
        draft: '📋 Draft Fazı — Koltuk Seçimi',
        attack: '⚔️ Saldırı Fazı',
        question: '❓ Soru Fazı',
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
                    <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.phaseLabel}>
                        {phaseLabels[matchState.phase] || matchState.phase}
                    </Text>
                    <Text style={styles.turnInfo}>
                        Tur {matchState.turnCount + 1}
                    </Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {/* Turn Indicator */}
            <View style={[
                styles.turnBanner,
                isMyTurn && styles.turnBannerActive,
            ]}>
                {currentPlayer && (
                    <View style={styles.turnRow}>
                        <View style={[
                            styles.turnDot,
                            { backgroundColor: PLAYER_COLOR_HEX[currentPlayer.color] },
                        ]} />
                        <Text style={[
                            styles.turnText,
                            isMyTurn && styles.turnTextActive,
                        ]}>
                            {isMyTurn
                                ? 'Senin Sıran!'
                                : `${currentPlayer.displayName}${currentPlayer.isBot ? ' 🤖' : ''} oynuyor...`}
                        </Text>
                    </View>
                )}

                {/* Attack streak indicator */}
                {matchState.phase === 'attack' &&
                    matchState.attack.attackerStreakOnTarget > 0 && (
                        <Text style={styles.streakText}>
                            🔥 Seri: {matchState.attack.attackerStreakOnTarget}/2
                        </Text>
                    )}
            </View>

            {/* Phase instruction */}
            {isMyTurn && matchState.phase === 'draft' && (
                <Text style={styles.instruction}>
                    Boş bir koltuğa dokun onu seçmek için
                </Text>
            )}
            {isMyTurn && matchState.phase === 'attack' && (
                <Text style={styles.instruction}>
                    Sarı kenarlı düşman koltuğuna dokun saldırmak için
                </Text>
            )}

            {/* Seat Grid */}
            <SeatGrid
                grid={matchState.grid}
                players={matchState.players}
                validTargets={validTargets}
                selectedSeat={matchState.attack.targetSeatIndex}
                onSeatPress={handleSeatPress}
                disabled={!isMyTurn || actionLoading || matchState.phase === 'question'}
                currentTurnPlayerId={matchState.currentTurnPlayerId}
            />

            {/* Action Loading */}
            {actionLoading && (
                <View style={styles.actionLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            )}

            {/* Question Modal */}
            <QuestionModal
                visible={showQuestion}
                question={matchState.question}
                players={matchState.players}
                attackerId={matchState.attack.attackerId}
                defenderId={matchState.attack.defenderId}
                myPlayerId={myPlayerId}
                onAnswer={handleAnswer}
                hasAnswered={hasAnswered}
            />

            {/* Question Result Feedback Overlay */}
            {showResult && (
                <View style={styles.resultOverlay}>
                    <View style={[
                        styles.resultCard,
                        showResult.outcome === 'conquered' && styles.resultCardConquest,
                    ]}>
                        {/* Outcome Icon */}
                        <Text style={styles.resultEmoji}>
                            {showResult.outcome === 'conquered' ? '🏆'
                                : showResult.outcome === 'streak_up' ? '🔥'
                                    : showResult.outcome === 'both_correct' ? '⚡'
                                        : '❌'}
                        </Text>

                        {/* Outcome Title */}
                        <Text style={styles.resultTitle}>
                            {showResult.outcome === 'conquered'
                                ? 'KOLTUK FETHEDİLDİ!'
                                : showResult.outcome === 'streak_up'
                                    ? `Seri: ${showResult.streakAfter}/${2} — 1 doğru daha!`
                                    : showResult.outcome === 'both_correct'
                                        ? 'İkisi de doğru — berabere!'
                                        : 'Saldırı başarısız!'}
                        </Text>

                        {/* Player Results */}
                        <View style={styles.resultPlayers}>
                            {/* Attacker */}
                            <View style={styles.resultPlayerRow}>
                                <View style={[
                                    styles.resultDot,
                                    { backgroundColor: PLAYER_COLOR_HEX[matchState.players.find(p => p.id === showResult.attackerId)?.color || 'red'] },
                                ]} />
                                <Text style={styles.resultPlayerName}>
                                    {matchState.players.find(p => p.id === showResult.attackerId)?.displayName || 'Saldırgan'}
                                    {showResult.attackerId === myPlayerId ? ' (Sen)' : ''}
                                </Text>
                                <Text style={[
                                    styles.resultAnswerBadge,
                                    showResult.attackerCorrect ? styles.correctBadge : styles.wrongBadge,
                                ]}>
                                    {showResult.attackerCorrect ? '✓ Doğru' : '✗ Yanlış'}
                                </Text>
                            </View>
                            {/* Defender */}
                            <View style={styles.resultPlayerRow}>
                                <View style={[
                                    styles.resultDot,
                                    { backgroundColor: PLAYER_COLOR_HEX[matchState.players.find(p => p.id === showResult.defenderId)?.color || 'blue'] },
                                ]} />
                                <Text style={styles.resultPlayerName}>
                                    {matchState.players.find(p => p.id === showResult.defenderId)?.displayName || 'Savunmacı'}
                                    {showResult.defenderId === myPlayerId ? ' (Sen)' : ''}
                                </Text>
                                <Text style={[
                                    styles.resultAnswerBadge,
                                    showResult.defenderCorrect ? styles.correctBadge : styles.wrongBadge,
                                ]}>
                                    {showResult.defenderCorrect ? '✓ Doğru' : '✗ Yanlış'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#8E8E93',
        fontSize: 15,
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    exitBtn: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    phaseLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    turnInfo: {
        color: '#48484A',
        fontSize: 12,
        marginTop: 2,
    },
    headerRight: {
        width: 40,
    },
    turnBanner: {
        backgroundColor: '#1C1C1E',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    turnBannerActive: {
        backgroundColor: '#0A3D02',
        borderWidth: 1,
        borderColor: '#34C75940',
    },
    turnRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    turnDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    turnText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    turnTextActive: {
        color: '#34C759',
        fontWeight: '700',
    },
    streakText: {
        color: '#FFD60A',
        fontSize: 13,
        fontWeight: '700',
    },
    instruction: {
        color: '#8E8E93',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 4,
    },
    actionLoading: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    resultOverlay: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 50,
    },
    resultCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    resultCardConquest: {
        borderColor: '#FFD60A',
        backgroundColor: '#1A1800',
    },
    resultEmoji: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: 4,
    },
    resultTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    resultPlayers: {
        gap: 8,
    },
    resultPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    resultPlayerName: {
        color: '#AEAEB2',
        fontSize: 13,
        flex: 1,
    },
    resultAnswerBadge: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },
    correctBadge: {
        color: '#34C759',
        backgroundColor: '#0A3D02',
    },
    wrongBadge: {
        color: '#FF3B30',
        backgroundColor: '#3D0A02',
    },
});
