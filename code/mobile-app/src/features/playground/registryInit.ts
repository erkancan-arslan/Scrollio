
import { registerGame } from './platform/gameRegistry';
import { InfiniteFlowGame } from './games/infinite_flow/definition';
import { BilVeFethetGame } from './games/bil_ve_fethet/definition';
import { BilVeFethetKidsGame } from './games/bil-ve-fethet-kids/definition';
import { BilVeFethetClassroomGame } from './games/bil-ve-fethet-classroom/definition';
import { SpaceRepairKidsGame } from './games/space-repair-kids/definition';

// Register all available games here
export const initializeGameRegistry = () => {
    registerGame(InfiniteFlowGame);
    registerGame(BilVeFethetGame);
    registerGame(BilVeFethetKidsGame);
    registerGame(BilVeFethetClassroomGame);
    registerGame(SpaceRepairKidsGame);
};
