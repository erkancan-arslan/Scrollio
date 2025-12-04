import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TicTacToeBoard } from './TicTacToeBoard';
import { INITIAL_STATE, makeMove } from './logic';
import { TicTacToeState } from './types';
import { colors } from '../../../../theme';

export const TicTacToeScreen = () => {
    const [gameState, setGameState] = useState<TicTacToeState>(INITIAL_STATE);

    const handleMove = (index: number) => {
        const newState = makeMove(gameState, index);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(INITIAL_STATE);
    };

    return (
        <View style={styles.container}>
            <TicTacToeBoard
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});
