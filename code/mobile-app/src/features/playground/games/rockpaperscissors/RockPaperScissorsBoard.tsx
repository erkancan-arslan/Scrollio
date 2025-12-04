import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { RockPaperScissorsState, RPSMove } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { createPulseAnimation, ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface RPSBoardProps {
    state: RockPaperScissorsState;
    onMove: (move: RPSMove) => void;
    onReset: () => void;
}

const AnimatedOption = ({ move, label, emoji, onMove, disabled }: { move: RPSMove, label: string, emoji: string, onMove: (move: RPSMove) => void, disabled: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        // Tap feedback
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                easing: Easing.ease,
                ...ANIMATION_CONFIG,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                easing: Easing.ease,
                ...ANIMATION_CONFIG,
            }),
        ]).start(() => onMove(move));
    };

    return (
        <TouchableOpacity
            style={styles.moveButton}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={1}
        >
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: scaleAnim }] }}>
                <Text style={styles.moveEmoji}>{emoji}</Text>
                <Text style={styles.moveText}>{label}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const AnimatedResult = ({ emoji, isWinner, isLoser }: { emoji: string, isWinner: boolean, isLoser: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Reveal animation
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isWinner ? 1.2 : isLoser ? 0.9 : 1,
                friction: 5,
                ...ANIMATION_CONFIG,
            }),
            Animated.timing(opacityAnim, {
                toValue: isLoser ? 0.6 : 1,
                duration: ANIMATION_DURATION.MEDIUM,
                ...ANIMATION_CONFIG,
            }),
        ]).start();

        if (isWinner) {
            // Pulse winner
            createPulseAnimation(scaleAnim, 1.3).start();
        }
    }, []);

    return (
        <Animated.Text style={[styles.resultEmoji, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            {emoji}
        </Animated.Text>
    );
};

export const RockPaperScissorsBoard: React.FC<RPSBoardProps> = ({ state, onMove, onReset }) => {
    const renderMoveButton = (move: RPSMove, label: string, emoji: string) => (
        <AnimatedOption
            key={move}
            move={move}
            label={label}
            emoji={emoji}
            onMove={onMove}
            disabled={state.status !== 'in_progress'}
        />
    );

    const getResultText = () => {
        if (state.status === 'in_progress') {
            return state.mode === 'singleplayer'
                ? 'Make your move!'
                : `Player ${state.currentPlayer === 'P1' ? '1' : '2'}'s Turn`;
        }
        if (state.status === 'draw') return "It's a Draw!";
        return `Winner: ${state.winner === 'P1' ? 'Player 1' : 'Player 2'}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>{getResultText()}</Text>
            </View>

            <View style={styles.gameArea}>
                {state.status !== 'in_progress' && (
                    <View style={styles.resultContainer}>
                        <View style={styles.playerResult}>
                            <Text style={styles.playerLabel}>P1</Text>
                            <AnimatedResult
                                emoji={state.player1Move === 'rock' ? '🪨' : state.player1Move === 'paper' ? '📄' : '✂️'}
                                isWinner={state.winner === 'P1'}
                                isLoser={state.winner === 'P2'}
                            />
                        </View>
                        <Text style={styles.vsText}>VS</Text>
                        <View style={styles.playerResult}>
                            <Text style={styles.playerLabel}>{state.mode === 'singleplayer' ? 'CPU' : 'P2'}</Text>
                            <AnimatedResult
                                emoji={state.player2Move === 'rock' ? '🪨' : state.player2Move === 'paper' ? '📄' : '✂️'}
                                isWinner={state.winner === 'P2'}
                                isLoser={state.winner === 'P1'}
                            />
                        </View>
                    </View>
                )}

                {state.status === 'in_progress' && (
                    <View style={styles.movesContainer}>
                        {renderMoveButton('rock', 'Rock', '🪨')}
                        {renderMoveButton('paper', 'Paper', '📄')}
                        {renderMoveButton('scissors', 'Scissors', '✂️')}
                    </View>
                )}
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
        width: '100%',
    },
    header: {
        marginBottom: spacing.xl,
    },
    statusText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
    },
    gameArea: {
        height: 300,
        justifyContent: 'center',
        width: '100%',
    },
    movesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    moveButton: {
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        width: 100,
    },
    moveEmoji: {
        fontSize: 40,
        marginBottom: spacing.xs,
    },
    moveText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    resultContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xl,
    },
    playerResult: {
        alignItems: 'center',
    },
    playerLabel: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    resultEmoji: {
        fontSize: 60,
    },
    vsText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.tertiary,
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
