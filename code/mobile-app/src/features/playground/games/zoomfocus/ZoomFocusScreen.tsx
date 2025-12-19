import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Easing, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../../../theme';
import { useAppDispatch } from '../../../../store/hooks';
import { incrementScore } from '../../store/playgroundSlice';
import { useGameExit } from '../../hooks/useGameExit';

// --- DIFFICULTY TUNING ---
const CONFIG = {
    REVEAL_DURATION_MS: 10000,   // 10 seconds to fully reveal
    START_ZOOM_SCALE: 8,         // Start at 8x zoom
    END_ZOOM_SCALE: 1,           // End at 1x
    START_BLUR_RADIUS: 20,       // Start at 20px blur
    MIN_STOP_DELAY_MS: 500,      // Prevent accidental double taps
    SCORING: {
        MAX_POINTS: 100,
        MIN_POINTS: 10,
        // Score curve: (1 - progress)^1.5 * MAX_POINTS
    }
};

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - spacing.lg * 2;

// Mock Data - In real app, this would come from backend/seed
const IMAGES = [
    {
        id: '1',
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', // Sneaker
        answer: 'Sneaker',
        options: ['Backpack', 'Sneaker', 'Watch', 'Hat']
    },
    {
        id: '2',
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', // Chair
        answer: 'Chair',
        options: ['Table', 'Sofa', 'Chair', 'Bed']
    },
    {
        id: '3',
        url: 'https://images.unsplash.com/photo-1585338447937-7082f8fc763d', // Coffee
        answer: 'Coffee',
        options: ['Tea', 'Juice', 'Coffee', 'Water']
    },
    {
        id: '4',
        url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba', // Pineapple
        answer: 'Pineapple',
        options: ['Apple', 'Pineapple', 'Banana', 'Orange']
    }
];

type GameState = 'loading' | 'playing' | 'frozen' | 'results';
type RevealMode = 'zoom' | 'blur';

export const ZoomFocusScreen = () => {
    const dispatch = useAppDispatch();

    // --- HOOKS ---
    // Cleanup animation on exit
    const stopAnimation = () => {
        revealAnim.stopAnimation();
    };
    useGameExit({
        onCleanup: stopAnimation
    });

    // --- STATE ---
    const [roundIndex, setRoundIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [roundPoints, setRoundPoints] = useState<number | null>(null);
    const [gameState, setGameState] = useState<GameState>('loading');
    const [isCorrect, setIsCorrect] = useState(false);
    const [revealMode, setRevealMode] = useState<RevealMode>('zoom');

    // Animation Value (0 -> 1)
    const revealAnim = useRef(new Animated.Value(0)).current;

    const currentImage = IMAGES[roundIndex % IMAGES.length];

    // --- GAME LOGIC ---

    const startRound = () => {
        setGameState('loading');
        setRoundPoints(null);
        setIsCorrect(false);

        // Randomize mode (simple toggle for now, could be random)
        setRevealMode(Math.random() > 0.5 ? 'zoom' : 'blur');

        revealAnim.setValue(0);
    };

    const onImageLoad = () => {
        setGameState('playing');
        startReveal();
    };

    const startReveal = () => {
        Animated.timing(revealAnim, {
            toValue: 1,
            duration: CONFIG.REVEAL_DURATION_MS,
            easing: Easing.bezier(0.1, 0.4, 0.8, 1), // Non-linear: slow start, fast finish
            useNativeDriver: true, // Blur doesn't support native driver on all versions, but opacity/transform does.
            // Note: blurRadius doesn't support native driver. We might need a JS driver fallback or workaround.
            // For performance, we'll try native for Zoom, JS for Blur.
        }).start(({ finished }) => {
            if (finished) {
                // If it finishes without stopping, it's too late? Or auto-stop? 
                // Let's settle on auto-stop at end.
                handleStop();
            }
        });
    };

    const handleStop = () => {
        revealAnim.stopAnimation((value) => {
            // value is 0..1
            setGameState('frozen');
        });
    };

    const handleGuess = (selectedOption: string) => {
        const progress = (revealAnim as any)._value; // Access current value

        if (selectedOption === currentImage.answer) {
            // Calculate score
            // Earlier stop (lower progress) -> Higher Score
            // Curve: (1 - progress) ^ 1.5
            const difficultyMultiplier = Math.pow(1 - progress, 1.5);
            const points = Math.max(
                CONFIG.SCORING.MIN_POINTS,
                Math.floor(difficultyMultiplier * CONFIG.SCORING.MAX_POINTS)
            );

            setRoundPoints(points);
            setScore(s => s + points);
            dispatch(incrementScore(points));
            setIsCorrect(true);
        } else {
            setRoundPoints(0);
            setIsCorrect(false);
        }

        setGameState('results');

        // Reveal fully for result
        Animated.timing(revealAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    };

    const nextRound = () => {
        setRoundIndex(idx => idx + 1);
        startRound();
    };

    // Initialize first round
    useEffect(() => {
        startRound();
    }, []);

    // --- ANIMATED STYLES ---

    // Zoom Mode: Scale starts BIG, goes to 1
    const scale = revealAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [CONFIG.START_ZOOM_SCALE, CONFIG.END_ZOOM_SCALE]
    });

    // We also randomly shift the 'center' of the zoom to make it harder
    // For now, let's keep it centered to avoid cropping out the subject entirely, 
    // or we could implement random translateX/Y if we had image dimensions.

    // Blur Mode: BlurRadius starts HIGH, goes to 0
    // Note: blurRadius is not animatable with native driver on standard Image component easily without Reanimated.
    // Workaround: We can use a JS animation for blur, or use opacity layers. 
    // Given the constraints and missing Reanimated, let's use JS driver for blur.
    // However, we started animation with specific driver settings. 
    // Let's create specific separate start functions or just use useNativeDriver: false for all for safety if mixing.
    // Actually, Zoom is much more performant with Native Driver. 

    // DECISION: To ensure smooth 60fps, let's stick to ZOOM (Transform) primarily or simple Opacity reveal if Blur is choppy.
    // But requirement says BLUR/PIXEL is needed.
    // We will use `useNativeDriver: false` implementation for Blur to ensure it works, 
    // OR we can overlay a blurred version and fade it out (which IS native driver compatible).
    // Let's try the Overlay Fade approach for Blur Effect!
    // Layer 1: Sharp Image (Bottom)
    // Layer 2: Blurred Image (Top) -> Opacity animates 1 -> 0

    const blurOpacity = revealAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0]
    });

    const isZoomMode = revealMode === 'zoom';

    return (
        <View style={styles.container}>
            {/* HUD */}
            <View style={styles.header}>
                <Text style={styles.scoreTitle}>SCORE</Text>
                <Text style={styles.scoreValue}>{score}</Text>
                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, {
                        width: '100%',
                        transform: [{
                            translateX: revealAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['-100%', '0%']
                            })
                        }]
                    }]} />
                </View>
            </View>

            {/* GAME AREA */}
            <View style={styles.imageWrapper}>
                {gameState === 'loading' && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

                <View style={styles.mask}>
                    {isZoomMode ? (
                        <Animated.Image
                            source={{ uri: currentImage.url }}
                            style={[
                                styles.image,
                                { transform: [{ scale }] }
                            ]}
                            onLoadEnd={onImageLoad}
                        />
                    ) : (
                        <View style={styles.imageFill}>
                            {/* Sharp Layer */}
                            <Image
                                source={{ uri: currentImage.url }}
                                style={styles.imageFill}
                                onLoadEnd={onImageLoad}
                            />
                            {/* Blurred Overlay - Fades Out */}
                            <Animated.Image
                                source={{ uri: currentImage.url }}
                                style={[styles.imageFill, { opacity: blurOpacity }]}
                                blurRadius={CONFIG.START_BLUR_RADIUS}
                            />
                        </View>
                    )}
                </View>
            </View>

            {/* CONTROLS */}
            <View style={styles.controlsArea}>
                {gameState === 'playing' && (
                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={handleStop}
                        activeOpacity={0.8}
                    >
                        <View style={styles.stopInner}>
                            <Text style={styles.stopText}>STOP</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {gameState === 'frozen' && (
                    <View style={styles.optionsGrid}>
                        <Text style={styles.prompt}>What is this?</Text>
                        <View style={styles.grid}>
                            {currentImage.options.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.optionBtn}
                                    onPress={() => handleGuess(opt)}
                                >
                                    <Text style={styles.optionText}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {gameState === 'results' && (
                    <View style={styles.resultPanel}>
                        <Text style={[styles.resultTitle, isCorrect ? styles.correct : styles.wrong]}>
                            {isCorrect ? 'PERFECT!' : 'MISSED!'}
                        </Text>
                        <Text style={styles.pointsDelta}>
                            {isCorrect ? `+${roundPoints}` : '+0'} pts
                        </Text>
                        <Text style={styles.answerReveal}>It was {currentImage.answer}</Text>

                        <TouchableOpacity style={styles.nextBtn} onPress={nextRound}>
                            <Text style={styles.nextText}>Next Round</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Dark background
        paddingTop: spacing.lg
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg
    },
    scoreTitle: {
        color: colors.text.secondary,
        fontSize: 12,
        letterSpacing: 2,
        fontWeight: 'bold'
    },
    scoreValue: {
        color: colors.text.primary,
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: spacing.sm
    },
    progressContainer: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden'
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.primary
    },
    imageWrapper: {
        alignSelf: 'center',
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: spacing.lg,
        overflow: 'hidden',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20
    },
    mask: {
        flex: 1,
        overflow: 'hidden' // Critical for zoom effect
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    imageFill: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover'
    },
    loader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -18,
        marginTop: -18,
        zIndex: 10
    },
    controlsArea: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center'
    },
    stopButton: {
        alignSelf: 'center',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(235, 87, 87, 0.2)', // Semi-transparent red container
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.error || '#EB5757',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5
    },
    stopText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1
    },
    prompt: {
        color: colors.text.secondary,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: spacing.md
    },
    optionsGrid: {
        width: '100%'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        justifyContent: 'center'
    },
    optionBtn: {
        width: '48%',
        backgroundColor: colors.backgroundSecondary,
        paddingVertical: spacing.md,
        borderRadius: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    optionText: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600'
    },
    resultPanel: {
        alignItems: 'center',
        width: '100%'
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: spacing.xs,
        textTransform: 'uppercase'
    },
    correct: { color: colors.success || '#6FCF97' },
    wrong: { color: colors.error || '#EB5757' },
    pointsDelta: {
        color: 'white',
        fontSize: 20,
        opacity: 0.8,
        marginBottom: spacing.md
    },
    answerReveal: {
        color: colors.text.secondary,
        fontSize: 16,
        marginBottom: spacing.xl
    },
    nextBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: 100, // Fully rounded
    },
    nextText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
