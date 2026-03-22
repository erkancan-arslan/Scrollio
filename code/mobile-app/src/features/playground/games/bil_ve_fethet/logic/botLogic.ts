import { PlayerId, ProvinceOwnership, TurnResult } from '../types';
import { REGIONS, getAdjacentRegions } from '../data/regions';

const BOT_ACCURACY = 0.60;
const BOT_QUESTIONS_PER_BATTLE = 7;

/** Pick an adjacent non-owned region for a bot to target. Returns null if trapped. */
export const selectBotTarget = (
    botId: PlayerId,
    ownership: ProvinceOwnership
): string | null => {
    const botRegions = REGIONS.filter(r => ownership[r.id] === botId);
    if (botRegions.length === 0) return null;

    const attackable = new Set<string>();
    for (const r of botRegions) {
        for (const adj of getAdjacentRegions(r.id)) {
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
    // Prefer neutral first (free claim), then player, then other bots
    if (neutralTargets.length > 0 && rand < 0.55) return neutralTargets[Math.floor(Math.random() * neutralTargets.length)];
    if (playerTargets.length > 0 && rand < 0.85) return playerTargets[Math.floor(Math.random() * playerTargets.length)];
    if (otherBotTargets.length > 0) return otherBotTargets[Math.floor(Math.random() * otherBotTargets.length)];
    return all[Math.floor(Math.random() * all.length)];
};

/** Simulate a bot's 10-second battle score at 60% accuracy. */
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

/**
 * Run all bot turns (every non-player entry in turnOrder).
 * Neutral targets are claimed for free; enemy-owned targets require a simulated battle.
 */
export const runAllBotTurns = (
    ownership: ProvinceOwnership,
    turnOrder: PlayerId[],
    _currentTurnIndex: number
): { results: TurnResult[]; newOwnership: ProvinceOwnership } => {
    let newOwnership: ProvinceOwnership = { ...ownership };
    const results: TurnResult[] = [];

    for (const botId of turnOrder) {
        if (botId === 'player') continue;

        const target = selectBotTarget(botId, newOwnership);
        if (target === null) continue;

        const targetOwner = newOwnership[target];

        if (targetOwner === 'neutral') {
            // Free claim — no battle needed
            newOwnership = { ...newOwnership, [target]: botId };
            results.push({
                conquered: true,
                attackerScore: 0,
                defenderScore: 0,
                regionId: target,
                attackerId: botId,
                defenderId: 'neutral',
            });
        } else {
            // Battle — simulate both sides
            const attackerScore = simulateBotBattleScore();
            const defenderScore = simulateBotBattleScore();
            const conquered = attackerScore > defenderScore;
            if (conquered) {
                newOwnership = { ...newOwnership, [target]: botId };
            }
            results.push({
                conquered,
                attackerScore,
                defenderScore,
                regionId: target,
                attackerId: botId,
                defenderId: targetOwner as PlayerId,
            });
        }
    }

    return { results, newOwnership };
};
