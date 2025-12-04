import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WordGuessBoard } from './WordGuessBoard';
import { startNewGame, makeGuess } from './logic';
import { WordGuessState } from './types';
import { colors, spacing } from '../../../../theme';

export const WordGuessScreen = () => {
    const [gameState, setGameState] = useState<WordGuessState>(() => startNewGame());

    const handleGuess = (letter: string) => {
        const newState = makeGuess(gameState, letter);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(startNewGame());
    };

    return (
        <View style={styles.container}>
            <WordGuessBoard
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
});
