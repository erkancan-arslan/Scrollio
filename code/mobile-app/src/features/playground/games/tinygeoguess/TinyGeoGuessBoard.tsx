import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { TinyGeoGuessState } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface TinyGeoGuessBoardProps {
    state: TinyGeoGuessState;
    onGuess: (city: string) => void;
    onReset: () => void;
}

const AnimatedImage = ({ uri }: { uri: string }) => {
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        opacityAnim.setValue(0);
        Animated.timing(opacityAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION.LONG,
            ...ANIMATION_CONFIG,
        }).start();
    }, [uri]);

    return (
        <Animated.Image
            source={{ uri }}
            style={[styles.image, { opacity: opacityAnim }]}
            resizeMode="cover"
        />
    );
};

const AnimatedResult = ({ result }: { result: 'correct' | 'wrong' }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            ...ANIMATION_CONFIG,
        }).start();
    }, []);

    return (
        <Animated.View style={[
            styles.resultBadge,
            result === 'correct' ? styles.correctBadge : styles.wrongBadge,
            { transform: [{ scale: scaleAnim }] }
        ]}>
            <Text style={styles.resultText}>
                {result === 'correct' ? 'Correct! 🎉' : 'Wrong! ❌'}
            </Text>
        </Animated.View>
    );
};

export const TinyGeoGuessBoard: React.FC<TinyGeoGuessBoardProps> = ({ state, onGuess, onReset }) => {
    if (state.status !== 'in_progress') {
        return (
            <View style={styles.container}>
                <Text style={styles.gameOverText}>Game Over!</Text>
                <Text style={styles.scoreText}>Final Score: {state.score} / {state.totalRounds}</Text>
                <TouchableOpacity style={styles.resetButton} onPress={onReset}>
                    <Text style={styles.resetButtonText}>Play Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>Round: {state.round} / {state.totalRounds}</Text>
                <Text style={styles.scoreText}>Score: {state.score}</Text>
            </View>

            {state.lastResult && (
                <AnimatedResult result={state.lastResult} />
            )}

            <View style={styles.imageContainer}>
                <AnimatedImage uri={state.currentLocation.image} />
            </View>

            <View style={styles.optionsContainer}>
                {state.currentLocation.options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={styles.optionButton}
                        onPress={() => onGuess(option)}
                    >
                        <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: spacing.md,
    },
    statusText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    scoreText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
    },
    gameOverText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.lg,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        borderRadius: spacing.md,
        overflow: 'hidden',
        marginBottom: spacing.lg,
        backgroundColor: colors.backgroundSecondary,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    optionsContainer: {
        width: '100%',
        gap: spacing.sm,
    },
    optionButton: {
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.md,
        borderRadius: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    optionText: {
        fontSize: typography.fontSize.md,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    resultBadge: {
        position: 'absolute',
        top: 100,
        zIndex: 10,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    correctBadge: {
        backgroundColor: '#2ECC40',
    },
    wrongBadge: {
        backgroundColor: '#FF4136',
    },
    resultText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: typography.fontSize.lg,
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
