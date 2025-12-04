import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TinyGeoGuessBoard } from './TinyGeoGuessBoard';
import { startNewGame, makeGuess } from './logic';
import { TinyGeoGuessState } from './types';
import { colors, spacing } from '../../../../theme';

export const TinyGeoGuessScreen = () => {
    const [gameState, setGameState] = useState<TinyGeoGuessState>(() => startNewGame());

    const handleGuess = (city: string) => {
        const newState = makeGuess(gameState, city);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(startNewGame());
    };

    return (
        <View style={styles.container}>
            <TinyGeoGuessBoard
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
