import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { TurkishWordleState, LetterFeedback } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { createPulseAnimation, createShakeAnimation, ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface TurkishWordleBoardProps {
    state: TurkishWordleState;
    onKeyPress: (key: string) => void;
    onSubmit: () => void;
    onDelete: () => void;
    onReset: () => void;
}

const KEYBOARD_ROWS = [
    ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
    ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
];

const AnimatedCell = ({ char, feedback, index, isCurrent }: { char: string, feedback?: LetterFeedback, index: number, isCurrent: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const prevFeedback = useRef<LetterFeedback | undefined>(undefined);

    useEffect(() => {
        if (char && isCurrent) {
            // Pulse on input
            createPulseAnimation(scaleAnim, 1.1, 100).start();
        }
    }, [char, isCurrent]);

    useEffect(() => {
        if (feedback && feedback !== 'empty' && feedback !== prevFeedback.current) {
            // Flip animation on feedback reveal
            Animated.sequence([
                Animated.delay(index * 100), // Stagger
                Animated.timing(flipAnim, {
                    toValue: 1,
                    duration: ANIMATION_DURATION.MEDIUM,
                    easing: Easing.ease,
                    ...ANIMATION_CONFIG,
                }),
            ]).start();
            prevFeedback.current = feedback;
        } else if (!feedback) {
            // Reset
            flipAnim.setValue(0);
            prevFeedback.current = undefined;
        }
    }, [feedback, index]);

    const getCellStyle = () => {
        let style: any = styles.cell;
        let textStyle: any = styles.cellText;

        if (isCurrent && char) {
            style = [styles.cell, styles.cellActive];
        } else if (feedback) {
            if (feedback === 'correct') {
                style = [styles.cell, styles.cellCorrect];
                textStyle = [styles.cellText, styles.cellTextWhite];
            } else if (feedback === 'present') {
                style = [styles.cell, styles.cellPresent];
                textStyle = [styles.cellText, styles.cellTextWhite];
            } else if (feedback === 'absent') {
                style = [styles.cell, styles.cellAbsent];
                textStyle = [styles.cellText, styles.cellTextWhite];
            }
        }

        return { style, textStyle };
    };

    const { style, textStyle } = getCellStyle();

    // Interpolate flip
    const rotateX = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'], // Full flip
    });

    return (
        <Animated.View style={[style, { transform: [{ scale: scaleAnim }, { rotateX }] }]}>
            <Text style={textStyle}>{char}</Text>
        </Animated.View>
    );
};

export const TurkishWordleBoard: React.FC<TurkishWordleBoardProps> = ({
    state,
    onKeyPress,
    onSubmit,
    onDelete,
    onReset
}) => {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (state.errorMessage) {
            createShakeAnimation(shakeAnim).start();
        }
    }, [state.errorMessage]);

    // Helper to get key color based on used letters
    const getKeyColor = (key: string) => {
        let color: string = colors.backgroundSecondary;
        let textColor: string = colors.text.primary;

        let feedback: LetterFeedback | null = null;

        for (const row of state.guesses) {
            const letter = row.find(l => l.char === key);
            if (letter) {
                if (letter.feedback === 'correct') {
                    feedback = 'correct';
                    break;
                }
                if (letter.feedback === 'present' && feedback !== 'correct') {
                    feedback = 'present';
                }
                if (letter.feedback === 'absent' && !feedback) {
                    feedback = 'absent';
                }
            }
        }

        if (feedback === 'correct') {
            color = '#6AAA64';
            textColor = 'white';
        } else if (feedback === 'present') {
            color = '#C9B458';
            textColor = 'white';
        } else if (feedback === 'absent') {
            color = '#787C7E';
            textColor = 'white';
        }

        return {
            viewStyle: { backgroundColor: color },
            textStyle: { color: textColor }
        };
    };

    const renderGrid = () => {
        const rows = [];
        for (let i = 0; i < state.maxAttempts; i++) {
            const isCurrent = i === state.currentAttemptIndex;
            const guessRow = state.guesses[i];
            const cells = [];

            for (let j = 0; j < state.wordLength; j++) {
                let char = '';
                let feedback: LetterFeedback | undefined = undefined;

                if (isCurrent && state.status === 'in_progress') {
                    char = state.currentGuess[j] || '';
                } else if (guessRow) {
                    char = guessRow[j].char;
                    feedback = guessRow[j].feedback;
                }

                cells.push(
                    <AnimatedCell
                        key={j}
                        char={char}
                        feedback={feedback}
                        index={j}
                        isCurrent={isCurrent}
                    />
                );
            }

            // Apply shake only to current row
            const rowStyle = isCurrent ? { transform: [{ translateX: shakeAnim }] } : {};

            rows.push(
                <Animated.View key={i} style={[styles.row, rowStyle]}>
                    {cells}
                </Animated.View>
            );
        }
        return <View style={styles.grid}>{rows}</View>;
    };

    return (
        <View style={styles.container}>
            {state.errorMessage && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{state.errorMessage}</Text>
                </View>
            )}

            <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContent}>
                {renderGrid()}
            </ScrollView>

            {state.status !== 'in_progress' && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>
                        {state.status === 'win' ? 'Tebrikler! Kazandın! 🎉' : `Kaybettin. Kelime: ${state.targetWord}`}
                    </Text>
                    <TouchableOpacity style={styles.resetButton} onPress={onReset}>
                        <Text style={styles.resetButtonText}>Yeni Oyun</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.keyboard}>
                {KEYBOARD_ROWS.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keyboardRow}>
                        {row.map(key => {
                            const { viewStyle, textStyle } = getKeyColor(key);
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.key, viewStyle]}
                                    onPress={() => onKeyPress(key)}
                                    disabled={state.status !== 'in_progress'}
                                >
                                    <Text style={[styles.keyText, textStyle]}>{key}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
                <View style={styles.keyboardRow}>
                    <TouchableOpacity
                        style={[styles.key, styles.keyWide]}
                        onPress={onSubmit}
                        disabled={state.status !== 'in_progress'}
                    >
                        <Text style={styles.keyText}>GİRİŞ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.key, styles.keyWide]}
                        onPress={onDelete}
                        disabled={state.status !== 'in_progress'}
                    >
                        <Text style={styles.keyText}>SİL</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
        paddingBottom: spacing.md,
    },
    errorContainer: {
        position: 'absolute',
        top: spacing.sm,
        zIndex: 10,
        backgroundColor: colors.text.primary,
        padding: spacing.sm,
        borderRadius: spacing.xs,
    },
    errorText: {
        color: colors.background,
        fontWeight: 'bold',
    },
    gridScroll: {
        flex: 1,
        width: '100%',
    },
    gridContent: {
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    grid: {
        gap: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    cell: {
        width: 50,
        height: 50,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background, // Ensure background for flip
        backfaceVisibility: 'hidden', // For flip effect
    },
    cellActive: {
        borderColor: colors.text.primary,
    },
    cellCorrect: {
        backgroundColor: '#6AAA64',
        borderColor: '#6AAA64',
    },
    cellPresent: {
        backgroundColor: '#C9B458',
        borderColor: '#C9B458',
    },
    cellAbsent: {
        backgroundColor: '#787C7E',
        borderColor: '#787C7E',
    },
    cellText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    cellTextWhite: {
        color: 'white',
    },
    keyboard: {
        width: '100%',
        paddingHorizontal: spacing.xs,
        gap: spacing.xs,
    },
    keyboardRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    key: {
        minWidth: 28,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        backgroundColor: colors.backgroundSecondary,
    },
    keyWide: {
        paddingHorizontal: spacing.md,
        minWidth: 60,
    },
    keyText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: colors.text.primary,
    },
    resultContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    resultText: {
        fontSize: typography.fontSize.lg,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
        color: colors.text.primary,
    },
    resetButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: spacing.sm,
    },
    resetButtonText: {
        color: colors.background,
        fontWeight: 'bold',
    },
});
