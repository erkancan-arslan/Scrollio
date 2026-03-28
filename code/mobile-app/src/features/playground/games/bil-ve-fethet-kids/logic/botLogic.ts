import { PlayerId, ProvinceOwnership } from '../../../games/bil_ve_fethet/types';
import { DESKS, getAdjacentDesks } from '../data/classroom';

const BOT_ACCURACY = 0.60;
const BOT_QUESTIONS_PER_BATTLE = 7;

/** Pick an adjacent non-owned desk for a bot to target. Returns null if trapped. */
export const selectBotTarget = (
    botId: PlayerId,
    ownership: ProvinceOwnership
): string | null => {
    const botDesks = DESKS.filter(d => ownership[d.id] === botId);
    if (botDesks.length === 0) return null;

    const attackable = new Set<string>();
    for (const d of botDesks) {
        for (const adj of getAdjacentDesks(d.id)) {
            if (ownership[adj.id] !== botId) {
                attackable.add(adj.id);
            }
        }
    }

    if (attackable.size === 0) return null;

    const all = Array.from(attackable);
    const neutralTargets = all.filter(id => ownership[id] === 'neutral');
    const playerTargets = all.filter(id => ownership[id] === 'player');
    const otherBotTargets = all.filter(id => {
        const o = ownership[id];
        return o !== 'player' && o !== 'neutral' && o !== botId;
    });

    const rand = Math.random();
    if (neutralTargets.length > 0 && rand < 0.55) return neutralTargets[Math.floor(Math.random() * neutralTargets.length)];
    if (playerTargets.length > 0 && rand < 0.85) return playerTargets[Math.floor(Math.random() * playerTargets.length)];
    if (otherBotTargets.length > 0) return otherBotTargets[Math.floor(Math.random() * otherBotTargets.length)];
    return all[Math.floor(Math.random() * all.length)];
};

/** Simulate a bot's guess for a numeric question. Applies ±25% variance (min ±5). */
export const simulateBotGuess = (correctAnswer: number): number => {
    const maxVariance = Math.max(Math.round(correctAnswer * 0.25), 5);
    const variance = Math.floor(Math.random() * (maxVariance * 2 + 1)) - maxVariance;
    return Math.max(1, correctAnswer + variance);
};

/** Simulate a bot's battle score at 60% accuracy. */
export const simulateBotBattleScore = (): number => {
    let score = 0;
    for (let i = 0; i < BOT_QUESTIONS_PER_BATTLE; i++) {
        if (Math.random() < BOT_ACCURACY) {
            score += 1;
        } else {
            score = Math.max(0, score - 1);
        }
    }
    return score;
};
