import { GameDefinition, GameConfig } from '../../platform/types';
import { CoopGameState } from './types';

/** Minimal registry state — actual state is managed inside the standalone screen */
interface SpaceRepairRegistryState {
    filledSlots: number;
}

export const SpaceRepairKidsGame: GameDefinition<SpaceRepairRegistryState> & { icon: string } = {
    id: 'space_repair_kids',
    title: 'Uzay Gemisi Tamiri',
    description: 'Bozuk uzay gemisini tamir edin! Ortak çalışarak doğru parçaları doğru yuvaya yerleştirin.',
    icon: '🚀',
    categories: ['kids'],
    modes: ['single', 'multiplayer'],
    minPlayers: 1,
    maxPlayers: 2,

    createInitialState: (_config: GameConfig) => ({ filledSlots: 0 }),
    getScore: (state) => state.filledSlots,
    isGameOver: (_state) => false,

    UI: {
        // The real screen is rendered directly from PlaygroundScreen (standalone routing)
        Screen: (() => null) as any,
    },
};
