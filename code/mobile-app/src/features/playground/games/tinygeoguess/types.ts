import { GameState } from '../../types';

export interface Location {
    id: string;
    name: string;
    image: string; // URL or local asset key
    options: string[]; // 4 options
}

export interface TinyGeoGuessState extends GameState<null> {
    currentLocation: Location;
    score: number;
    round: number;
    totalRounds: number;
    lastResult: 'correct' | 'wrong' | null;
}
