import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { INFINITE_FLOW_QUESTIONS_ENGLISH } from '../../data/infiniteFlowQuestions';
import { INFINITE_FLOW_QUESTIONS_TURKISH } from '../../data/infiniteFlowQuestionsTr';
import { REGIONS, REGION_BY_ID, getAdjacentRegions } from './data/regions';
import { GUESSING_QUESTIONS } from './data/guessingQuestions';
import { gameReducer, createInitialState, fisherYates } from './logic/gameReducer';
import { selectBotTarget, simulateBotBattleScore, simulateBotGuess } from './logic/botLogic';
import { TurkeyMap } from './components/TurkeyMap';
import { BattleModal } from './components/BattleModal';
import { GuessingModal } from './components/GuessingModal';
import { ResultOverlay } from './components/ResultOverlay';
import { PlayerId, PLAYER_COLORS, NEUTRAL_COLOR } from './types';
import { Lang, t, getPlayerLabel } from './i18n';

interface BilVeFethetScreenProps {
    onExit: () => void;
}

export const BilVeFethetScreen: React.FC<BilVeFethetScreenProps> = ({ onExit }) => {
    const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
    const [lang, setLang] = useState<Lang>('tr');

    // Game over entrance animation
    const gameOverFade = useRef(new Animated.Value(0)).current;
    const gameOverScale = useRef(new Animated.Value(0.85)).current;

    // ── Claiming phase: auto-pick for bots ───────────────────────────────────
    useEffect(() => {
        if (state.phase !== 'claiming') return;
        const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
        if (actor === 'player') return; // player picks manually
        const neutralIds = REGIONS.filter(r => state.ownership[r.id] === 'neutral').map(r => r.id);
        if (neutralIds.length === 0) return;
        const pick = neutralIds[Math.floor(Math.random() * neutralIds.length)];
        const timer = setTimeout(() => dispatch({ type: 'CLAIM_REGION', regionId: pick }), 700);
        return () => clearTimeout(timer);
    }, [state.phase, state.claimingTurnIndex]);

    // ── Sequential bot turn driver ────────────────────────────────────────────
    useEffect(() => {
        if (state.phase !== 'bot_turn') return;

        const bots = state.turnOrder.filter(id => id !== 'player') as PlayerId[];

        if (state.botTurnIndex >= bots.length) {
            dispatch({ type: 'ALL_BOTS_DONE' });
            return;
        }

        const botId = bots[state.botTurnIndex];
        const target = selectBotTarget(botId, state.ownership);

        if (!target) {
            dispatch({ type: 'BOT_SKIP' });
            return;
        }

        const targetOwner = state.ownership[target];

        if (targetOwner === 'neutral') {
            const timer = setTimeout(() => {
                dispatch({ type: 'BOT_NEUTRAL_CLAIM', botId, regionId: target });
            }, 700);
            return () => clearTimeout(timer);
        }

        if (targetOwner === 'player') {
            const useGuessing = Math.random() < 0.5;
            if (useGuessing) {
                const question = GUESSING_QUESTIONS[Math.floor(Math.random() * GUESSING_QUESTIONS.length)];
                const botGuess = simulateBotGuess(question.answer);
                const timer = setTimeout(() => {
                    dispatch({ type: 'START_PLAYER_GUESSING_DEFENSE', botId, regionId: target, guessingQuestion: question, botGuess });
                }, 800);
                return () => clearTimeout(timer);
            }
            const botAttackScore = simulateBotBattleScore();
            const deck = fisherYates(Array.from({ length: INFINITE_FLOW_QUESTIONS_ENGLISH.length }, (_, i) => i));
            const timer = setTimeout(() => {
                dispatch({ type: 'START_PLAYER_DEFENSE', botId, regionId: target, botAttackScore, shuffledDeck: deck });
            }, 800);
            return () => clearTimeout(timer);
        }

        // Bot vs another bot — simulate and show result
        const attackerScore = simulateBotBattleScore();
        const defenderScore = simulateBotBattleScore();
        const timer = setTimeout(() => {
            dispatch({
                type: 'BOT_BATTLE_RESULT',
                botId,
                regionId: target,
                targetOwner: targetOwner as PlayerId,
                attackerScore,
                defenderScore,
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [state.phase, state.botTurnIndex, state.turnOrder, state.ownership]);

    // ── Auto-dismiss bot vs bot result after 2.5s ─────────────────────────────
    useEffect(() => {
        if (state.phase !== 'bot_result') return;
        const timer = setTimeout(() => {
            dispatch({ type: 'BOT_RESULT_NEXT' });
        }, 2500);
        return () => clearTimeout(timer);
    }, [state.phase, state.botTurnIndex]);

    // ── Game over entrance animation + haptic ─────────────────────────────────
    useEffect(() => {
        if (state.phase !== 'game_over') return;
        gameOverFade.setValue(0);
        gameOverScale.setValue(0.85);
        Haptics.notificationAsync(
            state.winner === 'player'
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Error,
        );
        Animated.parallel([
            Animated.timing(gameOverFade, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(gameOverScale, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
        ]).start();
    }, [state.phase]);

    // ── Selectable regions ────────────────────────────────────────────────────
    const selectableRegionIds = useMemo((): string[] => {
        // Claiming phase: player can pick any neutral region on their turn
        if (state.phase === 'claiming') {
            const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
            if (actor !== 'player') return [];
            return REGIONS.filter(r => state.ownership[r.id] === 'neutral').map(r => r.id);
        }

        if (state.phase !== 'selecting') return [];

        const playerRegions = REGIONS
            .filter(r => state.ownership[r.id] === 'player')
            .map(r => r.id);

        const reachable = new Set<string>();
        for (const rid of playerRegions) {
            for (const adj of getAdjacentRegions(rid)) {
                if (state.ownership[adj.id] !== 'player') {
                    reachable.add(adj.id);
                }
            }
        }
        return Array.from(reachable);
    }, [state.phase, state.ownership, state.claimingTurnIndex, state.turnOrder]);

    // ── Detect player trapped (no moves) ─────────────────────────────────────
    useEffect(() => {
        if (state.phase === 'selecting' && selectableRegionIds.length === 0) {
            dispatch({ type: 'SKIP_PLAYER_TURN' } as any);
        }
    }, [state.phase, selectableRegionIds.length]);

    // ── Battle questions ──────────────────────────────────────────────────────
    const battleQuestions = useMemo(() => {
        if (!state.activeBattle) return [];
        const source = lang === 'tr' ? INFINITE_FLOW_QUESTIONS_TURKISH : INFINITE_FLOW_QUESTIONS_ENGLISH;
        return state.shuffledDeck.map(i => source[i % source.length]).filter(Boolean);
    }, [state.activeBattle?.targetRegionId, lang]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleRegionPress = useCallback((regionId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (state.phase === 'claiming') {
            dispatch({ type: 'CLAIM_REGION', regionId });
        } else {
            dispatch({ type: 'SELECT_ATTACK_TARGET', regionId });
        }
    }, [state.phase]);

    const handleAnswer = useCallback((isCorrect: boolean) => {
        dispatch({ type: 'SUBMIT_BATTLE_ANSWER', isCorrect });
    }, []);

    const handleTimeUp = useCallback(() => {
        dispatch({ type: 'BATTLE_TIME_UP' });
    }, []);

    const handleDefenseAnswer = useCallback((isCorrect: boolean) => {
        dispatch({ type: 'SUBMIT_DEFENSE_ANSWER', isCorrect });
    }, []);

    const handleDefenseTimeUp = useCallback(() => {
        dispatch({ type: 'DEFENSE_TIME_UP' });
    }, []);

    const handleGuessingSubmit = useCallback((playerGuess: number) => {
        dispatch({ type: 'SUBMIT_GUESS', playerGuess });
    }, []);

    const handleGuessingContinue = useCallback(() => {
        dispatch({ type: 'ACKNOWLEDGE_GUESSING_RESULT' });
    }, []);

    const handleContinue = useCallback(() => {
        dispatch({ type: 'ACKNOWLEDGE_RESULT' });
    }, []);

    const handleBotResultNext = useCallback(() => {
        dispatch({ type: 'BOT_RESULT_NEXT' });
    }, []);

    const handleRestart = useCallback(() => {
        dispatch({ type: 'RESTART_GAME' });
    }, []);

    // ── Derived values ────────────────────────────────────────────────────────
    const playerRegionCount = useMemo(
        () => Object.values(state.ownership).filter(o => o === 'player').length,
        [state.ownership]
    );

    const targetRegion = state.activeBattle
        ? REGION_BY_ID[state.activeBattle.targetRegionId]
        : null;

    const currentBotId = useMemo((): PlayerId | null => {
        if (state.phase !== 'bot_turn' && state.phase !== 'bot_result') return null;
        const bots = state.turnOrder.filter(id => id !== 'player') as PlayerId[];
        // In bot_result, botTurnIndex was already incremented, so show previous bot
        const idx = state.phase === 'bot_result' ? state.botTurnIndex - 1 : state.botTurnIndex;
        return bots[idx] ?? null;
    }, [state.phase, state.turnOrder, state.botTurnIndex]);

    const phaseText = useMemo(() => {
        switch (state.phase) {
            case 'claiming': {
                const round = Math.floor(state.claimingTurnIndex / state.turnOrder.length) + 1;
                const totalRounds = Math.ceil(REGIONS.length / state.turnOrder.length);
                const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
                const actorLabel = actor === 'player' ? t(lang, 'you') : getPlayerLabel(actor, lang);
                return `${t(lang, 'mapShare')} • ${t(lang, 'round')} ${round}/${totalRounds} — ${actorLabel} ${t(lang, 'picksRegion')}`;
            }
            case 'selecting':
                if (selectableRegionIds.length === 0) return t(lang, 'noMoves');
                return selectableRegionIds.some(id => state.ownership[id] === 'neutral')
                    ? t(lang, 'takeNeutralOrAttack')
                    : t(lang, 'attackEnemy');
            case 'battling':
                return `${t(lang, 'attackPhase')} ${targetRegion?.name ?? ''}`;
            case 'guessing':
                return `${t(lang, 'guessPhase')} ${targetRegion?.name ?? ''}`;
            case 'guessing_result':
                return state.lastGuessingResult?.conquered
                    ? `${REGION_BY_ID[state.lastGuessingResult.regionId]?.name} ${t(lang, 'conquered')}`
                    : `${REGION_BY_ID[state.lastGuessingResult?.regionId ?? '']?.name} ${t(lang, 'defended')}`;
            case 'defending': {
                const attackerLabel = getPlayerLabel(state.activeBattle?.attackerId ?? 'bot1', lang);
                return `🛡️ ${attackerLabel} ${t(lang, 'attackingDefend')}`;
            }
            case 'bot_turn': {
                const bots = state.turnOrder.filter(id => id !== 'player') as PlayerId[];
                const bot = bots[state.botTurnIndex];
                return bot ? `${getPlayerLabel(bot, lang)} ${t(lang, 'playing')}` : t(lang, 'botsPlaying');
            }
            case 'bot_result':
                if (!state.lastResult) return '';
                return state.lastResult.conquered
                    ? `⚔️ ${getPlayerLabel(state.lastResult.attackerId as PlayerId, lang)} — ${REGION_BY_ID[state.lastResult.regionId]?.name} ${t(lang, 'conquered')}`
                    : `🛡️ ${REGION_BY_ID[state.lastResult.regionId]?.name} ${t(lang, 'defended')}`;
            case 'result':
                return state.lastResult?.conquered
                    ? `${REGION_BY_ID[state.lastResult.regionId]?.name} ${t(lang, 'conquered')}`
                    : `${REGION_BY_ID[state.lastResult?.regionId ?? '']?.name} ${t(lang, 'defended')}`;
            case 'game_over':
                return state.winner === 'player' ? `🏆 ${t(lang, 'allRegionsYours')}` : `💀 ${t(lang, 'eliminated')}`;
            default:
                return '';
        }
    }, [state.phase, state.lastResult, state.lastGuessingResult, state.winner, selectableRegionIds, state.ownership, state.activeBattle, state.botTurnIndex, state.turnOrder, state.claimingTurnIndex, targetRegion, lang]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HUD */}
            <View style={styles.hud}>
                <TouchableOpacity onPress={onExit} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.hudTitle}>{t(lang, 'gameTitle')}</Text>
                <View style={styles.hudRight}>
                    <TouchableOpacity
                        onPress={() => setLang(l => l === 'tr' ? 'en' : 'tr')}
                        style={styles.langBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.langBtnText}>{t(lang, 'langBtn')}</Text>
                    </TouchableOpacity>
                    <View style={styles.hudBadge}>
                        <Text style={styles.hudBadgeText}>
                            {state.phase === 'claiming'
                                ? `${t(lang, 'claiming')} ${state.claimingTurnIndex}/12`
                                : `${t(lang, 'regions')} ${playerRegionCount}/12`}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Turn indicator */}
            {state.phase === 'claiming' && (() => {
                const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
                const color = PLAYER_COLORS[actor];
                const label = actor === 'player' ? t(lang, 'yourChoice') : `${getPlayerLabel(actor, lang)} ${t(lang, 'choosing')}`;
                return (
                    <View style={[styles.turnBanner, { backgroundColor: color + '22', borderColor: color }]}>
                        <View style={[styles.turnDot, { backgroundColor: color }]} />
                        <Text style={[styles.turnBannerText, { color }]}>{label}</Text>
                    </View>
                );
            })()}
            {(state.phase === 'selecting' || state.phase === 'battling') && (
                <View style={[styles.turnBanner, { backgroundColor: PLAYER_COLORS.player + '22', borderColor: PLAYER_COLORS.player }]}>
                    <View style={[styles.turnDot, { backgroundColor: PLAYER_COLORS.player }]} />
                    <Text style={[styles.turnBannerText, { color: PLAYER_COLORS.player }]}>{t(lang, 'yourTurn')}</Text>
                </View>
            )}
            {(state.phase === 'bot_turn' || state.phase === 'bot_result') && currentBotId && (
                <View style={[styles.turnBanner, { backgroundColor: PLAYER_COLORS[currentBotId] + '22', borderColor: PLAYER_COLORS[currentBotId] }]}>
                    <View style={[styles.turnDot, { backgroundColor: PLAYER_COLORS[currentBotId] }]} />
                    <Text style={[styles.turnBannerText, { color: PLAYER_COLORS[currentBotId] }]}>{getPlayerLabel(currentBotId, lang)}{t(lang, 'sTurn')}</Text>
                </View>
            )}
            {state.phase === 'defending' && state.activeBattle && (
                <View style={[styles.turnBanner, { backgroundColor: '#FF3B3022', borderColor: '#FF3B30' }]}>
                    <View style={[styles.turnDot, { backgroundColor: '#FF3B30' }]} />
                    <Text style={[styles.turnBannerText, { color: '#FF3B30' }]}>
                        {getPlayerLabel(state.activeBattle.attackerId, lang)} {t(lang, 'attackingDefend')}
                    </Text>
                </View>
            )}

            {/* Phase bar */}
            <View style={styles.phaseBar}>
                <Text style={styles.phaseText} numberOfLines={1}>{phaseText}</Text>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <TurkeyMap
                    ownership={state.ownership}
                    selectableRegionIds={selectableRegionIds}
                    onRegionPress={handleRegionPress}
                    phase={state.phase}
                />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {(['player', 'bot1', 'bot2'] as PlayerId[]).map(pid => {
                    const count = Object.values(state.ownership).filter(o => o === pid).length;
                    const eliminated = !state.turnOrder.includes(pid);
                    return (
                        <View
                            key={pid}
                            style={[styles.legendItem, { opacity: eliminated ? 0.3 : 1 }]}
                        >
                            <View style={[styles.legendDot, { backgroundColor: PLAYER_COLORS[pid] }]} />
                            <Text style={styles.legendText}>
                                {getPlayerLabel(pid, lang)}: {count}
                            </Text>
                        </View>
                    );
                })}
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: NEUTRAL_COLOR }]} />
                    <Text style={styles.legendText}>
                        {t(lang, 'neutral')}: {Object.values(state.ownership).filter(o => o === 'neutral').length}
                    </Text>
                </View>
            </View>

            {/* Battle Modal — player attacking */}
            <BattleModal
                visible={state.phase === 'battling'}
                attackerId={state.activeBattle?.attackerId ?? 'player'}
                defenderId={state.activeBattle?.defenderId ?? 'neutral'}
                targetProvinceName={targetRegion?.name ?? ''}
                currentScore={state.activeBattle?.attackerScore ?? 0}
                questions={battleQuestions}
                onAnswer={handleAnswer}
                onTimeUp={handleTimeUp}
                isDefending={false}
                lang={lang}
            />

            {/* Battle Modal — player defending */}
            <BattleModal
                visible={state.phase === 'defending'}
                attackerId={state.activeBattle?.attackerId ?? 'bot1'}
                defenderId={'player'}
                targetProvinceName={targetRegion?.name ?? ''}
                currentScore={state.activeBattle?.defenderScore ?? 0}
                questions={battleQuestions}
                onAnswer={handleDefenseAnswer}
                onTimeUp={handleDefenseTimeUp}
                isDefending={true}
                lang={lang}
            />

            {/* Guessing Modal */}
            <GuessingModal
                visible={state.phase === 'guessing' || state.phase === 'guessing_result'}
                attackerId={state.activeBattle?.attackerId ?? 'player'}
                defenderId={state.activeBattle?.defenderId ?? 'neutral'}
                targetProvinceName={targetRegion?.name ?? ''}
                question={state.guessingQuestion}
                botGuess={state.botGuess}
                guessingResult={state.lastGuessingResult}
                onSubmit={handleGuessingSubmit}
                onContinue={handleGuessingContinue}
                isDefending={state.activeBattle?.defenderId === 'player'}
                lang={lang}
            />

            {/* Player Result Overlay (player attacked or defended) */}
            {state.lastResult && state.phase === 'result' && (
                <ResultOverlay
                    visible={true}
                    result={state.lastResult}
                    onContinue={handleContinue}
                    lang={lang}
                />
            )}

            {/* Bot Result Overlay (bot vs bot, auto-dismisses) */}
            {state.lastResult && state.phase === 'bot_result' && (
                <ResultOverlay
                    visible={true}
                    result={state.lastResult}
                    onContinue={handleBotResultNext}
                    lang={lang}
                />
            )}

            {/* Game Over Overlay */}
            {state.phase === 'game_over' && (
                <Animated.View style={[styles.gameOverOverlay, { opacity: gameOverFade }]}>
                    <Animated.View
                        style={[styles.gameOverCard, { transform: [{ scale: gameOverScale }] }]}
                    >
                        <Text style={styles.gameOverEmoji}>
                            {state.winner === 'player' ? '🏆' : '💀'}
                        </Text>
                        <Text style={styles.gameOverTitle}>
                            {state.winner === 'player' ? t(lang, 'allRegionsYours') : t(lang, 'eliminated')}
                        </Text>
                        <Text style={styles.gameOverSub}>
                            {state.winner === 'player'
                                ? `${playerRegionCount} ${t(lang, 'regionsControlled')}`
                                : state.winner
                                ? `${getPlayerLabel(state.winner as PlayerId, lang)} ${t(lang, 'won')}`
                                : ''}
                        </Text>
                        <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
                            <Text style={styles.restartBtnText}>{t(lang, 'playAgain')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
                            <Text style={styles.exitBtnText}>{t(lang, 'backToMenu')}</Text>
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
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    hudRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    langBtn: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#48484A',
    },
    langBtnText: {
        color: '#AEAEB2',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
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
        fontSize: 12,
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
    restartBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 48,
        width: '100%',
        alignItems: 'center',
    },
    restartBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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
