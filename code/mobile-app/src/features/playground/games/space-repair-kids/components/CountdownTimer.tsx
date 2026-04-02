import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';

interface CountdownTimerProps {
    timeRemaining: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeRemaining }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const urgencyProgress = useRef(new Animated.Value(0)).current;
    const prevTime = useRef(timeRemaining);

    useEffect(() => {
        if (timeRemaining !== prevTime.current) {
            // Small pulse on each tick
            Animated.sequence([
                Animated.spring(scale, { toValue: 1.15, useNativeDriver: false }),
                Animated.spring(scale, { toValue: 1.0, useNativeDriver: false })
            ]).start();
            prevTime.current = timeRemaining;
        }
        // Lerp urgency: 1 when ≤ 10 seconds, 0 when > 10
        Animated.timing(urgencyProgress, {
            toValue: timeRemaining <= 10 ? 1 : 0,
            duration: 300,
            useNativeDriver: false
        }).start();
    }, [timeRemaining, scale, urgencyProgress]);

    const color = urgencyProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgb(255, 255, 255)', 'rgb(255, 59, 48)'],
    });

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${minutes}:${String(seconds).padStart(2, '0')}`;

    return (
        <Animated.Text style={[styles.timer, { transform: [{ scale }], color }]}>
            ⏱ {display}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    timer: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
