import { GameDefinition, GameConfig } from '../../platform/types';

/** Minimal state type used only for registry compliance. Game is standalone. */
interface BilVeFethetRegistryState {
    provinceCount: number;
}

export const BilVeFethetGame: GameDefinition<BilVeFethetRegistryState> & { icon: string } = {
    id: 'bil_ve_fethet',
    title: 'Bil ve Fethet',
    description: 'Türkiye haritasını fethet! Soruları doğru yanıtla, 81 ili ele geçir.',
    icon: '🗺️',
    categories: ['logic', 'challenges'],
    modes: ['single'],
    minPlayers: 1,
    maxPlayers: 1,

    createInitialState: (_config: GameConfig) => ({ provinceCount: 0 }),
    getScore: (state) => state.provinceCount,
    isGameOver: (_state) => false, // Lifecycle managed by BilVeFethetScreen, not GameShell

    UI: {
        // Never rendered — PlaygroundScreen routes directly to BilVeFethetScreen
        Screen: (() => null) as any,
    },
};
