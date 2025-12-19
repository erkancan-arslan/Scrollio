import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions, PanResponder, Animated } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

interface CardStackProps {
    data: any[];
    renderItem: (item: any) => React.ReactNode;
    onSwipeRight: (item: any) => void;
    onSwipeLeft: (item: any) => void;
    onFinished?: () => void;
}

export const CardStack: React.FC<CardStackProps> = ({
    data,
    renderItem,
    onSwipeRight,
    onSwipeLeft,
    onFinished
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const position = new Animated.ValueXY();

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            position.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dx > SWIPE_THRESHOLD) {
                forceSwipe('right');
            } else if (gesture.dx < -SWIPE_THRESHOLD) {
                forceSwipe('left');
            } else {
                resetPosition();
            }
        }
    });

    const forceSwipe = (direction: 'right' | 'left') => {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: false
        }).start(() => onSwipeComplete(direction));
    };

    const onSwipeComplete = (direction: 'right' | 'left') => {
        const item = data[currentIndex];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

        position.setValue({ x: 0, y: 0 });

        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        if (nextIndex >= data.length) {
            onFinished?.();
        }
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false
        }).start();
    };

    const getCardStyle = () => {
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        };
    };

    if (currentIndex >= data.length) {
        return (
            <View style={styles.noCards}>
                <Text style={styles.noCardsText}>No more cards!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {data.map((item, index) => {
                if (index < currentIndex) return null;

                if (index === currentIndex) {
                    return (
                        <Animated.View
                            key={index}
                            style={[getCardStyle(), styles.cardStyle]}
                            {...panResponder.panHandlers}
                        >
                            {renderItem(item)}
                        </Animated.View>
                    );
                }

                return (
                    <Animated.View key={index} style={[styles.cardStyle, { top: 10 * (index - currentIndex), zIndex: -index }]}>
                        {renderItem(item)}
                    </Animated.View>
                );
            }).reverse()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    cardStyle: {
        width: SCREEN_WIDTH - spacing.lg * 2,
        height: 400,
        position: 'absolute',
        borderRadius: spacing.md,
        backgroundColor: colors.backgroundSecondary || '#2A2A2A',
        borderWidth: 1,
        borderColor: colors.border || '#333',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    noCards: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    noCardsText: {
        color: colors.text?.primary || '#FFF',
        fontSize: typography.fontSize?.lg || 20
    }
});
