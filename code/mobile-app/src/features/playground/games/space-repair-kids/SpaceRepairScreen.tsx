import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RepairSlot as RepairSlotType, AnswerBlock, PlayerId, SlotFilledPayload } from './types';
import { RepairSlot, SlotLayout } from './components/RepairSlot';
import { DraggableAnswerBlock } from './components/DraggableAnswerBlock';
import { CountdownTimer } from './components/CountdownTimer';
import { spaceRepairService } from './services/multiplayerService';

interface Props {
    roomCode: string;
    myPlayerId: PlayerId;
    isHost: boolean;
    isSinglePlayer?: boolean;
    initialSlots: RepairSlotType[];
    initialAnswers: AnswerBlock[];
    initialTimeRemaining: number;
    onExit: () => void;
}

export const SpaceRepairScreen: React.FC<Props> = ({
    roomCode,
    myPlayerId,
    isHost,
    isSinglePlayer = false,
    initialSlots,
    initialAnswers,
    initialTimeRemaining,
    onExit,
}) => {
    const [slots, setSlots] = useState<RepairSlotType[]>(initialSlots);
    const [answers, setAnswers] = useState<AnswerBlock[]>(initialAnswers);
    const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
    const [gameEnded, setGameEnded] = useState<'won' | 'lost' | null>(null);

    // Absolute screen positions captured via measure() — no coordinate mismatch
    const slotLayouts = useRef<(SlotLayout | null)[]>(Array(6).fill(null));
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Outcome animation
    const outcomeScale = useRef(new Animated.Value(0)).current;

    // ──────────────────────────────────────────────
    // Real-time sync (skipped in single-player)
    // ──────────────────────────────────────────────
    useEffect(() => {
        if (isSinglePlayer) return;
        spaceRepairService.joinGame(
            roomCode,
            () => {}, // game_init handled in lobby
            (payload: SlotFilledPayload) => {
                applySlotFill(payload.slotId, payload.answerId, payload.playerId);
            },
            (payload) => setTimeRemaining(payload.timeRemaining),
            (payload) => endGame(payload.outcome),
        );
    }, [roomCode, isSinglePlayer]);

    // ──────────────────────────────────────────────
    // Countdown (host is authoritative for sync)
    // ──────────────────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    clearAllTimers();
                    if (isHost && !isSinglePlayer) {
                        spaceRepairService.broadcastGameOver(roomCode, { outcome: 'lost' });
                    }
                    endGame('lost');
                    return 0;
                }
                return next;
            });
        }, 1000);

        if (isHost && !isSinglePlayer) {
            timerSyncRef.current = setInterval(() => {
                setTimeRemaining((current) => {
                    spaceRepairService.broadcastTimerSync(roomCode, { timeRemaining: current });
                    return current;
                });
            }, 5000);
        }

        return () => clearAllTimers();
    }, [isHost, roomCode, isSinglePlayer]);

    const clearAllTimers = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (timerSyncRef.current) clearInterval(timerSyncRef.current);
        timerRef.current = null;
        timerSyncRef.current = null;
    }, []);

    // ──────────────────────────────────────────────
    // Slot fill
    // ──────────────────────────────────────────────
    const applySlotFill = useCallback((slotId: string, answerId: string, playerId: PlayerId) => {
        setSlots((prev) =>
            prev.map((s) => (s.id === slotId ? { ...s, filledByPlayerId: playerId } : s)),
        );
        setAnswers((prev) =>
            prev.map((a) => (a.id === answerId ? { ...a, isUsed: true } : a)),
        );
    }, []);

    const checkWinCondition = useCallback(
        (updatedSlots: RepairSlotType[]) => {
            if (updatedSlots.every((s) => s.filledByPlayerId !== null)) {
                clearAllTimers();
                if (isHost && !isSinglePlayer) {
                    spaceRepairService.broadcastGameOver(roomCode, { outcome: 'won' });
                }
                endGame('won');
            }
        },
        [isHost, isSinglePlayer, roomCode, clearAllTimers],
    );

    const endGame = useCallback(
        (outcome: 'won' | 'lost') => {
            clearAllTimers();
            setGameEnded(outcome);
            outcomeScale.setValue(0);
            Animated.sequence([
                Animated.spring(outcomeScale, { toValue: 1.15, useNativeDriver: true }),
                Animated.spring(outcomeScale, { toValue: 1.0, useNativeDriver: true }),
            ]).start();
            if (outcome === 'won') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        },
        [clearAllTimers, outcomeScale],
    );

    // ──────────────────────────────────────────────
    // Drop validation — called by DraggableAnswerBlock
    // Returns 'correct' | 'wrong' | 'occupied' so the block
    // knows which animation to play without needing game state.
    // ──────────────────────────────────────────────
    const handleDrop = useCallback(
        (blockId: string, slotIndex: number): 'correct' | 'wrong' | 'occupied' => {
            const slot = slots[slotIndex];
            if (!slot) return 'wrong';
            if (slot.filledByPlayerId !== null) return 'occupied';

            const block = answers.find((a) => a.id === blockId);
            if (!block) return 'wrong';

            if (slot.correctAnswerId !== block.id) return 'wrong';

            // ✓ Correct match
            applySlotFill(slot.id, block.id, myPlayerId);

            if (!isSinglePlayer) {
                spaceRepairService.broadcastSlotFilled(roomCode, {
                    slotId: slot.id,
                    answerId: block.id,
                    playerId: myPlayerId,
                });
            }

            const updatedSlots = slots.map((s) =>
                s.id === slot.id ? { ...s, filledByPlayerId: myPlayerId } : s,
            );
            checkWinCondition(updatedSlots);
            return 'correct';
        },
        [slots, answers, myPlayerId, isSinglePlayer, roomCode, applySlotFill, checkWinCondition],
    );

    // ── Slot layout callback (absolute coords from measure())
    const handleSlotLayout = useCallback((index: number, layout: SlotLayout) => {
        slotLayouts.current[index] = layout;
    }, []);

    const myAnswers = answers.filter((a) => a.assignedTo === myPlayerId);
    const filledCount = slots.filter((s) => s.filledByPlayerId !== null).length;

    // ──────────────────────────────────────────────
    // Render: game over
    // ──────────────────────────────────────────────
    if (gameEnded) {
        const won = gameEnded === 'won';
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={won ? ['#081d11', '#0f3822'] : ['#2a0a0a', '#140505']}
                    style={StyleSheet.absoluteFillObject}
                />
                <Animated.View
                    style={[styles.outcomeContainer, { transform: [{ scale: outcomeScale }] }]}
                >
                    <Text style={styles.outcomeEmoji}>{won ? '🎉' : '💥'}</Text>
                    <Text style={styles.outcomeTitle}>
                        {won ? 'Uzay Gemisi Tamir Edildi!' : 'Süre Doldu!'}
                    </Text>
                    <Text style={styles.outcomeSubtitle}>
                        {won
                            ? `Tüm parçalar başarıyla yerleştirildi! 🚀`
                            : `Sadece ${filledCount}/6 parça tamamlandı`}
                    </Text>
                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onExit();
                        }}
                    >
                        <Text style={styles.exitButtonText}>Ana Menüye Dön</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        );
    }

    // ──────────────────────────────────────────────
    // Render: game
    // ──────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0f0b1c', '#151125', '#1a1835']}
                style={StyleSheet.absoluteFillObject}
            />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onExit();
                    }}
                    style={styles.exitBtn}
                >
                    <Text style={styles.exitBtnText}>✕</Text>
                </TouchableOpacity>
                <CountdownTimer timeRemaining={timeRemaining} />
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{filledCount}/6 🔧</Text>
                </View>
            </View>

            {/* Shared board */}
            <View style={styles.boardSection}>
                <Text style={styles.sectionLabel}>🚀 Uzay Gemisi Ana Paneli</Text>
                <View style={styles.slotsGrid}>
                    {slots.map((slot, i) => (
                        <RepairSlot
                            key={slot.id}
                            slot={slot}
                            slotIndex={i}
                            onLayout={handleSlotLayout}
                        />
                    ))}
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
                <Text style={styles.dividerText}>• Envanterim •</Text>
            </View>

            {/* Personal inventory */}
            <View style={styles.inventorySection}>
                <View style={styles.blocksRow}>
                    {myAnswers.map((block) => (
                        <DraggableAnswerBlock
                            key={block.id}
                            block={block}
                            slotLayouts={slotLayouts}
                            onDrop={handleDrop}
                        />
                    ))}
                    {myAnswers.every((a) => a.isUsed) && (
                        <Text style={styles.allUsedText}>
                            {isSinglePlayer
                                ? 'Tüm parçaları yerleştirdin! 🎯'
                                : 'Tüm parçalarını kullandın! 🎯\nOrtağını bekle…'}
                        </Text>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {isSinglePlayer
                        ? '🧑‍🚀 Tek kişilik mod'
                        : myPlayerId === 'playerA'
                        ? '🔵 Sen: Oyuncu A  ·  🟣 Ortak: Oyuncu B'
                        : '🟣 Sen: Oyuncu B  ·  🔵 Ortak: Oyuncu A'}
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0D1A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    exitBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20 },
    exitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    progressBadge: {
        backgroundColor: 'rgba(77, 255, 180, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(77, 255, 180, 0.2)',
    },
    progressText: { color: '#4DFFB4', fontSize: 14, fontWeight: '800' },
    boardSection: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    sectionLabel: {
        fontSize: 14,
        color: '#A2A2D0',
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    divider: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        marginTop: 8,
    },
    dividerText: { color: '#6A6A9B', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
    inventorySection: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
        minHeight: 110,
    },
    blocksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    allUsedText: {
        color: '#4DFFB4',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '800',
        lineHeight: 22,
    },
    footer: { paddingHorizontal: 16, paddingBottom: 20, alignItems: 'center' },
    footerText: { color: '#6A6A9B', fontSize: 12, fontWeight: '600' },
    // Game-over overlay
    outcomeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    outcomeEmoji: { fontSize: 80, marginBottom: 16 },
    outcomeTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    outcomeSubtitle: {
        fontSize: 18,
        color: '#A2A2D0',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 40,
    },
    exitButton: {
        backgroundColor: '#4DFFB4',
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 40,
        shadowColor: '#4DFFB4',
        shadowOpacity: 0.4,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
    },
    exitButtonText: { color: '#0A2A1A', fontWeight: '900', fontSize: 18 },
});
