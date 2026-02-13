
import { GameDefinition, GameId } from './types';

// Registry map to hold all game definitions
const gameRegistry: Partial<Record<GameId, GameDefinition<any, any>>> = {};

/**
 * Register a game definition.
 * Should be called at app startup or when game bundle is loaded.
 */
export const registerGame = <S, C>(definition: GameDefinition<S, C>) => {
    if (gameRegistry[definition.id]) {
        console.warn(`Game ${definition.id} is already registered. Overwriting.`);
    }
    gameRegistry[definition.id] = definition;
};

/**
 * Get a game definition by ID.
 * Throws error if game is not registered.
 */
export const getGameDefinition = (gameId: GameId): GameDefinition<any, any> => {
    const def = gameRegistry[gameId];
    if (!def) {
        throw new Error(`Game definition not found for id: ${gameId}. Make sure it is registered/imported.`);
    }
    return def;
};

/**
 * Get all registered games, optionally filtered by category.
 */
export const listGames = (category?: string) => {
    const games = Object.values(gameRegistry) as GameDefinition<any, any>[];
    if (category) {
        return games.filter(g => g.categories.includes(category as any));
    }
    return games;
};

/**
 * Helper to check if a game is registered.
 */
export const isGameRegistered = (gameId: GameId): boolean => {
    return !!gameRegistry[gameId];
};
