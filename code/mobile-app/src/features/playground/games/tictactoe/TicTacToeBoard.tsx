import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { TicTacToeState, CellValue } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface TicTacToeBoardProps {
    state: TicTacToeState;
    onMove: (index: number) => void;
    onReset: () => void;
}

const AnimatedCell = ({ cell, index, onMove, disabled, isWinner }: { cell: CellValue, index: number, onMove: (index: number) => void, disabled: boolean, isWinner: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (cell) {
            // Appearance animation
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: ANIMATION_DURATION.SHORT,
                    easing: Easing.out(Easing.ease),
                    ...ANIMATION_CONFIG,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: ANIMATION_DURATION.SHORT / 2,
                    easing: Easing.out(Easing.ease),
                    ...ANIMATION_CONFIG,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [cell]);

    useEffect(() => {
        if (isWinner && cell) {
            // Winner pulse
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.1,
                        duration: ANIMATION_DURATION.MEDIUM,
                        easing: Easing.inOut(Easing.ease),
                        ...ANIMATION_CONFIG,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: ANIMATION_DURATION.MEDIUM,
                        easing: Easing.inOut(Easing.ease),
                        ...ANIMATION_CONFIG,
                    }),
                ]),
                { iterations: 2 }
            ).start();
        }
    }, [isWinner, cell]);

    return (
        <TouchableOpacity
            key={index}
            style={[styles.cell, cell && styles.cellFilled]}
            onPress={() => onMove(index)}
            disabled={disabled}
        >
            <Animated.Text style={[styles.cellText, { transform: [{ scale: scaleAnim }] }]}>
                {cell}
            </Animated.Text>
        </TouchableOpacity>
    );
};

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ state, onMove, onReset }) => {

    // Simple check for winning line to animate (pure UI logic)
    const getWinningIndices = () => {
        if (state.status !== 'win' || !state.winner) return [];
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        for (const line of lines) {
            const [a, b, c] = line;
            if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
                return line;
            }
        }
        return [];
    };

    const winningIndices = getWinningIndices();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>
                    {state.status === 'in_progress'
                        ? `Current Turn: ${state.currentPlayer}`
                        : state.status === 'win'
                            ? `Winner: ${state.winner}`
                            : 'Draw!'}
                </Text>
            </View>

            <View style={styles.board}>
                {state.board.map((cell, index) => (
                    <AnimatedCell
                        key={index}
                        cell={cell}
                        index={index}
                        onMove={onMove}
                        disabled={cell !== null || state.status !== 'in_progress'}
                        isWinner={winningIndices.includes(index)}
                    />
                ))}
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
        flexWrap: 'wrap',
        width: 300,
        height: 300,
        backgroundColor: colors.border,
    },
    cell: {
        width: '33.33%',
        height: '33.33%',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellFilled: {
        backgroundColor: colors.backgroundSecondary,
    },
    cellText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
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
