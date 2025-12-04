import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NumberGuessBoard } from './NumberGuessBoard';
import { startNewGame, makeGuess } from './logic';
import { NumberGuessState } from './types';
import { colors, spacing } from '../../../../theme';
import { GameMode } from '../../types';

export const NumberGuessScreen = () => {
    const [mode, setMode] = useState<GameMode>('singleplayer');
    const [gameState, setGameState] = useState<NumberGuessState>(() => startNewGame('singleplayer'));

    const handleGuess = (guess: number) => {
        const newState = makeGuess(gameState, guess);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(startNewGame(mode));
    };

    const switchMode = (newMode: GameMode) => {
        setMode(newMode);
        setGameState(startNewGame(newMode));
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

            <NumberGuessBoard
                state={gameState}
                onGuess={handleGuess}
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
