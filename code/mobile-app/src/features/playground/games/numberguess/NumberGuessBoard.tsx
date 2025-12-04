import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Easing } from 'react-native';
import { NumberGuessState } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface NumberGuessBoardProps {
    state: NumberGuessState;
    onGuess: (guess: number) => void;
    onReset: () => void;
}

const AnimatedFeedback = ({ feedback, lastGuess }: { feedback: 'higher' | 'lower' | 'correct', lastGuess: number }) => {
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Slide in and fade in
        slideAnim.setValue(-20);
        opacityAnim.setValue(0);
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 6,
                ...ANIMATION_CONFIG,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: ANIMATION_DURATION.SHORT,
                ...ANIMATION_CONFIG,
            }),
        ]).start();
    }, [lastGuess]);

    return (
        <Animated.View style={[styles.feedbackContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
            <Text style={styles.feedbackText}>
                Last Guess: {lastGuess}
            </Text>
            <Text style={[styles.feedbackResult, feedback === 'correct' && styles.correctText]}>
                {feedback === 'correct' ? 'CORRECT!' : feedback === 'higher' ? 'Go Higher ⬆️' : 'Go Lower ⬇️'}
            </Text>
        </Animated.View>
    );
};

export const NumberGuessBoard: React.FC<NumberGuessBoardProps> = ({ state, onGuess, onReset }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = () => {
        const guess = parseInt(inputValue, 10);
        if (!isNaN(guess) && guess >= state.minRange && guess <= state.maxRange) {
            onGuess(guess);
            setInputValue('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>
                    {state.status === 'in_progress'
                        ? state.mode === 'singleplayer'
                            ? `Guess a number between ${state.minRange}-${state.maxRange}`
                            : `${state.currentPlayer}'s Turn (1-100)`
                        : `Winner: ${state.winner === 'P1' ? 'Player 1' : 'Player 2'}! 🎉`}
                </Text>
            </View>

            <View style={styles.gameArea}>
                {state.lastGuess !== null && state.feedback && (
                    <AnimatedFeedback feedback={state.feedback} lastGuess={state.lastGuess} />
                )}

                {state.status === 'in_progress' && (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            keyboardType="number-pad"
                            value={inputValue}
                            onChangeText={setInputValue}
                            placeholder="Enter number"
                            placeholderTextColor={colors.text.tertiary}
                            maxLength={3}
                        />
                        <TouchableOpacity style={styles.guessButton} onPress={handleSubmit}>
                            <Text style={styles.guessButtonText}>Guess</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView style={styles.historyContainer}>
                <Text style={styles.historyTitle}>History</Text>
                {state.history.slice().reverse().map((entry, index) => (
                    <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyText}>
                            {state.mode === 'multiplayer' ? `${entry.player}: ` : ''}{entry.guess} - {entry.result}
                        </Text>
                    </View>
                ))}
            </ScrollView>

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
        flex: 1,
    },
    header: {
        marginBottom: spacing.xl,
    },
    statusText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
    },
    gameArea: {
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    feedbackContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.sm,
        width: '100%',
    },
    feedbackText: {
        fontSize: typography.fontSize.lg,
        color: colors.text.primary,
    },
    feedbackResult: {
        fontSize: typography.fontSize.xl,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: spacing.xs,
    },
    correctText: {
        color: '#2ECC40',
    },
    inputContainer: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    input: {
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.sm,
        padding: spacing.md,
        width: 120,
        fontSize: typography.fontSize.lg,
        color: colors.text.primary,
        textAlign: 'center',
    },
    guessButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        borderRadius: spacing.sm,
    },
    guessButtonText: {
        color: colors.background,
        fontWeight: 'bold',
        fontSize: typography.fontSize.md,
    },
    historyContainer: {
        flex: 1,
        width: '100%',
        marginBottom: spacing.md,
    },
    historyTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: 'bold',
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    historyItem: {
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    historyText: {
        color: colors.text.secondary,
    },
    resetButton: {
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
