
import { registerGame } from './platform/gameRegistry';
import { InfiniteFlowGame } from './games/infinite_flow/definition';
import { BilVeFethetClassroomGame } from './games/bil-ve-fethet-classroom/definition';

// Register all available games here
export const initializeGameRegistry = () => {
    registerGame(InfiniteFlowGame);
    registerGame(BilVeFethetClassroomGame);
};
