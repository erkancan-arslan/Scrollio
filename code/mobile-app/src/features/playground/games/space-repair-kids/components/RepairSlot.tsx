import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { RepairSlot as RepairSlotType } from '../types';

export interface SlotLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface RepairSlotProps {
    slot: RepairSlotType;
    slotIndex: number;
    onLayout: (index: number, layout: SlotLayout) => void;
}

export const RepairSlot: React.FC<RepairSlotProps> = ({ slot, slotIndex, onLayout }) => {
    const viewRef = useRef<View>(null);
    const scale = useRef(new Animated.Value(1)).current;
    const glowProgress = useRef(new Animated.Value(0)).current;
    // Extra star-burst scale that plays on correct fill
    const burstScale = useRef(new Animated.Value(1)).current;
    const burstOpacity = useRef(new Animated.Value(0)).current;

    // Trigger glow + bounce when slot becomes filled
    useEffect(() => {
        if (slot.filledByPlayerId !== null) {
            // Big bounce
            Animated.sequence([
                Animated.spring(scale, { toValue: 1.15, useNativeDriver: false, speed: 60, bounciness: 15 }),
                Animated.spring(scale, { toValue: 1.0, useNativeDriver: false, speed: 40, bounciness: 8 }),
            ]).start();
            // Green glow
            Animated.timing(glowProgress, { toValue: 1, duration: 400, useNativeDriver: false }).start();
            // Star burst: fade in then out
            burstOpacity.setValue(1);
            burstScale.setValue(0.5);
            Animated.parallel([
                Animated.spring(burstScale, { toValue: 1.8, useNativeDriver: false, speed: 40, bounciness: 12 }),
                Animated.timing(burstOpacity, { toValue: 0, duration: 800, useNativeDriver: false }),
            ]).start();
        } else {
            Animated.timing(glowProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
        }
    }, [slot.filledByPlayerId]);

    const borderColor = glowProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(77, 255, 180, 0.8)'],
    });
    const backgroundColor = glowProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.05)', 'rgba(13, 43, 32, 0.8)'],
    });
    const shadowOpacity = glowProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.8],
    });

    // Measure absolute screen position after each layout
    const handleLayout = () => {
        viewRef.current?.measure((_fx, _fy, width, height, pageX, pageY) => {
            onLayout(slotIndex, { x: pageX, y: pageY, width, height });
        });
    };

    const isFilled = slot.filledByPlayerId !== null;

    return (
        <View ref={viewRef} onLayout={handleLayout} style={styles.wrapper}>
            <Animated.View
                style={[
                    styles.slot,
                    {
                        transform: [{ scale }],
                        borderColor,
                        backgroundColor,
                        // @ts-ignore — shadowColor is valid on iOS
                        shadowColor: '#4DFFB4',
                        shadowOpacity,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 0 },
                    },
                ]}
            >
                {isFilled ? (
                    <>
                        <Text style={styles.checkmark}>✅</Text>
                        <Text style={styles.filledText} numberOfLines={2}>
                            {slot.question}
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.wrenchIcon}>🔧</Text>
                        <Text style={styles.questionText} numberOfLines={2}>
                            {slot.question}
                        </Text>
                        <Text style={styles.emptyHint}>Cevabı sürükle</Text>
                    </>
                )}
            </Animated.View>

            {/* Star-burst overlay on correct fill */}
            <Animated.Text
                style={[
                    styles.burst,
                    { opacity: burstOpacity, transform: [{ scale: burstScale }] },
                ]}
                pointerEvents="none"
            >
                ✨
            </Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '47%',
        aspectRatio: 1.4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slot: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        gap: 6,
    },
    wrenchIcon: { fontSize: 24, opacity: 0.8 },
    checkmark: { fontSize: 24 },
    questionText: {
        fontSize: 14,
        color: '#E0E0E0',
        textAlign: 'center',
        fontWeight: '700',
    },
    filledText: {
        fontSize: 13,
        color: '#4DFFB4',
        textAlign: 'center',
        fontWeight: '800',
    },
    emptyHint: {
        fontSize: 11,
        color: '#8E8EAA',
        textAlign: 'center',
        fontWeight: '600',
    },
    burst: {
        position: 'absolute',
        fontSize: 40,
        pointerEvents: 'none',
    },
});
