import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { MemoryMatchState, Card } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { createPulseAnimation, ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface MemoryMatchBoardProps {
    state: MemoryMatchState;
    onFlip: (index: number) => void;
    onCheckMatch: () => void;
    onReset: () => void;
}

const AnimatedCard = ({ card, index, onFlip, disabled }: { card: Card, index: number, onFlip: (index: number) => void, disabled: boolean }) => {
    const flipAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Flip animation
        const toValue = card.isFlipped || card.isMatched ? 180 : 0;
        Animated.timing(flipAnim, {
            toValue,
            duration: ANIMATION_DURATION.MEDIUM,
            easing: Easing.out(Easing.ease),
            ...ANIMATION_CONFIG,
        }).start();
    }, [card.isFlipped, card.isMatched]);

    useEffect(() => {
        // Match pulse animation
        if (card.isMatched) {
            createPulseAnimation(scaleAnim, 1.1).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [card.isMatched]);

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
    };

    return (
        <TouchableOpacity
            key={card.id}
            activeOpacity={1}
            onPress={() => onFlip(index)}
            disabled={disabled}
        >
            <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
                {/* Back Face (Hidden State - Question Mark) */}
                <Animated.View style={[styles.card, styles.cardHidden, styles.cardFace, frontAnimatedStyle]}>
                    <Text style={styles.cardText}>❓</Text>
                </Animated.View>

                {/* Front Face (Revealed State - Value) */}
                <Animated.View style={[
                    styles.card,
                    styles.cardFlipped,
                    styles.cardFace,
                    backAnimatedStyle,
                    card.isMatched && styles.cardMatched
                ]}>
                    <Text style={styles.cardText}>{card.value}</Text>
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
};

export const MemoryMatchBoard: React.FC<MemoryMatchBoardProps> = ({ state, onFlip, onCheckMatch, onReset }) => {

    // Auto-check match after delay
    useEffect(() => {
        if (state.flippedIndices.length === 2) {
            const timer = setTimeout(() => {
                onCheckMatch();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [state.flippedIndices, onCheckMatch]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.statusText}>
                    {state.status === 'win'
                        ? `Won in ${state.movesCount} moves! 🎉`
                        : `Moves: ${state.movesCount}`}
                </Text>
            </View>

            <View style={styles.grid}>
                {state.board.map((card, index) => (
                    <AnimatedCard
                        key={card.id}
                        card={card}
                        index={index}
                        onFlip={onFlip}
                        disabled={card.isFlipped || card.isMatched || state.flippedIndices.length >= 2}
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
        width: '100%',
    },
    header: {
        marginBottom: spacing.lg,
    },
    statusText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.xs,
        width: 320,
    },
    cardContainer: {
        width: 70,
        height: 70,
    },
    card: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backfaceVisibility: 'hidden',
    },
    cardFace: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    cardHidden: {
        backgroundColor: colors.primary,
    },
    cardFlipped: {
        backgroundColor: colors.backgroundSecondary,
    },
    cardMatched: {
        backgroundColor: '#2ECC40', // Green
        opacity: 0.8,
    },
    cardText: {
        fontSize: 32,
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
