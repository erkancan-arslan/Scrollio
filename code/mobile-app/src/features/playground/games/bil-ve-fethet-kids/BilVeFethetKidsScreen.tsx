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

import { DESKS, DESK_BY_ID, getAdjacentDesks } from './data/classroom';
import { KIDS_QUESTIONS } from './data/kidsQuestions';
import { KIDS_GUESSING_QUESTIONS } from './data/kidsGuessingQuestions';
import { gameReducer, createInitialState, fisherYates } from './logic/gameReducer';
import { selectBotTarget, simulateBotBattleScore, simulateBotGuess } from './logic/botLogic';
import { ClassroomMap } from './components/ClassroomMap';
import { BattleModal } from '../bil_ve_fethet/components/BattleModal';
import { GuessingModal } from '../bil_ve_fethet/components/GuessingModal';
import { KidsResultOverlay } from './components/KidsResultOverlay';
import { PlayerId, PLAYER_COLORS, NEUTRAL_COLOR } from '../bil_ve_fethet/types';
import { Lang, t, getPlayerLabel } from '../bil_ve_fethet/i18n';

interface BilVeFethetKidsScreenProps {
    onExit: () => void;
}

export const BilVeFethetKidsScreen: React.FC<BilVeFethetKidsScreenProps> = ({ onExit }) => {
    const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
    const [lang, setLang] = useState<Lang>('tr');

    const gameOverFade = useRef(new Animated.Value(0)).current;
    const gameOverScale = useRef(new Animated.Value(0.85)).current;

    // ── Claiming phase: auto-pick for bots ───────────────────────────────────
    useEffect(() => {
        if (state.phase !== 'claiming') return;
        const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
        if (actor === 'player') return;
        const neutralIds = DESKS.filter(d => state.ownership[d.id] === 'neutral').map(d => d.id);
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
                const question = KIDS_GUESSING_QUESTIONS[Math.floor(Math.random() * KIDS_GUESSING_QUESTIONS.length)];
                const botGuess = simulateBotGuess(question.answer);
                const timer = setTimeout(() => {
                    dispatch({ type: 'START_PLAYER_GUESSING_DEFENSE', botId, regionId: target, guessingQuestion: question, botGuess });
                }, 800);
                return () => clearTimeout(timer);
            }
            const botAttackScore = simulateBotBattleScore();
            const deck = fisherYates(Array.from({ length: KIDS_QUESTIONS.length }, (_, i) => i));
            const timer = setTimeout(() => {
                dispatch({ type: 'START_PLAYER_DEFENSE', botId, regionId: target, botAttackScore, shuffledDeck: deck });
            }, 800);
            return () => clearTimeout(timer);
        }

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

    // ── Auto-dismiss bot result ───────────────────────────────────────────────
    useEffect(() => {
        if (state.phase !== 'bot_result') return;
        const timer = setTimeout(() => dispatch({ type: 'BOT_RESULT_NEXT' }), 2500);
        return () => clearTimeout(timer);
    }, [state.phase, state.botTurnIndex]);

    // ── Game over animation ───────────────────────────────────────────────────
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

    // ── Selectable desks ──────────────────────────────────────────────────────
    const selectableIds = useMemo((): string[] => {
        if (state.phase === 'claiming') {
            const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
            if (actor !== 'player') return [];
            return DESKS.filter(d => state.ownership[d.id] === 'neutral').map(d => d.id);
        }

        if (state.phase !== 'selecting') return [];

        const playerDesks = DESKS.filter(d => state.ownership[d.id] === 'player').map(d => d.id);
        const reachable = new Set<string>();
        for (const did of playerDesks) {
            for (const adj of getAdjacentDesks(did)) {
                if (state.ownership[adj.id] !== 'player') {
                    reachable.add(adj.id);
                }
            }
        }
        return Array.from(reachable);
    }, [state.phase, state.ownership, state.claimingTurnIndex, state.turnOrder]);

    // ── Skip if trapped ───────────────────────────────────────────────────────
    useEffect(() => {
        if (state.phase === 'selecting' && selectableIds.length === 0) {
            dispatch({ type: 'SKIP_PLAYER_TURN' } as any);
        }
    }, [state.phase, selectableIds.length]);

    // ── Battle questions ──────────────────────────────────────────────────────
    const battleQuestions = useMemo(() => {
        if (!state.activeBattle) return [];
        return state.shuffledDeck.map(i => KIDS_QUESTIONS[i]).filter(Boolean);
    }, [state.activeBattle?.targetRegionId]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleDeskPress = useCallback((id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (state.phase === 'claiming') {
            dispatch({ type: 'CLAIM_REGION', regionId: id });
        } else {
            dispatch({ type: 'SELECT_ATTACK_TARGET', regionId: id });
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
    const playerDeskCount = useMemo(
        () => Object.values(state.ownership).filter(o => o === 'player').length,
        [state.ownership]
    );

    const targetDesk = state.activeBattle ? DESK_BY_ID[state.activeBattle.targetRegionId] : null;
    const targetDeskName = targetDesk ? `${targetDesk.name} ${t(lang, 'deskSuffix')}` : '';

    const currentBotId = useMemo((): PlayerId | null => {
        if (state.phase !== 'bot_turn' && state.phase !== 'bot_result') return null;
        const bots = state.turnOrder.filter(id => id !== 'player') as PlayerId[];
        const idx = state.phase === 'bot_result' ? state.botTurnIndex - 1 : state.botTurnIndex;
        return bots[idx] ?? null;
    }, [state.phase, state.turnOrder, state.botTurnIndex]);

    const phaseText = useMemo(() => {
        switch (state.phase) {
            case 'claiming': {
                const round = Math.floor(state.claimingTurnIndex / state.turnOrder.length) + 1;
                const totalRounds = Math.ceil(DESKS.length / state.turnOrder.length);
                const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
                const actorLabel = actor === 'player' ? t(lang, 'you') : getPlayerLabel(actor, lang);
                return `${t(lang, 'deskShare')} • ${t(lang, 'round')} ${round}/${totalRounds} — ${actorLabel} ${t(lang, 'picksDesk')}`;
            }
            case 'selecting':
                if (selectableIds.length === 0) return t(lang, 'noDeskMoves');
                return selectableIds.some(id => state.ownership[id] === 'neutral')
                    ? t(lang, 'takeDeskOrAttack')
                    : t(lang, 'attackDeskEnemy');
            case 'battling':
                return `${t(lang, 'attackPhase')} ${targetDeskName}`;
            case 'guessing':
                return `${t(lang, 'guessPhase')} ${targetDeskName}`;
            case 'guessing_result': {
                const deskName = DESK_BY_ID[state.lastGuessingResult?.regionId ?? ''];
                const name = deskName ? `${deskName.name} ${t(lang, 'deskSuffix')}` : '';
                return state.lastGuessingResult?.conquered
                    ? `${name} ${t(lang, 'deskConquered')}`
                    : `${name} ${t(lang, 'deskDefended')}`;
            }
            case 'defending': {
                const attackerLabel = getPlayerLabel(state.activeBattle?.attackerId ?? 'bot1', lang);
                return `🛡️ ${attackerLabel} ${t(lang, 'attackingDefend')}`;
            }
            case 'bot_turn': {
                const bots = state.turnOrder.filter(id => id !== 'player') as PlayerId[];
                const bot = bots[state.botTurnIndex];
                return bot ? `${getPlayerLabel(bot, lang)} ${t(lang, 'playing')}` : t(lang, 'botsPlaying');
            }
            case 'bot_result': {
                if (!state.lastResult) return '';
                const deskName = DESK_BY_ID[state.lastResult.regionId];
                const name = deskName ? `${deskName.name} ${t(lang, 'deskSuffix')}` : '';
                return state.lastResult.conquered
                    ? `⚔️ ${getPlayerLabel(state.lastResult.attackerId as PlayerId, lang)} — ${name} ${t(lang, 'deskConquered')}`
                    : `🛡️ ${name} ${t(lang, 'deskDefended')}`;
            }
            case 'result': {
                const deskName = DESK_BY_ID[state.lastResult?.regionId ?? ''];
                const name = deskName ? `${deskName.name} ${t(lang, 'deskSuffix')}` : '';
                return state.lastResult?.conquered
                    ? `${name} ${t(lang, 'deskConquered')}`
                    : `${name} ${t(lang, 'deskDefended')}`;
            }
            case 'game_over':
                return state.winner === 'player' ? `🏆 ${t(lang, 'allDesksYours')}` : `💀 ${t(lang, 'eliminated')}`;
            default:
                return '';
        }
    }, [state.phase, state.lastResult, state.lastGuessingResult, state.winner, selectableIds, state.ownership, state.activeBattle, state.botTurnIndex, state.turnOrder, state.claimingTurnIndex, targetDeskName, lang]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* HUD */}
            <View style={styles.hud}>
                <TouchableOpacity onPress={onExit} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={26} color="#333" />
                </TouchableOpacity>
                <Text style={styles.hudTitle}>{t(lang, 'kidsGameTitle')}</Text>
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
                                ? `${t(lang, 'claiming')} ${state.claimingTurnIndex}/${DESKS.length}`
                                : `${t(lang, 'desks')} ${playerDeskCount}/${DESKS.length}`}
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

            {/* Classroom map */}
            <View style={styles.mapContainer}>
                <ClassroomMap
                    ownership={state.ownership}
                    selectableIds={selectableIds}
                    onDeskPress={handleDeskPress}
                    phase={state.phase}
                />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {(['player', 'bot1', 'bot2'] as PlayerId[]).map(pid => {
                    const count = Object.values(state.ownership).filter(o => o === pid).length;
                    const eliminated = !state.turnOrder.includes(pid);
                    return (
                        <View key={pid} style={[styles.legendItem, { opacity: eliminated ? 0.3 : 1 }]}>
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
                        {t(lang, 'empty')}: {Object.values(state.ownership).filter(o => o === 'neutral').length}
                    </Text>
                </View>
            </View>

            {/* Battle Modal — player attacking */}
            <BattleModal
                visible={state.phase === 'battling'}
                attackerId={state.activeBattle?.attackerId ?? 'player'}
                defenderId={state.activeBattle?.defenderId ?? 'neutral'}
                targetProvinceName={targetDeskName}
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
                defenderId='player'
                targetProvinceName={targetDeskName}
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
                targetProvinceName={targetDeskName}
                question={state.guessingQuestion}
                botGuess={state.botGuess}
                guessingResult={state.lastGuessingResult}
                onSubmit={handleGuessingSubmit}
                onContinue={handleGuessingContinue}
                isDefending={state.activeBattle?.defenderId === 'player'}
                lang={lang}
            />

            {/* Player result overlay */}
            {state.lastResult && state.phase === 'result' && (
                <KidsResultOverlay
                    visible={true}
                    result={state.lastResult}
                    onContinue={handleContinue}
                    lang={lang}
                />
            )}

            {/* Bot result overlay (auto-dismisses) */}
            {state.lastResult && state.phase === 'bot_result' && (
                <KidsResultOverlay
                    visible={true}
                    result={state.lastResult}
                    onContinue={handleBotResultNext}
                    lang={lang}
                />
            )}

            {/* Game Over */}
            {state.phase === 'game_over' && (
                <Animated.View style={[styles.gameOverOverlay, { opacity: gameOverFade }]}>
                    <Animated.View
                        style={[styles.gameOverCard, { transform: [{ scale: gameOverScale }] }]}
                    >
                        <Text style={styles.gameOverEmoji}>
                            {state.winner === 'player' ? '🏆' : '💀'}
                        </Text>
                        <Text style={styles.gameOverTitle}>
                            {state.winner === 'player' ? t(lang, 'allDesksYours') : t(lang, 'eliminated')}
                        </Text>
                        <Text style={styles.gameOverSub}>
                            {state.winner === 'player'
                                ? `${playerDeskCount} ${t(lang, 'desksControlled')}`
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
        backgroundColor: '#F5ECD7',
    },
    hud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 4,
        height: 52,
        backgroundColor: '#F5ECD7',
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center' },
    hudTitle: { color: '#3D2B1A', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    hudRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    langBtn: {
        backgroundColor: '#E8D5B0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C8A870',
    },
    langBtnText: {
        color: '#5C3D1E',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    hudBadge: {
        backgroundColor: '#E8D5B0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C8A870',
    },
    hudBadgeText: { color: '#3D2B1A', fontSize: 13, fontWeight: '700' },
    turnBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    turnDot: { width: 12, height: 12, borderRadius: 6 },
    turnBannerText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    phaseBar: {
        backgroundColor: '#EDD9A3',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#C8A870',
    },
    phaseText: { color: '#5C3D1E', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    mapContainer: { flex: 1 },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: '#EDD9A3',
        borderTopWidth: 1,
        borderTopColor: '#C8A870',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: '#5C3D1E', fontSize: 12, fontWeight: '600' },
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.88)',
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
    gameOverEmoji: { fontSize: 64 },
    gameOverTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    gameOverSub: { color: '#8E8E93', fontSize: 15, textAlign: 'center', marginBottom: 8 },
    restartBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 48,
        width: '100%',
        alignItems: 'center',
    },
    restartBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    exitBtn: {
        backgroundColor: '#E8D5B0',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 48,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C8A870',
    },
    exitBtnText: { color: '#5C3D1E', fontSize: 16, fontWeight: '600' },
});
