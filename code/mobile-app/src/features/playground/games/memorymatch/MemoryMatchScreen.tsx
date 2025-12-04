import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MemoryMatchBoard } from './MemoryMatchBoard';
import { startNewGame, flipCard, checkMatch } from './logic';
import { MemoryMatchState } from './types';
import { colors, spacing } from '../../../../theme';

export const MemoryMatchScreen = () => {
    const [gameState, setGameState] = useState<MemoryMatchState>(() => startNewGame());

    const handleFlip = (index: number) => {
        const newState = flipCard(gameState, index);
        setGameState(newState);
    };

    const handleCheckMatch = () => {
        const newState = checkMatch(gameState);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(startNewGame());
    };

    return (
        <View style={styles.container}>
            <MemoryMatchBoard
                state={gameState}
                onFlip={handleFlip}
                onCheckMatch={handleCheckMatch}
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
