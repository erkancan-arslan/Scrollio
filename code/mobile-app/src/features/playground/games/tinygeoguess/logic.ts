import { GameStatus } from '../../types';
import { TinyGeoGuessState, Location } from './types';

// Mock Data - In a real app, this would come from an API or asset bundle
const LOCATIONS: Location[] = [
    {
        id: '1',
        name: 'Paris',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
    },
    {
        id: '2',
        name: 'New York',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1000&auto=format&fit=crop',
        options: ['Chicago', 'New York', 'Toronto', 'Sydney'],
    },
    {
        id: '3',
        name: 'Tokyo',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000&auto=format&fit=crop',
        options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
    },
    {
        id: '4',
        name: 'Sydney',
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1000&auto=format&fit=crop',
        options: ['Melbourne', 'Sydney', 'Auckland', 'Vancouver'],
    },
    {
        id: '5',
        name: 'Rome',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1000&auto=format&fit=crop',
        options: ['Rome', 'Athens', 'Istanbul', 'Cairo'],
    },
];

export const TOTAL_ROUNDS = 5;

export const INITIAL_STATE: TinyGeoGuessState = {
    board: null,
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
    currentLocation: LOCATIONS[0],
    score: 0,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    lastResult: null,
    mode: 'singleplayer',
};

export function startNewGame(): TinyGeoGuessState {
    // Shuffle locations for a new game
    const shuffled = [...LOCATIONS].sort(() => 0.5 - Math.random());
    return {
        ...INITIAL_STATE,
        currentLocation: shuffled[0],
        // Store remaining locations in a hidden way if needed, but for now we just pick random
    };
}

export function makeGuess(state: TinyGeoGuessState, guess: string): TinyGeoGuessState {
    if (state.status !== 'in_progress') return state;

    const isCorrect = guess === state.currentLocation.name;
    const newScore = isCorrect ? state.score + 1 : state.score;
    const nextRound = state.round + 1;

    let status: GameStatus = 'in_progress';
    let winner = null;

    if (nextRound > state.totalRounds) {
        status = 'win'; // Game over
        winner = 'P1' as any; // Single player always "wins" in the sense of finishing
    }

    // Pick next location (simple random for now, ideally from a shuffled queue)
    const nextLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    return {
        ...state,
        score: newScore,
        round: nextRound,
        lastResult: isCorrect ? 'correct' : 'wrong',
        status,
        winner,
        currentLocation: nextLocation,
    };
}
