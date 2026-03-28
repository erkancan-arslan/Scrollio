
import { registerGame } from './platform/gameRegistry';
import { InfiniteFlowGame } from './games/infinite_flow/definition';
import { BilVeFethetGame } from './games/bil_ve_fethet/definition';
import { BilVeFethetKidsGame } from './games/bil-ve-fethet-kids/definition';

// Register all available games here
export const initializeGameRegistry = () => {
    registerGame(InfiniteFlowGame);
    registerGame(BilVeFethetGame);
    registerGame(BilVeFethetKidsGame);
};
