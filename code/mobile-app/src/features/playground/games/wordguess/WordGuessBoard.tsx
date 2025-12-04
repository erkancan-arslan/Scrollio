import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { WordGuessState } from './types';
import { colors, spacing, typography } from '../../../../theme';

interface WordGuessBoardProps {
    state: WordGuessState;
    onGuess: (letter: string) => void;
    onReset: () => void;
}

const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export const WordGuessBoard: React.FC<WordGuessBoardProps> = ({ state, onGuess, onReset }) => {
    const renderWord = () => {
        return (
            <View style={styles.wordContainer}>
                {state.targetWord.split('').map((char, index) => (
                    <View key={index} style={styles.charBox}>
                        <Text style={styles.charText}>
                            {state.status === 'lose' || state.guessedLetters.includes(char) ? char : '_'}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderKeyboard = () => {
        return (
            <View style={styles.keyboard}>
                {ALPHABET.map((letter) => {
                    const isGuessed = state.guessedLetters.includes(letter);
                    const isCorrect = state.targetWord.includes(letter);

                    return (
                        <TouchableOpacity
                            key={letter}
                            style={[
                                styles.keyButton,
                                isGuessed && (isCorrect ? styles.keyButtonCorrect : styles.keyButtonWrong)
                            ]}
                            onPress={() => onGuess(letter)}
                            disabled={isGuessed || state.status !== 'in_progress'}
                        >
                            <Text style={[styles.keyText, isGuessed && styles.keyTextDisabled]}>{letter}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>
                    {state.status === 'in_progress'
                        ? `Attempts: ${state.remainingAttempts}`
                        : state.status === 'win'
                            ? 'You Won! 🎉'
                            : `Game Over! Word: ${state.targetWord}`}
                </Text>
            </View>

            {renderWord()}
            {renderKeyboard()}

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
    },
    wordContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        gap: spacing.xs,
    },
    charBox: {
        width: 40,
        height: 50,
        borderBottomWidth: 2,
        borderBottomColor: colors.text.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    charText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
    },
    keyboard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.xs,
        marginBottom: spacing.lg,
    },
    keyButton: {
        width: 36,
        height: 44,
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    keyButtonCorrect: {
        backgroundColor: '#2ECC40', // Green
        borderColor: '#2ECC40',
    },
    keyButtonWrong: {
        backgroundColor: '#FF4136', // Red
        borderColor: '#FF4136',
    },
    keyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    keyTextDisabled: {
        color: 'white',
    },
    resetButton: {
        marginTop: spacing.md,
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
