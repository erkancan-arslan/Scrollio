import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FourInARowBoard } from './FourInARowBoard';
import { INITIAL_STATE, makeMove } from './logic';
import { FourInARowState } from './types';
import { colors } from '../../../../theme';

export const FourInARowScreen = () => {
    const [gameState, setGameState] = useState<FourInARowState>(INITIAL_STATE);

    const handleMove = (colIndex: number) => {
        const newState = makeMove(gameState, colIndex);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(INITIAL_STATE);
    };

    return (
        <View style={styles.container}>
            <FourInARowBoard
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
