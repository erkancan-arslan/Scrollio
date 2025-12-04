import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { FourInARowState, CellValue } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface FourInARowBoardProps {
    state: FourInARowState;
    onMove: (colIndex: number) => void;
    onReset: () => void;
}

const AnimatedPiece = ({ cell, rowIndex }: { cell: CellValue, rowIndex: number }) => {
    const translateY = useRef(new Animated.Value(-300)).current; // Start from top

    useEffect(() => {
        if (cell) {
            translateY.setValue(-300); // Reset to top
            Animated.timing(translateY, {
                toValue: 0,
                duration: ANIMATION_DURATION.MEDIUM,
                easing: Easing.bounce, // Gravity feel
                ...ANIMATION_CONFIG,
            }).start();
        }
    }, [cell]);

    if (!cell) return <View style={[styles.piece]} />;

    return (
        <Animated.View style={[
            styles.piece,
            cell === 'P1' && styles.pieceP1,
            cell === 'P2' && styles.pieceP2,
            { transform: [{ translateY }] }
        ]} />
    );
};

export const FourInARowBoard: React.FC<FourInARowBoardProps> = ({ state, onMove, onReset }) => {
    const renderCell = (cell: CellValue, rowIndex: number, colIndex: number) => (
        <View key={`${rowIndex}-${colIndex}`} style={styles.cell}>
            <AnimatedPiece cell={cell} rowIndex={rowIndex} />
        </View>
    );

    const renderColumn = (colIndex: number) => (
        <TouchableOpacity
            key={colIndex}
            style={styles.column}
            onPress={() => onMove(colIndex)}
            disabled={state.status !== 'in_progress'}
        >
            {state.board.map((row, rowIndex) => renderCell(row[colIndex], rowIndex, colIndex))}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>
                    {state.status === 'in_progress'
                        ? `Current Turn: ${state.currentPlayer === 'P1' ? 'Red' : 'Yellow'}`
                        : state.status === 'win'
                            ? `Winner: ${state.winner === 'P1' ? 'Red' : 'Yellow'}`
                            : 'Draw!'}
                </Text>
            </View>

            <View style={styles.board}>
                {Array(7).fill(null).map((_, colIndex) => renderColumn(colIndex))}
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
                <Text style={styles.resetButtonText}>New Game</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: spacing.md,
    },
    header: {
        marginBottom: spacing.lg,
    },
    statusText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    board: {
        flexDirection: 'row',
        backgroundColor: colors.primary, // Blue board
        padding: spacing.sm,
        borderRadius: spacing.sm,
        overflow: 'hidden', // Clip falling pieces
    },
    column: {
        flexDirection: 'column',
    },
    cell: {
        width: 40,
        height: 40,
        padding: 2,
    },
    piece: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        backgroundColor: colors.background, // Empty slot color
    },
    pieceP1: {
        backgroundColor: '#FF4136', // Red
    },
    pieceP2: {
        backgroundColor: '#FFDC00', // Yellow
    },
    resetButton: {
        marginTop: spacing.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.primary,
        borderRadius: spacing.sm,
    },
    resetButtonText: {
        color: colors.background,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});
