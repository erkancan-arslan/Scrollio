import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, Animated, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnswerBlock } from '../types';
import { SlotLayout } from './RepairSlot';

interface DraggableAnswerBlockProps {
    block: AnswerBlock;
    slotLayouts: React.MutableRefObject<(SlotLayout | null)[]>;
    onDrop: (blockId: string, slotIndex: number) => 'correct' | 'wrong' | 'occupied';
}

export const DraggableAnswerBlock: React.FC<DraggableAnswerBlockProps> = ({
    block,
    slotLayouts,
    onDrop,
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const blockBorderColor = useRef(new Animated.Value(0)).current;
    const isDragging = useRef(new Animated.Value(0)).current;

    // ── snap back to inventory ──
    const snapBack = useCallback(() => {
        Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 8 }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 8 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
        ]).start();
    }, [translateX, translateY, scale]);

    // ── shake + snap on wrong drop ──
    const shakeAndSnap = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Flash border red
        blockBorderColor.setValue(1);
        Animated.timing(blockBorderColor, { toValue: 0, duration: 800, useNativeDriver: false }).start();

        Animated.sequence([
            // Vigorous wobble
            Animated.timing(translateX, { toValue: -18, duration: 40, useNativeDriver: false }),
            Animated.timing(translateX, { toValue: 18, duration: 40, useNativeDriver: false }),
            Animated.timing(translateX, { toValue: -12, duration: 40, useNativeDriver: false }),
            Animated.timing(translateX, { toValue: 12, duration: 40, useNativeDriver: false }),
            Animated.timing(translateX, { toValue: -6, duration: 40, useNativeDriver: false }),
            // Fly back smooth
            Animated.parallel([
                Animated.spring(translateX, { toValue: 0, useNativeDriver: false, tension: 60, friction: 7 }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: false, tension: 60, friction: 7 }),
                Animated.spring(scale, { toValue: 1, useNativeDriver: false })
            ])
        ]).start();
    }, [translateX, translateY, scale, blockBorderColor]);

    // ── correct-drop exit animation ──
    const playCorrectExit = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.parallel([
            Animated.sequence([
                Animated.spring(scale, { toValue: 1.35, useNativeDriver: false, speed: 60, bounciness: 12 }),
                Animated.timing(scale, { toValue: 0, duration: 250, useNativeDriver: false }),
            ]),
            Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: false }),
        ]).start();
    }, [scale, opacity]);

    // ── mutable drop handler — always reads latest slotLayouts ──
    // This ref is updated on every render so the PanResponder (created once)
    // always calls the freshest version.
    const dropHandlerRef = useRef<(pageX: number, pageY: number) => void>(() => {});
    dropHandlerRef.current = (pageX: number, pageY: number) => {
        const layouts = slotLayouts.current;
        let matchedIndex = -1;
        for (let i = 0; i < layouts.length; i++) {
            const l = layouts[i];
            if (!l) continue;
            if (pageX >= l.x && pageX <= l.x + l.width && pageY >= l.y && pageY <= l.y + l.height) {
                matchedIndex = i;
                break;
            }
        }

        if (matchedIndex === -1) {
            snapBack();
            return;
        }

        const result = onDrop(block.id, matchedIndex);
        if (result === 'correct') {
            playCorrectExit();
        } else {
            shakeAndSnap();
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Animated.parallel([
                    Animated.spring(scale, { toValue: 1.15, useNativeDriver: false, speed: 40 }),
                    Animated.timing(isDragging, { toValue: 1, duration: 150, useNativeDriver: false }),
                ]).start();
            },
            onPanResponderMove: (_evt, gs) => {
                translateX.setValue(gs.dx);
                translateY.setValue(gs.dy);
            },
            onPanResponderRelease: (evt) => {
                Animated.timing(isDragging, { toValue: 0, duration: 150, useNativeDriver: false }).start();
                dropHandlerRef.current?.(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
            },
            onPanResponderTerminate: () => {
                Animated.timing(isDragging, { toValue: 0, duration: 150, useNativeDriver: false }).start();
                // If another gesture steals the responder, snap back cleanly
                Animated.parallel([
                    Animated.spring(translateX, { toValue: 0, useNativeDriver: false }),
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: false }),
                    Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
                ]).start();
            },
        }),
    ).current;

    if (block.isUsed) return null;

    const borderColor = blockBorderColor.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(156, 156, 255, 0.4)', 'rgba(255, 69, 58, 1)'],
    });

    const backgroundColor = blockBorderColor.interpolate({
        inputRange: [0, 1],
        outputRange: ['#1C1C3D', 'rgba(255, 69, 58, 0.3)'],
    });

    const rotate = translateX.interpolate({
        inputRange: [-150, 150],
        outputRange: ['-12deg', '12deg'],
        extrapolate: 'clamp',
    });

    const shadowOpacity = isDragging.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
    });

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.block,
                {
                    opacity,
                    borderColor,
                    backgroundColor,
                    // @ts-ignore
                    shadowColor: '#4DFFB4',
                    shadowOpacity,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 8 },
                    transform: [{ translateX }, { translateY }, { scale }, { rotate }],
                },
            ]}
        >
            <Text style={styles.label}>{block.label}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    block: {
        width: 96,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        margin: 4,
        // Elevation so dragged block renders above slots
        elevation: 12,
        zIndex: 100,
        // Glow outline simulation mostly done via shadow
    },
    label: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
