import { DESKS } from '../data/classroom';
import { KIDS_QUESTIONS } from '../data/kidsQuestions';
import { KIDS_GUESSING_QUESTIONS } from '../data/kidsGuessingQuestions';
import { simulateBotBattleScore, simulateBotGuess } from './botLogic';
import {
    BilVeFethetState,
    BattleState,
    TurnResult,
    GuessingQuestion,
    GuessingResult,
    PlayerId,
    ProvinceOwnership,
} from '../../../games/bil_ve_fethet/types';

export const fisherYates = (arr: number[]): number[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const countDesksFor = (ownership: ProvinceOwnership, pid: PlayerId | 'neutral') =>
    Object.values(ownership).filter(o => o === pid).length;

const pickGuessingQuestion = (): GuessingQuestion =>
    KIDS_GUESSING_QUESTIONS[Math.floor(Math.random() * KIDS_GUESSING_QUESTIONS.length)];

/** Returns true if the attacker won the guessing round. Tie → defender wins. */
export const resolveGuessingRound = (
    playerGuess: number,
    botGuess: number,
    correctAnswer: number,
    attackerId: PlayerId,
): { conquered: boolean; tie: boolean; playerDistance: number; botDistance: number } => {
    const playerDistance = Math.abs(playerGuess - correctAnswer);
    const botDistance = Math.abs(botGuess - correctAnswer);

    // Perfect answer by the PLAYER always means PLAYER wins, regardless of role.
    // If player is attacking: they conquer. If player is defending: they hold.
    if (playerDistance === 0) {
        const conquered = attackerId === 'player'; // attacker wins only if player is attacking
        return { conquered, tie: false, playerDistance, botDistance };
    }

    const tie = playerDistance === botDistance;

    let attackerWon: boolean;
    if (tie) {
        attackerWon = false; // defender wins ties
    } else if (attackerId === 'player') {
        attackerWon = playerDistance < botDistance;
    } else {
        // Bot is attacking — player wins (defends) if player is closer
        attackerWon = botDistance < playerDistance;
    }

    return { conquered: attackerWon, tie, playerDistance, botDistance };
};

const DECK_SIZE = KIDS_QUESTIONS.length;

export type GameAction =
    | { type: 'CLAIM_REGION'; regionId: string }
    | { type: 'SELECT_ATTACK_TARGET'; regionId: string }
    | { type: 'SUBMIT_BATTLE_ANSWER'; isCorrect: boolean }
    | { type: 'BATTLE_TIME_UP' }
    | { type: 'SUBMIT_DEFENSE_ANSWER'; isCorrect: boolean }
    | { type: 'DEFENSE_TIME_UP' }
    | { type: 'ACKNOWLEDGE_RESULT' }
    | { type: 'SUBMIT_GUESS'; playerGuess: number }
    | { type: 'ACKNOWLEDGE_GUESSING_RESULT' }
    | { type: 'START_PLAYER_GUESSING_DEFENSE'; botId: PlayerId; regionId: string; guessingQuestion: GuessingQuestion; botGuess: number }
    | { type: 'BOT_NEUTRAL_CLAIM'; botId: PlayerId; regionId: string }
    | { type: 'BOT_SKIP' }
    | { type: 'START_PLAYER_DEFENSE'; botId: PlayerId; regionId: string; botAttackScore: number; shuffledDeck: number[] }
    | { type: 'BOT_BATTLE_RESULT'; botId: PlayerId; regionId: string; targetOwner: PlayerId; attackerScore: number; defenderScore: number }
    | { type: 'BOT_RESULT_NEXT' }
    | { type: 'ALL_BOTS_DONE' }
    | { type: 'SKIP_PLAYER_TURN' }
    | { type: 'RESTART_GAME' };

export const createInitialState = (): BilVeFethetState => {
    const ownership: ProvinceOwnership = {};
    DESKS.forEach(d => (ownership[d.id] = 'neutral'));

    return {
        phase: 'claiming',
        turnOrder: ['player', 'bot1', 'bot2'],
        currentTurnIndex: 0,
        ownership,
        activeBattle: null,
        lastResult: null,
        winner: null,
        shuffledDeck: [],
        botTurnIndex: 0,
        claimingTurnIndex: 0,
        guessingQuestion: null,
        botGuess: null,
        lastGuessingResult: null,
    };
};

const checkWin = (
    ownership: ProvinceOwnership,
    turnOrder: PlayerId[]
): PlayerId | null => {
    for (const pid of turnOrder) {
        if (countDesksFor(ownership, pid) === DESKS.length) return pid;
    }
    if (turnOrder.length === 1) return turnOrder[0];
    return null;
};

export const gameReducer = (
    state: BilVeFethetState,
    action: GameAction
): BilVeFethetState => {
    switch (action.type) {

        case 'CLAIM_REGION': {
            if (state.phase !== 'claiming') return state;
            if (state.ownership[action.regionId] !== 'neutral') return state;

            const actor = state.turnOrder[state.claimingTurnIndex % state.turnOrder.length];
            const newOwnership = { ...state.ownership, [action.regionId]: actor };
            const nextIndex = state.claimingTurnIndex + 1;

            if (nextIndex >= DESKS.length) {
                return { ...state, ownership: newOwnership, phase: 'selecting', claimingTurnIndex: nextIndex, botTurnIndex: 0 };
            }
            return { ...state, ownership: newOwnership, claimingTurnIndex: nextIndex };
        }

        case 'SELECT_ATTACK_TARGET': {
            if (state.phase !== 'selecting') return state;
            const { regionId } = action;
            const targetOwner = state.ownership[regionId];

            if (targetOwner === 'player') return state;

            if (targetOwner === 'neutral') {
                const newOwnership = { ...state.ownership, [regionId]: 'player' as PlayerId };
                const winner = checkWin(newOwnership, state.turnOrder);
                if (winner) {
                    return { ...state, ownership: newOwnership, phase: 'game_over', winner, lastResult: null };
                }
                return { ...state, ownership: newOwnership, phase: 'bot_turn', lastResult: null, botTurnIndex: 0 };
            }

            const useGuessing = Math.random() < 0.5;

            if (useGuessing) {
                const question = pickGuessingQuestion();
                const botGuess = simulateBotGuess(question.answer);
                const battle: BattleState = {
                    attackerId: 'player',
                    defenderId: targetOwner as PlayerId,
                    targetRegionId: regionId,
                    attackerScore: 0,
                    defenderScore: 0,
                };
                return { ...state, phase: 'guessing', activeBattle: battle, guessingQuestion: question, botGuess };
            }

            const deck = fisherYates(Array.from({ length: DECK_SIZE }, (_, i) => i));
            const battle: BattleState = {
                attackerId: 'player',
                defenderId: targetOwner as PlayerId,
                targetRegionId: regionId,
                attackerScore: 0,
                defenderScore: 0,
            };
            return { ...state, phase: 'battling', activeBattle: battle, shuffledDeck: deck };
        }

        case 'SUBMIT_BATTLE_ANSWER': {
            if (state.phase !== 'battling' || !state.activeBattle) return state;
            const prev = state.activeBattle.attackerScore;
            const next = action.isCorrect ? prev + 1 : Math.max(0, prev - 1);
            return { ...state, activeBattle: { ...state.activeBattle, attackerScore: next } };
        }

        case 'BATTLE_TIME_UP': {
            if (state.phase !== 'battling' || !state.activeBattle) return state;

            const { attackerScore, defenderId, targetRegionId, attackerId } = state.activeBattle;
            const defenderScore = simulateBotBattleScore();
            const conquered = attackerScore > defenderScore;

            const newOwnership = { ...state.ownership };
            if (conquered) newOwnership[targetRegionId] = 'player';

            const result: TurnResult = { conquered, attackerScore, defenderScore, regionId: targetRegionId, attackerId, defenderId };

            const winner = checkWin(newOwnership, state.turnOrder);
            if (winner) {
                return { ...state, ownership: newOwnership, activeBattle: null, lastResult: result, winner, phase: 'game_over' };
            }
            return { ...state, ownership: newOwnership, activeBattle: null, lastResult: result, phase: 'result', botTurnIndex: 0 };
        }

        case 'SUBMIT_DEFENSE_ANSWER': {
            if (state.phase !== 'defending' || !state.activeBattle) return state;
            const prev = state.activeBattle.defenderScore;
            const next = action.isCorrect ? prev + 1 : Math.max(0, prev - 1);
            return { ...state, activeBattle: { ...state.activeBattle, defenderScore: next } };
        }

        case 'DEFENSE_TIME_UP': {
            if (state.phase !== 'defending' || !state.activeBattle) return state;

            const { attackerScore, defenderScore, attackerId, defenderId, targetRegionId } = state.activeBattle;
            const conquered = attackerScore > defenderScore;

            const newOwnership = { ...state.ownership };
            if (conquered) newOwnership[targetRegionId] = attackerId;

            const result: TurnResult = { conquered, attackerScore, defenderScore, regionId: targetRegionId, attackerId, defenderId };

            if (countDesksFor(newOwnership, 'player') === 0) {
                return { ...state, ownership: newOwnership, activeBattle: null, lastResult: result, phase: 'game_over', winner: attackerId };
            }

            const winner = checkWin(newOwnership, state.turnOrder);
            if (winner) {
                return { ...state, ownership: newOwnership, activeBattle: null, lastResult: result, phase: 'game_over', winner };
            }

            return { ...state, ownership: newOwnership, activeBattle: null, lastResult: result, phase: 'result', botTurnIndex: state.botTurnIndex + 1 };
        }

        case 'SUBMIT_GUESS': {
            if (state.phase !== 'guessing' || !state.activeBattle || !state.guessingQuestion || state.botGuess === null) return state;

            const { playerGuess } = action;
            const { attackerId, defenderId, targetRegionId } = state.activeBattle;
            const { answer } = state.guessingQuestion;
            const botGuess = state.botGuess;

            const { conquered, tie, playerDistance, botDistance } = resolveGuessingRound(
                playerGuess, botGuess, answer, attackerId,
            );

            const newOwnership = { ...state.ownership };
            if (conquered) newOwnership[targetRegionId] = attackerId;

            if (conquered && countDesksFor(newOwnership, 'player') === 0) {
                const winner = (state.turnOrder.find(p => p !== 'player') ?? 'bot1') as PlayerId;
                return { ...state, ownership: newOwnership, activeBattle: null, guessingQuestion: null, botGuess: null, phase: 'game_over', winner };
            }

            const winner = checkWin(newOwnership, state.turnOrder);
            if (winner) {
                return { ...state, ownership: newOwnership, activeBattle: null, guessingQuestion: null, botGuess: null, phase: 'game_over', winner };
            }

            const guessingResult: GuessingResult = {
                playerGuess, botGuess, correctAnswer: answer,
                conquered, regionId: targetRegionId,
                attackerId, defenderId, tie, playerDistance, botDistance,
            };

            return {
                ...state,
                ownership: newOwnership,
                activeBattle: null,
                guessingQuestion: null,
                botGuess: null,
                lastGuessingResult: guessingResult,
                phase: 'guessing_result',
                botTurnIndex: defenderId === 'player' ? state.botTurnIndex : 0,
            };
        }

        case 'ACKNOWLEDGE_GUESSING_RESULT': {
            if (state.phase !== 'guessing_result') return state;
            const wasDefense = state.lastGuessingResult?.defenderId === 'player';
            return { ...state, phase: 'bot_turn', lastGuessingResult: null, botTurnIndex: wasDefense ? state.botTurnIndex : 0 };
        }

        case 'START_PLAYER_GUESSING_DEFENSE': {
            const { botId, regionId, guessingQuestion, botGuess } = action;
            const battle: BattleState = {
                attackerId: botId,
                defenderId: 'player',
                targetRegionId: regionId,
                attackerScore: 0,
                defenderScore: 0,
            };
            return { ...state, phase: 'guessing', activeBattle: battle, guessingQuestion, botGuess };
        }

        case 'ACKNOWLEDGE_RESULT': {
            if (state.phase !== 'result') return state;
            const wasDefense = state.lastResult?.defenderId === 'player';
            return { ...state, phase: 'bot_turn', activeBattle: null, lastResult: null, botTurnIndex: wasDefense ? state.botTurnIndex : 0 };
        }

        case 'BOT_NEUTRAL_CLAIM': {
            const { botId, regionId } = action;
            const newOwnership = { ...state.ownership, [regionId]: botId };
            const winner = checkWin(newOwnership, state.turnOrder);
            if (winner) {
                return { ...state, ownership: newOwnership, phase: 'game_over', winner };
            }
            return { ...state, ownership: newOwnership, botTurnIndex: state.botTurnIndex + 1 };
        }

        case 'BOT_SKIP':
            return { ...state, botTurnIndex: state.botTurnIndex + 1 };

        case 'START_PLAYER_DEFENSE': {
            const { botId, regionId, botAttackScore, shuffledDeck } = action;
            const battle: BattleState = {
                attackerId: botId,
                defenderId: 'player',
                targetRegionId: regionId,
                attackerScore: botAttackScore,
                defenderScore: 0,
            };
            return { ...state, phase: 'defending', activeBattle: battle, shuffledDeck };
        }

        case 'BOT_BATTLE_RESULT': {
            const { botId, regionId, targetOwner, attackerScore, defenderScore } = action;
            const conquered = attackerScore > defenderScore;

            const newOwnership = { ...state.ownership };
            if (conquered) newOwnership[regionId] = botId;

            const result: TurnResult = { conquered, attackerScore, defenderScore, regionId, attackerId: botId, defenderId: targetOwner };

            const winner = checkWin(newOwnership, state.turnOrder);
            if (winner) {
                return { ...state, ownership: newOwnership, lastResult: result, phase: 'game_over', winner, botTurnIndex: state.botTurnIndex + 1 };
            }
            return { ...state, ownership: newOwnership, lastResult: result, phase: 'bot_result', botTurnIndex: state.botTurnIndex + 1 };
        }

        case 'BOT_RESULT_NEXT':
            return { ...state, phase: 'bot_turn', lastResult: null };

        case 'ALL_BOTS_DONE': {
            const newTurnOrder = state.turnOrder.filter(pid =>
                pid === 'player' || countDesksFor(state.ownership, pid) > 0
            );

            if (countDesksFor(state.ownership, 'player') === 0) {
                const winner = (newTurnOrder.find(pid => pid !== 'player') ?? 'bot1') as PlayerId;
                return { ...state, turnOrder: newTurnOrder, phase: 'game_over', winner, botTurnIndex: 0 };
            }

            const winner = checkWin(state.ownership, newTurnOrder);
            if (winner) {
                return { ...state, turnOrder: newTurnOrder, phase: 'game_over', winner, botTurnIndex: 0 };
            }

            return { ...state, turnOrder: newTurnOrder, currentTurnIndex: 0, phase: 'selecting', lastResult: null, botTurnIndex: 0 };
        }

        case 'SKIP_PLAYER_TURN': {
            if (state.phase !== 'selecting') return state;
            if (state.turnOrder.length === 1) return state;
            return { ...state, phase: 'bot_turn', lastResult: null, botTurnIndex: 0 };
        }

        case 'RESTART_GAME':
            return createInitialState();

        default:
            return state;
    }
};
