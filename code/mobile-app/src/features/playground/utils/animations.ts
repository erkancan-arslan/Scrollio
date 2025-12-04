import { Animated, Easing, Platform } from 'react-native';

export const ANIMATION_DURATION = {
    SHORT: 150,
    MEDIUM: 300,
    LONG: 500,
};

export const ANIMATION_CONFIG = {
    useNativeDriver: true, // Use native driver where possible for performance
};

// Helper to create a pulse animation (scale up and down)
export const createPulseAnimation = (
    value: Animated.Value,
    scaleTo: number = 1.1,
    duration: number = ANIMATION_DURATION.SHORT
) => {
    return Animated.sequence([
        Animated.timing(value, {
            toValue: scaleTo,
            duration: duration / 2,
            easing: Easing.ease,
            ...ANIMATION_CONFIG,
        }),
        Animated.timing(value, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.ease,
            ...ANIMATION_CONFIG,
        }),
    ]);
};

// Helper to create a shake animation (horizontal movement)
export const createShakeAnimation = (
    value: Animated.Value,
    offset: number = 10,
    duration: number = ANIMATION_DURATION.MEDIUM
) => {
    return Animated.sequence([
        Animated.timing(value, {
            toValue: -offset,
            duration: duration / 4,
            easing: Easing.linear,
            ...ANIMATION_CONFIG,
        }),
        Animated.timing(value, {
            toValue: offset,
            duration: duration / 4,
            easing: Easing.linear,
            ...ANIMATION_CONFIG,
        }),
        Animated.timing(value, {
            toValue: -offset / 2,
            duration: duration / 4,
            easing: Easing.linear,
            ...ANIMATION_CONFIG,
        }),
        Animated.timing(value, {
            toValue: 0,
            duration: duration / 4,
            easing: Easing.linear,
            ...ANIMATION_CONFIG,
        }),
    ]);
};

// Helper to create a fade in animation
export const createFadeInAnimation = (
    value: Animated.Value,
    duration: number = ANIMATION_DURATION.MEDIUM
) => {
    return Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        ...ANIMATION_CONFIG,
    });
};

// Helper to create a flip animation (rotateY)
// Note: This returns an interpolation, not an animation object directly
export const getFlipInterpolation = (value: Animated.Value) => {
    return value.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });
};
