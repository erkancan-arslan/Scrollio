import { GameDefinition, GameConfig } from '../../platform/types';

interface KidsRegistryState {
    deskCount: number;
}

export const BilVeFethetKidsGame: GameDefinition<KidsRegistryState> & { icon: string } = {
    id: 'bil_ve_fethet_kids',
    title: 'Sınıfı Fethet!',
    description: 'Sınıftaki sıraları fethet! Soruları doğru yanıtla, 15 sıranın tamamını ele geçir.',
    icon: '🏫',
    categories: ['logic', 'challenges', 'kids'],
    modes: ['single'],
    minPlayers: 1,
    maxPlayers: 1,

    createInitialState: (_config: GameConfig) => ({ deskCount: 0 }),
    getScore: (state) => state.deskCount,
    isGameOver: (_state) => false,

    UI: {
        Screen: (() => null) as any,
    },
};
