import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BattleshipBoard } from './BattleshipBoard';
import {
    startNewGame,
    fireShot,
    placeShip,
    selectShip,
    toggleOrientation,
    finishSetup
} from './logic';
import { BattleshipState } from './types';
import { colors, spacing } from '../../../../theme';

export const BattleshipScreen = () => {
    const [gameState, setGameState] = useState<BattleshipState>(() => startNewGame());

    const handleFire = (row: number, col: number) => {
        const newState = fireShot(gameState, row, col);
        setGameState(newState);
    };

    const handlePlaceShip = (row: number, col: number) => {
        const newState = placeShip(gameState, row, col);
        setGameState(newState);
    };

    const handleSelectShip = (id: string) => {
        const newState = selectShip(gameState, id);
        setGameState(newState);
    };

    const handleToggleOrientation = () => {
        const newState = toggleOrientation(gameState);
        setGameState(newState);
    };

    const handleFinishSetup = () => {
        const newState = finishSetup(gameState);
        setGameState(newState);
    };

    const handleReset = () => {
        setGameState(startNewGame());
    };

    return (
        <View style={styles.container}>
            <BattleshipBoard
                state={gameState}
                onFire={handleFire}
                onPlaceShip={handlePlaceShip}
                onSelectShip={handleSelectShip}
                onToggleOrientation={handleToggleOrientation}
                onFinishSetup={handleFinishSetup}
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
