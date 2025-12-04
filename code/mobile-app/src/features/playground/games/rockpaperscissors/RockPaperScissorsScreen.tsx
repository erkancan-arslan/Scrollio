import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { RockPaperScissorsBoard } from './RockPaperScissorsBoard';
import { INITIAL_STATE, makeMove, resetGame } from './logic';
import { RockPaperScissorsState, RPSMove } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { GameMode } from '../../types';

export const RockPaperScissorsScreen = () => {
    const [gameState, setGameState] = useState<RockPaperScissorsState>(INITIAL_STATE);
    const [mode, setMode] = useState<GameMode>('singleplayer');

    const handleMove = (move: RPSMove) => {
        const newState = makeMove(gameState, move);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(resetGame(mode));
    };

    const switchMode = (newMode: GameMode) => {
        setMode(newMode);
        setGameState(resetGame(newMode));
    };

    return (
        <View style={styles.container}>
            <View style={styles.modeSelector}>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'singleplayer' && styles.activeMode]}
                    onPress={() => switchMode('singleplayer')}
                >
                    <Text style={[styles.modeText, mode === 'singleplayer' && styles.activeModeText]}>1 Player</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, mode === 'multiplayer' && styles.activeMode]}
                    onPress={() => switchMode('multiplayer')}
                >
                    <Text style={[styles.modeText, mode === 'multiplayer' && styles.activeModeText]}>2 Players</Text>
                </TouchableOpacity>
            </View>

            <RockPaperScissorsBoard
                state={gameState}
                onMove={handleMove}
                onReset={handleReset}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingTop: spacing.lg,
    },
    modeSelector: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.sm,
        padding: 2,
    },
    modeButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: spacing.xs,
    },
    activeMode: {
        backgroundColor: colors.primary,
    },
    modeText: {
        color: colors.text.secondary,
        fontWeight: 'bold',
    },
    activeModeText: {
        color: colors.background,
    },
});
