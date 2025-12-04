import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TurkishWordleBoard } from './TurkishWordleBoard';
import { initTurkishWordleGame, submitGuess, updateCurrentGuess } from './logic';
import { TurkishWordleState } from './types';
import { colors, spacing } from '../../../../theme';

export const TurkishWordleScreen = () => {
    const [gameState, setGameState] = useState<TurkishWordleState>(() => initTurkishWordleGame());

    const handleKeyPress = (key: string) => {
        if (gameState.status !== 'in_progress') return;
        if (gameState.currentGuess.length < gameState.wordLength) {
            const newState = updateCurrentGuess(gameState, gameState.currentGuess + key);
            setGameState(newState);
        }
    };

    const handleDelete = () => {
        if (gameState.status !== 'in_progress') return;
        const newState = updateCurrentGuess(gameState, gameState.currentGuess.slice(0, -1));
        setGameState(newState);
    };

    const handleSubmit = () => {
        const newState = submitGuess(gameState);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(initTurkishWordleGame());
    };

    return (
        <View style={styles.container}>
            <TurkishWordleBoard
                state={gameState}
                onKeyPress={handleKeyPress}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
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
});
