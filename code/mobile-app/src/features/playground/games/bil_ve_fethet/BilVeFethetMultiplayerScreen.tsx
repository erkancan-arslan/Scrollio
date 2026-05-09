import React, {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { INFINITE_FLOW_QUESTIONS_ENGLISH } from '../../data/infiniteFlowQuestions';
import { REGIONS, REGION_BY_ID, getAdjacentRegions } from './data/regions';
import { gameReducer, createInitialState, fisherYates } from './logic/gameReducer';
import { selectBotTarget, simulateBotBattleScore } from './logic/botLogic';
import { TurkeyMap } from './components/TurkeyMap';
import { BattleModal } from './components/BattleModal';
import { ResultOverlay } from './components/ResultOverlay';
import {
    PlayerId,
    PLAYER_COLORS,
    PLAYER_LABELS,
    NEUTRAL_COLOR,
    BilVeFethetState,
} from './types';
import {
    bvfMultiplayerService,
    PlayerActionPayload,
    PlayerMap,
} from './services/multiplayerService';

interface Props {
    roomCode: string;
    mySlot: PlayerId;
    isHost: boolean;
    playerMap: PlayerMap;
    onExit: () => void;
}

export const BilVeFethetMultiplayerScreen: React.FC<Props> = ({
    roomCode,
    mySlot,
    isHost,
    playerMap,
    onExit,
}) => {
    // ── Host: owns the reducer ────────────────────────────────────────────────
    const [hostState, hostDispatch] = useReducer(gameReducer, undefined, createInitialState);

    // ── Non-host: receives state from channel ────────────────────────────────
    const [remoteState, setRemoteState] = useState<BilVeFethetState | null>(null);
    const [remotePlayerMap, setRemotePlayerMap] = useState<PlayerMap>(playerMap);

    // Non-host: local "waiting for ack" flag (prevents double-send)
    const [waitingForAck, setWaitingForAck] = useState(false);

    // State used for rendering
    const state: BilVeFethetState | null = isHost ? hostState : remoteState;
    const effectivePlayerMap: PlayerMap = isHost ? playerMap : remotePlayerMap;

    // Game over animation
    const gameOverFade = useRef(new Animated.Value(0)).current;
    const gameOverScale = useRef(new Animated.Value(0.85)).current;

    // stateRef always points to current host state (used in callbacks to avoid stale closure)
    const stateRef = useRef<BilVeFethetState>(hostState);
    stateRef.current = hostState;

    // playerMapRef tracks latest playerMap without causing effect re-runs
    const playerMapRef = useRef<PlayerMap>(playerMap);
    playerMapRef.current = playerMap;

    // Track whether a human player's action was received (prevents double-fire with timeout)
    const humanActionReceivedRef = useRef(false);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            bvfMultiplayerService.cleanup();
        };
    }, []);

    // ── Host: broadcast state whenever it changes ────────────────────────────
    const prevStateRef = useRef<BilVeFethetState | null>(null);
    useEffect(() => {
        if (!isHost) return;
        if (prevStateRef.current === hostState) return;
        prevStateRef.current = hostState;
        bvfMultiplayerService.broadcastGameState(roomCode, hostState, playerMap);
    }, [hostState, isHost, roomCode, playerMap]);

    // ── Handle incoming player action (host only) ────────────────────────────
    const handleRemotePlayerAction = useCallback((action: PlayerActionPayload) => {
        const { fromPlayerId, regionId, type } = action;
        const currentState = stateRef.current;

        // Claiming phase: any neutral region pick
        if (type === 'CLAIM_REGION') {
            if (currentState.phase !== 'claiming') return;
            const actor = currentState.turnOrder[currentState.claimingTurnIndex % currentState.turnOrder.length];
            if (actor !== fromPlayerId) return;
            if (currentState.ownership[regionId] !== 'neutral') return;
            humanActionReceivedRef.current = true;
            hostDispatch({ type: 'CLAIM_REGION', regionId });
            return;
        }

        // Battle phase: SELECT_TARGET
        if (currentState.phase !== 'bot_turn') return;
        const bots = currentState.turnOrder.filter(id => id !== 'player') as PlayerId[];
        if (bots[currentState.botTurnIndex] !== fromPlayerId) return;

        humanActionReceivedRef.current = true;

        const targetOwner = currentState.ownership[regionId];
        if (targetOwner === 'neutral') {
            hostDispatch({ type: 'BOT_NEUTRAL_CLAIM', botId: fromPlayerId, regionId });
        } else if (targetOwner === 'player') {
            const botAttackScore = simulateBotBattleScore();
            const deck = fisherYates(
                Array.from({ length: INFINITE_FLOW_QUESTIONS_ENGLISH.length }, (_, i) => i),
            );
            hostDispatch({
                type: 'START_PLAYER_DEFENSE',
                botId: fromPlayerId,
                regionId,
                botAttackScore,
                shuffledDeck: deck,
            });
        } else {
            const attackerScore = simulateBotBattleScore();
            const defenderScore = simulateBotBattleScore();
            hostDispatch({
                type: 'BOT_BATTLE_RESULT',
                botId: fromPlayerId,
                regionId,
                targetOwner: targetOwner as PlayerId,
                attackerScore,
                defenderScore,
            });
        }
    }, []);

    // ── Subscribe to game channel ────────────────────────────────────────────
    useEffect(() => {
        if (isHost) {
            bvfMultiplayerService.joinGame(
                roomCode,
                () => {},
                handleRemotePlayerAction,
                () => {
                    // Non-host has subscribed and requested current state — re-broadcast
                    bvfMultiplayerService.broadcastGameState(roomCode, stateRef.current, playerMapRef.current);
                },
            );
        } else {
            bvfMultiplayerService.joinGame(
                roomCode,
                (payload) => {
                    setRemoteState(payload.state);
                    setRemotePlayerMap(payload.playerMap);
                    // Reset ack on new state from host
                    setWaitingForAck(false);
                },
                () => {},
                // no onSyncRequest → service will send request_sync on subscribe
            );
        }
    }, [isHost, roomCode, handleRemotePlayerAction]);

    // ── Bot turn driver (host only) ──────────────────────────────────────────
    useEffect(() => {
        if (!isHost || hostState.phase !== 'bot_turn') return;

        const bots = hostState.turnOrder.filter(id => id !== 'player') as PlayerId[];

        if (hostState.botTurnIndex >= bots.length) {
            hostDispatch({ type: 'ALL_BOTS_DONE' });
            return;
        }

        const botId = bots[hostState.botTurnIndex];
        const isHuman = effectivePlayerMap[botId] !== null;

        if (isHuman) {
            // Wait for non-host to send an action; 60s timeout → BOT_SKIP
            humanActionReceivedRef.current = false;
            const timer = setTimeout(() => {
                if (!humanActionReceivedRef.current) {
                    hostDispatch({ type: 'BOT_SKIP' });
                }
            }, 60000);
            return () => clearTimeout(timer);
        }

        // AI bot logic
        const target = selectBotTarget(botId, hostState.ownership);
        if (!target) {
            hostDispatch({ type: 'BOT_SKIP' });
            return;
        }

        const targetOwner = hostState.ownership[target];

        if (targetOwner === 'neutral') {
            const timer = setTimeout(() => {
                hostDispatch({ type: 'BOT_NEUTRAL_CLAIM', botId, regionId: target });
            }, 700);
            return () => clearTimeout(timer);
        }

        if (targetOwner === 'player') {
            const botAttackScore = simulateBotBattleScore();
            const deck = fisherYates(
                Array.from({ length: INFINITE_FLOW_QUESTIONS_ENGLISH.length }, (_, i) => i),
            );
            const timer = setTimeout(() => {
                hostDispatch({
                    type: 'START_PLAYER_DEFENSE',
                    botId,
                    regionId: target,
                    botAttackScore,
                    shuffledDeck: deck,
                });
            }, 800);
            return () => clearTimeout(timer);
        }

        const attackerScore = simulateBotBattleScore();
        const defenderScore = simulateBotBattleScore();
        const timer = setTimeout(() => {
            hostDispatch({
                type: 'BOT_BATTLE_RESULT',
                botId,
                regionId: target,
                targetOwner: targetOwner as PlayerId,
                attackerScore,
                defenderScore,
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [
        hostState.phase,
        hostState.botTurnIndex,
        hostState.turnOrder,
        hostState.ownership,
        isHost,
        effectivePlayerMap,
    ]);

    // ── Claiming phase driver (host only) ────────────────────────────────────
    useEffect(() => {
        if (!isHost || hostState.phase !== 'claiming') return;
        const actor = hostState.turnOrder[hostState.claimingTurnIndex % hostState.turnOrder.length];
        const isHuman = effectivePlayerMap[actor] !== null;

        if (isHuman) {
            // Wait for the human player to send CLAIM_REGION; 60s timeout → pick random neutral
            humanActionReceivedRef.current = false;
            const timer = setTimeout(() => {
                if (!humanActionReceivedRef.current) {
                    const neutralIds = REGIONS.filter(r => hostState.ownership[r.id] === 'neutral').map(r => r.id);
                    if (neutralIds.length > 0) {
                        const pick = neutralIds[Math.floor(Math.random() * neutralIds.length)];
                        hostDispatch({ type: 'CLAIM_REGION', regionId: pick });
                    }
                }
            }, 60000);
            return () => clearTimeout(timer);
        }

        // AI bot: pick random neutral region after 700ms
        const neutralIds = REGIONS.filter(r => hostState.ownership[r.id] === 'neutral').map(r => r.id);
        if (neutralIds.length === 0) return;
        const pick = neutralIds[Math.floor(Math.random() * neutralIds.length)];
        const timer = setTimeout(() => {
            hostDispatch({ type: 'CLAIM_REGION', regionId: pick });
        }, 700);
        return () => clearTimeout(timer);
    }, [
        isHost,
        hostState.phase,
        hostState.claimingTurnIndex,
        hostState.turnOrder,
        hostState.ownership,
        effectivePlayerMap,
    ]);

    // ── Auto-dismiss bot_result (host only) ──────────────────────────────────
    useEffect(() => {
        if (!isHost || hostState.phase !== 'bot_result') return;
        const timer = setTimeout(() => {
            hostDispatch({ type: 'BOT_RESULT_NEXT' });
        }, 2500);
        return () => clearTimeout(timer);
    }, [hostState.phase, hostState.botTurnIndex, isHost]);

    // ── Game over entrance animation + haptic ────────────────────────────────
    const renderPhase = isHost ? hostState.phase : remoteState?.phase;
    useEffect(() => {
        if (renderPhase !== 'game_over') return;
        gameOverFade.setValue(0);
        gameOverScale.setValue(0.85);
        const winner = isHost ? hostState.winner : remoteState?.winner;
        Haptics.notificationAsync(
            winner === mySlot
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Error,
        );
        Animated.parallel([
            Animated.timing(gameOverFade, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(gameOverScale, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
        ]).start();
    }, [renderPhase]);

    // ── Skip player turn when no selectable regions (host only) ─────────────
    const hostSelectableRegionIds = useMemo((): string[] => {
        if (!isHost) return [];
        if (hostState.phase === 'claiming') {
            const actor = hostState.turnOrder[hostState.claimingTurnIndex % hostState.turnOrder.length];
            if (actor !== 'player') return [];
            return REGIONS.filter(r => hostState.ownership[r.id] === 'neutral').map(r => r.id);
        }
        if (hostState.phase !== 'selecting') return [];
        const playerRegions = REGIONS.filter(r => hostState.ownership[r.id] === 'player').map(r => r.id);
        const reachable = new Set<string>();
        for (const rid of playerRegions) {
            for (const adj of getAdjacentRegions(rid)) {
                if (hostState.ownership[adj.id] !== 'player') reachable.add(adj.id);
            }
        }
        return Array.from(reachable);
    }, [isHost, hostState.phase, hostState.claimingTurnIndex, hostState.turnOrder, hostState.ownership]);

    useEffect(() => {
        if (!isHost) return;
        if (hostState.phase === 'selecting' && hostSelectableRegionIds.length === 0) {
            hostDispatch({ type: 'SKIP_PLAYER_TURN' } as any);
        }
    }, [isHost, hostState.phase, hostSelectableRegionIds.length]);

    // ── Non-host: detect own turn and compute selectable regions ─────────────
    const isMyTurn = useMemo(() => {
        if (isHost || !remoteState) return false;
        if (remoteState.phase === 'claiming') {
            const actor = remoteState.turnOrder[remoteState.claimingTurnIndex % remoteState.turnOrder.length];
            return actor === mySlot;
        }
        if (remoteState.phase !== 'bot_turn') return false;
        const bots = remoteState.turnOrder.filter(id => id !== 'player') as PlayerId[];
        return bots[remoteState.botTurnIndex] === mySlot;
    }, [remoteState, mySlot, isHost]);

    const mySelectableRegions = useMemo(() => {
        if (!isMyTurn || !remoteState) return [];
        if (remoteState.phase === 'claiming') {
            return REGIONS.filter(r => remoteState.ownership[r.id] === 'neutral').map(r => r.id);
        }
        const myRegions = REGIONS.filter(r => remoteState.ownership[r.id] === mySlot).map(r => r.id);
        const reachable = new Set<string>();
        for (const rid of myRegions) {
            for (const adj of getAdjacentRegions(rid)) {
                if (remoteState.ownership[adj.id] !== mySlot) reachable.add(adj.id);
            }
        }
        return Array.from(reachable);
    }, [isMyTurn, remoteState, mySlot]);

    // ── Battle questions (host only, used in BattleModal) ───────────────────
    const battleQuestions = useMemo(() => {
        if (!isHost || !hostState.activeBattle) return [];
        return hostState.shuffledDeck.map(i => INFINITE_FLOW_QUESTIONS_ENGLISH[i]).filter(Boolean);
    }, [isHost, hostState.activeBattle?.targetRegionId, hostState.shuffledDeck]);

    // ── Derived: player name labels ───────────────────────────────────────────
    const getLabel = useCallback(
        (slot: PlayerId): string => {
            const p = effectivePlayerMap[slot];
            if (p) return p.displayName;
            return slot === 'player' ? 'Ev Sahibi' : slot === 'bot1' ? 'Bot 1' : 'Bot 2';
        },
        [effectivePlayerMap],
    );

    // ── Derived display values ────────────────────────────────────────────────
    const renderState = state; // alias for clarity

    const playerRegionCount = useMemo(() => {
        if (!renderState) return 0;
        const hostSlot = 'player';
        return Object.values(renderState.ownership).filter(o => o === hostSlot).length;
    }, [renderState]);

    const myRegionCount = useMemo(() => {
        if (!renderState) return 0;
        return Object.values(renderState.ownership).filter(o => o === mySlot).length;
    }, [renderState, mySlot]);

    const targetRegion = renderState?.activeBattle
        ? REGION_BY_ID[renderState.activeBattle.targetRegionId]
        : null;

    const currentBotId = useMemo((): PlayerId | null => {
        if (!renderState) return null;
        if (renderState.phase !== 'bot_turn' && renderState.phase !== 'bot_result') return null;
        const bots = renderState.turnOrder.filter(id => id !== 'player') as PlayerId[];
        const idx =
            renderState.phase === 'bot_result' ? renderState.botTurnIndex - 1 : renderState.botTurnIndex;
        return bots[idx] ?? null;
    }, [renderState]);

    const selectableRegionIds = useMemo(() => {
        if (!renderState) return [];
        if (isHost) return hostSelectableRegionIds;
        if (isMyTurn && !waitingForAck) return mySelectableRegions;
        return [];
    }, [isHost, renderState, hostSelectableRegionIds, isMyTurn, waitingForAck, mySelectableRegions, renderState?.claimingTurnIndex]);

    const phaseText = useMemo(() => {
        if (!renderState) return '';
        switch (renderState.phase) {
            case 'claiming': {
                const round = Math.floor(renderState.claimingTurnIndex / renderState.turnOrder.length) + 1;
                const totalRounds = Math.ceil(REGIONS.length / renderState.turnOrder.length);
                const actor = renderState.turnOrder[renderState.claimingTurnIndex % renderState.turnOrder.length];
                const actorLabel = getLabel(actor);
                return `Harita Paylaşımı • Tur ${round}/${totalRounds} — ${actorLabel} bölge seçiyor`;
            }
            case 'selecting':
                if (selectableRegionIds.length === 0) return 'Hareket edilecek bölge yok…';
                const hasNeutral = selectableRegionIds.some(id => renderState.ownership[id] === 'neutral');
                return hasNeutral ? 'Nötr bölge al veya rakibe saldır' : 'Rakip bölgeye saldır';
            case 'battling':
                return `Saldırı: ${targetRegion?.name ?? ''}`;
            case 'defending': {
                const attackerLabel = getLabel(renderState.activeBattle?.attackerId ?? 'bot1');
                return `${attackerLabel} sana saldırıyor! Savun!`;
            }
            case 'bot_turn': {
                const bots = renderState.turnOrder.filter(id => id !== 'player') as PlayerId[];
                const bot = bots[renderState.botTurnIndex];
                return bot ? `${getLabel(bot)} oynuyor…` : 'Sıra devam ediyor…';
            }
            case 'bot_result':
                if (!renderState.lastResult) return '';
                return renderState.lastResult.conquered
                    ? `${getLabel(renderState.lastResult.attackerId as PlayerId)} ${REGION_BY_ID[renderState.lastResult.regionId]?.name ?? ''}'ı fethetti!`
                    : `${REGION_BY_ID[renderState.lastResult.regionId]?.name ?? ''} savunuldu!`;
            case 'result':
                return renderState.lastResult?.conquered
                    ? `${REGION_BY_ID[renderState.lastResult.regionId]?.name ?? ''} fethedildi!`
                    : `${REGION_BY_ID[renderState.lastResult?.regionId ?? '']?.name ?? ''} savunuldu!`;
            case 'game_over':
                if (!renderState.winner) return 'Oyun bitti!';
                return getLabel(renderState.winner) + ' kazandı!';
            default:
                return '';
        }
    }, [renderState, selectableRegionIds, targetRegion, getLabel, renderState?.claimingTurnIndex]);

    // ── Handlers (host) ──────────────────────────────────────────────────────
    const handleRegionPress = useCallback(
        (regionId: string) => {
            if (!isHost) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (hostState.phase === 'claiming') {
                hostDispatch({ type: 'CLAIM_REGION', regionId });
            } else {
                hostDispatch({ type: 'SELECT_ATTACK_TARGET', regionId });
            }
        },
        [isHost, hostState.phase],
    );

    const handleNonHostRegionPress = useCallback(
        (regionId: string) => {
            if (isHost || !isMyTurn || waitingForAck) return;
            if (!remoteState) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (remoteState.phase === 'claiming') {
                bvfMultiplayerService.sendPlayerAction(roomCode, {
                    fromPlayerId: mySlot,
                    type: 'CLAIM_REGION',
                    regionId,
                });
            } else {
                bvfMultiplayerService.sendPlayerAction(roomCode, {
                    fromPlayerId: mySlot,
                    type: 'SELECT_TARGET',
                    regionId,
                });
            }
            setWaitingForAck(true);
        },
        [isHost, isMyTurn, waitingForAck, remoteState, roomCode, mySlot],
    );

    const handleAnswer = useCallback((isCorrect: boolean) => {
        hostDispatch({ type: 'SUBMIT_BATTLE_ANSWER', isCorrect });
    }, []);

    const handleTimeUp = useCallback(() => {
        hostDispatch({ type: 'BATTLE_TIME_UP' });
    }, []);

    const handleDefenseAnswer = useCallback((isCorrect: boolean) => {
        hostDispatch({ type: 'SUBMIT_DEFENSE_ANSWER', isCorrect });
    }, []);

    const handleDefenseTimeUp = useCallback(() => {
        hostDispatch({ type: 'DEFENSE_TIME_UP' });
    }, []);

    const handleContinue = useCallback(() => {
        hostDispatch({ type: 'ACKNOWLEDGE_RESULT' });
    }, []);

    const handleBotResultNext = useCallback(() => {
        hostDispatch({ type: 'BOT_RESULT_NEXT' });
    }, []);

    // ── Loading state (non-host waiting for first broadcast) ─────────────────
    if (!isHost && remoteState === null) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.hud}>
                    <TouchableOpacity onPress={onExit} style={styles.backBtn}>
                        <Ionicons name="close" size={26} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.hudTitle}>Bil ve Fethet • Çok Oyunculu</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#007AFF" size="large" />
                    <Text style={styles.loadingText}>Oyun yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!renderState) return null;

    // ── Main render ───────────────────────────────────────────────────────────
    const myCount = isHost ? playerRegionCount : myRegionCount;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HUD */}
            <View style={styles.hud}>
                <TouchableOpacity
                    onPress={onExit}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.hudTitle}>Bil ve Fethet • Çok Oyunculu</Text>
                <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeText}>
                        {renderState.phase === 'claiming' ? '📍' : '🗺️'} {myCount}/12
                    </Text>
                </View>
            </View>

            {/* Claiming turn banner */}
            {renderState.phase === 'claiming' && (() => {
                const actor = renderState.turnOrder[renderState.claimingTurnIndex % renderState.turnOrder.length];
                const color = PLAYER_COLORS[actor];
                return (
                    <View style={[styles.turnBanner, { backgroundColor: color + '22', borderColor: color }]}>
                        <View style={[styles.turnDot, { backgroundColor: color }]} />
                        <Text style={[styles.turnBannerText, { color }]}>
                            {actor === mySlot ? 'Senin Seçimin!' : `${getLabel(actor)} Seçiyor…`}
                        </Text>
                    </View>
                );
            })()}

            {/* Turn banner */}
            {(renderState.phase === 'selecting' || renderState.phase === 'battling') && (
                <View
                    style={[
                        styles.turnBanner,
                        {
                            backgroundColor: PLAYER_COLORS.player + '22',
                            borderColor: PLAYER_COLORS.player,
                        },
                    ]}
                >
                    <View style={[styles.turnDot, { backgroundColor: PLAYER_COLORS.player }]} />
                    <Text style={[styles.turnBannerText, { color: PLAYER_COLORS.player }]}>
                        {getLabel('player')} Oynuyor
                    </Text>
                </View>
            )}
            {(renderState.phase === 'bot_turn' || renderState.phase === 'bot_result') &&
                currentBotId && (
                    <View
                        style={[
                            styles.turnBanner,
                            {
                                backgroundColor: PLAYER_COLORS[currentBotId] + '22',
                                borderColor: PLAYER_COLORS[currentBotId],
                            },
                        ]}
                    >
                        <View
                            style={[styles.turnDot, { backgroundColor: PLAYER_COLORS[currentBotId] }]}
                        />
                        <Text
                            style={[styles.turnBannerText, { color: PLAYER_COLORS[currentBotId] }]}
                        >
                            {getLabel(currentBotId)}'in Turu
                            {isMyTurn ? ' — Senin Turun!' : ''}
                        </Text>
                    </View>
                )}
            {renderState.phase === 'defending' && renderState.activeBattle && (
                <View
                    style={[
                        styles.turnBanner,
                        { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' },
                    ]}
                >
                    <View style={[styles.turnDot, { backgroundColor: '#FF3B30' }]} />
                    <Text style={[styles.turnBannerText, { color: '#FF3B30' }]}>
                        {getLabel(renderState.activeBattle.attackerId)} saldırıyor — Savun!
                    </Text>
                </View>
            )}

            {/* "Your turn" highlight for non-hosts */}
            {isMyTurn && !waitingForAck && (
                <View style={styles.myTurnBanner}>
                    <Text style={styles.myTurnText}>
                        {remoteState?.phase === 'claiming'
                            ? 'Senin Seçimin! Bir bölge al.'
                            : 'Senin Turun! Bir bölgeye dokun.'}
                    </Text>
                </View>
            )}
            {isMyTurn && waitingForAck && (
                <View style={styles.myTurnBanner}>
                    <ActivityIndicator color="#34C759" size="small" style={{ marginRight: 8 }} />
                    <Text style={[styles.myTurnText, { color: '#34C759' }]}>Hamlen işleniyor...</Text>
                </View>
            )}

            {/* Phase bar */}
            <View style={styles.phaseBar}>
                <Text style={styles.phaseText} numberOfLines={1}>
                    {phaseText}
                </Text>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <TurkeyMap
                    ownership={renderState.ownership}
                    selectableRegionIds={selectableRegionIds}
                    onRegionPress={isHost ? handleRegionPress : handleNonHostRegionPress}
                    phase={renderState.phase}
                />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {(['player', 'bot1', 'bot2'] as PlayerId[]).map((pid) => {
                    const count = Object.values(renderState.ownership).filter(o => o === pid).length;
                    const eliminated = !renderState.turnOrder.includes(pid);
                    return (
                        <View
                            key={pid}
                            style={[styles.legendItem, { opacity: eliminated ? 0.3 : 1 }]}
                        >
                            <View
                                style={[styles.legendDot, { backgroundColor: PLAYER_COLORS[pid] }]}
                            />
                            <Text style={styles.legendText}>
                                {getLabel(pid)}: {count}
                            </Text>
                        </View>
                    );
                })}
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: NEUTRAL_COLOR }]} />
                    <Text style={styles.legendText}>
                        Nötr: {Object.values(renderState.ownership).filter(o => o === 'neutral').length}
                    </Text>
                </View>
            </View>

            {/* Battle Modal — host attacking */}
            {isHost && (
                <BattleModal
                    visible={hostState.phase === 'battling'}
                    attackerId={hostState.activeBattle?.attackerId ?? 'player'}
                    defenderId={hostState.activeBattle?.defenderId ?? 'neutral'}
                    targetProvinceName={targetRegion?.name ?? ''}
                    currentScore={hostState.activeBattle?.attackerScore ?? 0}
                    questions={battleQuestions}
                    onAnswer={handleAnswer}
                    onTimeUp={handleTimeUp}
                    isDefending={false}
                />
            )}

            {/* Battle Modal — host defending */}
            {isHost && (
                <BattleModal
                    visible={hostState.phase === 'defending'}
                    attackerId={hostState.activeBattle?.attackerId ?? 'bot1'}
                    defenderId={'player'}
                    targetProvinceName={targetRegion?.name ?? ''}
                    currentScore={hostState.activeBattle?.defenderScore ?? 0}
                    questions={battleQuestions}
                    onAnswer={handleDefenseAnswer}
                    onTimeUp={handleDefenseTimeUp}
                    isDefending={true}
                />
            )}

            {/* Player Result Overlay */}
            {isHost && hostState.lastResult && hostState.phase === 'result' && (
                <ResultOverlay visible={true} result={hostState.lastResult} onContinue={handleContinue} />
            )}

            {/* Bot Result Overlay */}
            {isHost && hostState.lastResult && hostState.phase === 'bot_result' && (
                <ResultOverlay
                    visible={true}
                    result={hostState.lastResult}
                    onContinue={handleBotResultNext}
                />
            )}

            {/* Non-host result overlay */}
            {!isHost && remoteState?.lastResult && remoteState.phase === 'result' && (
                <ResultOverlay
                    visible={true}
                    result={remoteState.lastResult}
                    onContinue={() => {}}
                />
            )}
            {!isHost && remoteState?.lastResult && remoteState.phase === 'bot_result' && (
                <ResultOverlay
                    visible={true}
                    result={remoteState.lastResult}
                    onContinue={() => {}}
                />
            )}

            {/* Game Over */}
            {renderState.phase === 'game_over' && (
                <Animated.View style={[styles.gameOverOverlay, { opacity: gameOverFade }]}>
                    <Animated.View
                        style={[styles.gameOverCard, { transform: [{ scale: gameOverScale }] }]}
                    >
                        <Text style={styles.gameOverEmoji}>
                            {renderState.winner === mySlot ? '🏆' : '💀'}
                        </Text>
                        <Text style={styles.gameOverTitle}>
                            {renderState.winner === mySlot
                                ? 'Kazandın!'
                                : renderState.winner
                                ? `${getLabel(renderState.winner)} Kazandı!`
                                : 'Oyun Bitti!'}
                        </Text>
                        <Text style={styles.gameOverSub}>
                            {renderState.winner === mySlot
                                ? `${myCount} bölgeye hükmediyorsun`
                                : renderState.winner
                                ? `${getLabel(renderState.winner)} tüm bölgeleri fethetti`
                                : ''}
                        </Text>
                        <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
                            <Text style={styles.exitBtnText}>Ana Menüye Dön</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    hud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 4,
        height: 52,
    },
    backBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
    },
    hudTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
        flex: 1,
        textAlign: 'center',
    },
    hudBadge: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    hudBadgeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    turnBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderBottomWidth: 1,
    },
    turnDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    turnBannerText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    myTurnBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34C75922',
        borderBottomWidth: 1,
        borderBottomColor: '#34C759',
        paddingVertical: 7,
    },
    myTurnText: {
        color: '#34C759',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    phaseBar: {
        backgroundColor: '#0D0D0D',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    phaseText: {
        color: '#AEAEB2',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    mapContainer: {
        flex: 1,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: '#0D0D0D',
        borderTopWidth: 1,
        borderTopColor: '#1C1C1E',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        color: '#AEAEB2',
        fontSize: 11,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '600',
    },
    // Game Over
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 300,
    },
    gameOverCard: {
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 14,
        width: '100%',
    },
    gameOverEmoji: {
        fontSize: 64,
    },
    gameOverTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    gameOverSub: {
        color: '#8E8E93',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 8,
    },
    exitBtn: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 48,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    exitBtnText: {
        color: '#AEAEB2',
        fontSize: 16,
        fontWeight: '600',
    },
});
