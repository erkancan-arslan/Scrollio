import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions, PanResponder, Animated } from 'react-native';
import { colors, spacing } from '../../../theme';

const { width, height } = Dimensions.get('window');

// --- CONSTANTS ---
const SWIPE_THRESHOLD = 80; // Balanced threshold
const CARD_WIDTH = width * 0.92;
const CARD_HEIGHT = height * 0.65;
const CARD_BORDER_RADIUS = 28;

interface SwipeableCardStackProps {
    data: any[];
    renderItem: (item: any) => React.ReactNode;
    onSwipeRight: (item: any) => void;
    onSwipeLeft: (item: any) => void;
    onFinished?: () => void;
}

export const SwipeableCardStack: React.FC<SwipeableCardStackProps> = ({
    data,
    renderItem,
    onSwipeRight,
    onSwipeLeft,
    onFinished
}) => {
    // --- STATE & REFS ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentIndexRef = useRef(0);

    // Animation Value for the Top Card
    const position = useRef(new Animated.ValueXY()).current;

    // Sync Ref
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Refs for handlers to avoid stale closures in PanResponder
    const onSwipeRightRef = useRef(onSwipeRight);
    const onSwipeLeftRef = useRef(onSwipeLeft);
    const onFinishedRef = useRef(onFinished);

    useEffect(() => {
        onSwipeRightRef.current = onSwipeRight;
        onSwipeLeftRef.current = onSwipeLeft;
        onFinishedRef.current = onFinished;
    }, [onSwipeRight, onSwipeLeft, onFinished]);

    // Reset Position when index changes (New card takes Top Slot)
    useEffect(() => {
        position.setValue({ x: 0, y: 0 });
    }, [currentIndex]);

    // Reset Game
    useEffect(() => {
        if (data.length > 0 && currentIndex > 0 && currentIndex >= data.length) {
            // If we finished, don't auto-reset unless data changed significantly?
            // Actually, usually we want to reset if data is new.
        }
        // If data changes (new game), reset.
        // We detect "New Game" by comparing data refs or assuming caller resets info.
        // Simple logic: if parent passes new data, we might want to reset.
        // For now, let's rely on parent unmounting or explicit key to reset.
        // BUT, if we are reused:
        // setCurrentIndex(0); // This can be dangerous if data updates incrementally.
        // Let's rely on the parent to force a remount using key={gameId} on the component,
        // which is the React way to reset internal state.
    }, [data]);


    // --- GESTURES ---
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
            console.log('[SwipeableStack] Release:', gesture.dx);
            if (gesture.dx > SWIPE_THRESHOLD) {
                forceSwipe('right');
            } else if (gesture.dx < -SWIPE_THRESHOLD) {
                forceSwipe('left');
            } else {
                resetPosition();
            }
        }
    }), []);

    const forceSwipe = (direction: 'right' | 'left') => {
        console.log('[SwipeableStack] forceSwipe:', direction);
        const x = direction === 'right' ? width * 1.5 : -width * 1.5;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: true
        }).start(() => {
            console.log('[SwipeableStack] Animation finished');
            onSwipeComplete(direction);
        });
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true
        }).start();
    };

    const onSwipeComplete = (direction: 'right' | 'left') => {
        const index = currentIndexRef.current;
        const item = data[index];
        console.log('[SwipeableStack] onSwipeComplete:', direction, 'Index:', index, 'Item:', !!item);

        if (item) {
            direction === 'right' ? onSwipeRightRef.current(item) : onSwipeLeftRef.current(item);
        }

        // Functional State Update
        setCurrentIndex(prev => {
            const next = prev + 1;
            if (next >= data.length) {
                setTimeout(() => onFinishedRef.current?.(), 0);
            }
            return next;
        });
    };

    // --- INTERPOLATIONS ---
    const rotate = position.x.interpolate({
        inputRange: [-width / 2, 0, width / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp'
    });

    const nextCardScale = position.x.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [1, 0.92, 1],
        extrapolate: 'clamp'
    });

    const nextCardOpacity = position.x.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [1, 0.7, 1],
        extrapolate: 'clamp'
    });

    const labelOpacityTrue = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const labelOpacityFalse = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    // --- RENDER HELPERS ---

    // Safety check
    if (currentIndex >= data.length) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>All cards finished!</Text>
            </View>
        );
    }

    // Identify Items for Slots
    const topItem = data[currentIndex];
    const nextItem = data[currentIndex + 1];
    const thirdItem = data[currentIndex + 2];

    return (
        <View style={styles.container}>
            {/* 3. BOTTOM CARD (Static/Minimal) */}
            {thirdItem && (
                <View style={[styles.card, styles.cardThird]}>
                    {renderItem(thirdItem)}
                </View>
            )}

            {/* 2. NEXT CARD (Animated Scale/Opacity) */}
            {nextItem && (
                <Animated.View
                    style={[
                        styles.card,
                        {
                            zIndex: 90,
                            transform: [{ scale: nextCardScale }],
                            opacity: nextCardOpacity,
                            top: 15 // Slight top offset for depth
                        }
                    ]}
                >
                    {renderItem(nextItem)}
                </Animated.View>
            )}

            {/* 1. TOP CARD (Interactive - Full Control) */}
            {topItem && (
                <Animated.View
                    style={[
                        styles.card,
                        {
                            zIndex: 100,
                            transform: [
                                { translateX: position.x },
                                { translateY: position.y },
                                { rotate: rotate }
                            ]
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    {/* STAMPS */}
                    <Animated.View style={[styles.stampContainer, styles.stampTrue, { opacity: labelOpacityTrue }]}>
                        <Text style={styles.stampTextTrue}>TRUE</Text>
                    </Animated.View>
                    <Animated.View style={[styles.stampContainer, styles.stampFalse, { opacity: labelOpacityFalse }]}>
                        <Text style={styles.stampTextFalse}>FALSE</Text>
                    </Animated.View>

                    {renderItem(topItem)}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: spacing.xl
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        color: 'white',
        fontSize: 18
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'absolute',
        borderRadius: CARD_BORDER_RADIUS,
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.md,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    cardThird: {
        zIndex: 80,
        transform: [{ scale: 0.85 }],
        opacity: 0.4,
        top: 30
    },
    stampContainer: {
        position: 'absolute',
        top: 40,
        zIndex: 200,
        borderWidth: 4,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        transform: [{ rotate: '-15deg' }]
    },
    stampTrue: {
        left: 40,
        borderColor: colors.success || '#4CAF50',
    },
    stampTextTrue: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.success || '#4CAF50',
        textTransform: 'uppercase',
        letterSpacing: 4
    },
    stampFalse: {
        right: 40,
        borderColor: colors.error || '#F44336',
        transform: [{ rotate: '15deg' }]
    },
    stampTextFalse: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.error || '#F44336',
        textTransform: 'uppercase',
        letterSpacing: 4
    }
});
