/**
 * Bil ve Fethet: Classroom — Game Definition
 *
 * Registers this game with the Playground game registry,
 * conforming to the GameDefinition<T> interface.
 */
import React from 'react';
import { GameDefinition, GameResult, BaseSession } from '../../platform/types';
import { ClassroomClientState, TOTAL_SEATS } from './types';
import { createEmptyGrid } from './logic/adjacency';
import { ClassroomMenuScreen } from './ClassroomMenuScreen';

/**
 * Wrapper component that adapts the PlaygroundGameShell's expected
 * props interface to our ClassroomMenuScreen.
 */
const ClassroomScreenAdapter: React.FC<{
    session: BaseSession;
    state: ClassroomClientState;
    dispatchGameAction: (action: any) => void;
    onGameOver: (result: GameResult) => void;
    onExit: () => void;
}> = ({ onExit }) => {
    return <ClassroomMenuScreen onExit={onExit} />;
};

export const BilVeFethetClassroomGame: GameDefinition<ClassroomClientState> = {
    id: 'bil_ve_fethet_classroom',
    title: 'Bil ve Fethet: Sınıf',
    description: 'Sınıf oturma düzeninde strateji ve bilgi yarışması! 3×8 koltuk düzeninde sırayla fethet.',
    categories: ['challenges', 'core'],
    modes: ['multiplayer'],
    minPlayers: 2,
    maxPlayers: 4,

    createInitialState: (_config?: any): ClassroomClientState => {
        return {
            matchId: '',
            phase: 'waiting',
            players: [],
            currentTurnPlayerId: '',
            grid: createEmptyGrid(),
            myPlayerId: '',
            connectionStatus: 'connected',
            draft: {
                currentPickIndex: 0,
                startingSeatsAssigned: false,
                totalPicks: TOTAL_SEATS,
            },
            attack: {
                attackerId: null,
                defenderId: null,
                targetSeatIndex: null,
                attackerStreakOnTarget: 0,
            },
            question: null,
            lastQuestionResult: null,
            result: null,
            turnCount: 0,
            maxTurns: 200,
            seed: 0,
            createdAt: 0,
            questionPoolSize: 0,
        };
    },

    getScore: (state: ClassroomClientState): number => {
        const myPlayer = state.players.find(p => p.id === state.myPlayerId);
        return myPlayer?.seatCount || 0;
    },

    isGameOver: (state: ClassroomClientState): boolean => {
        return state.phase === 'ended';
    },

    getResult: (state: ClassroomClientState): GameResult => {
        const myPlayer = state.players.find(p => p.id === state.myPlayerId);
        const isWinner = state.result?.winnerId === state.myPlayerId;
        return {
            endedAt: Date.now(),
            score: myPlayer?.seatCount || 0,
            outcome: isWinner ? 'win' : 'loss',
            stats: {
                turnCount: state.turnCount,
                seatCounts: state.result?.seatCounts,
            },
        };
    },

    UI: {
        Screen: ClassroomScreenAdapter,
        Tutorial: undefined,
        Results: undefined,
    },
};
