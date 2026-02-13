
import { registerGame } from './platform/gameRegistry';
import { InfiniteFlowGame } from './games/infinite_flow/definition';

// Register all available games here
export const initializeGameRegistry = () => {
    registerGame(InfiniteFlowGame);

    // Future games will be registered here
};
