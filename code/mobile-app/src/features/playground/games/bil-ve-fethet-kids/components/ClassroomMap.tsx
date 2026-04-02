import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DESKS, Desk } from '../data/classroom';
import { ProvinceOwnership, PlayerId, PLAYER_COLORS } from '../../../games/bil_ve_fethet/types';

const CLASS_BG = require('../../../../../../assets/class.png');
const DESK_IMG = require('../../../../../../assets/desk.png');

// Classroom image native size: 1536 × 2752
const GRID_TOP = '33%';
const GRID_BOTTOM = '14%';
const GRID_LEFT = '9%';
const GRID_RIGHT = '9%';

const ROWS = 3;
const COLS = 5;

// Emoji icons for each player — shown as a floating badge on the desk
const PLAYER_ICON: Record<PlayerId | 'neutral', string> = {
    player: '🧑',
    bot1:   '🤖',
    bot2:   '👾',
    neutral: '',
};

interface ClassroomMapProps {
    ownership: ProvinceOwnership;
    selectableIds: string[];
    onDeskPress: (id: string) => void;
    phase: string;
}

// Animated border — pulses for selectable desks, static glow for owned
const ContourBorder: React.FC<{ color: string; pulse: boolean }> = ({ color, pulse }) => {
    const anim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!pulse) {
            anim.stopAnimation();
            anim.setValue(1);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 0.15, duration: 500, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 1,    duration: 500, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                StyleSheet.absoluteFillObject,
                {
                    borderRadius: 12,
                    borderWidth: pulse ? 4 : 3,
                    borderColor: color,
                    opacity: anim,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: pulse ? 1 : 0.7,
                    shadowRadius: pulse ? 10 : 6,
                    elevation: pulse ? 10 : 4,
                },
            ]}
        />
    );
};

// Small floating ownership badge shown below/on top of the desk image
const OwnerBadge: React.FC<{ owner: PlayerId; color: string }> = ({ owner, color }) => (
    <View
        pointerEvents="none"
        style={[styles.ownerBadge, { backgroundColor: color, borderColor: color + 'AA' }]}
    >
        <Text style={styles.ownerBadgeIcon}>{PLAYER_ICON[owner]}</Text>
    </View>
);

const DeskCell: React.FC<{
    desk: Desk;
    owner: PlayerId | 'neutral';
    selectable: boolean;
    onPress: () => void;
}> = ({ desk, owner, selectable, onPress }) => {
    const isNeutral = owner === 'neutral';
    const ownerColor = isNeutral ? null : PLAYER_COLORS[owner];
    const borderColor = selectable ? PLAYER_COLORS.player : ownerColor;
    const isOwnedByPlayer = owner === 'player';

    return (
        <TouchableOpacity
            style={[
                styles.deskCell,
                selectable && { transform: [{ scale: 1.09 }], zIndex: 10 },
            ]}
            onPress={() => {
                if (selectable) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } else if (isOwnedByPlayer) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onPress();
            }}
            activeOpacity={selectable ? 0.55 : 0.95}
        >
            {/* Pixel-art desk — completely untouched */}
            <Image source={DESK_IMG} style={styles.deskImage} resizeMode="contain" />

            {/* Glowing border — pulses when selectable, static glow when owned */}
            {borderColor && (
                <ContourBorder color={borderColor} pulse={selectable} />
            )}

            {/* Small owner emoji badge floating at top-right corner of the desk */}
            {!isNeutral && (
                <OwnerBadge owner={owner as PlayerId} color={PLAYER_COLORS[owner as PlayerId]} />
            )}
        </TouchableOpacity>
    );
};

export const ClassroomMap: React.FC<ClassroomMapProps> = ({
    ownership,
    selectableIds,
    onDeskPress,
}) => {
    const selectableSet = new Set(selectableIds);

    const rows: Desk[][] = [];
    for (let r = 0; r < ROWS; r++) {
        rows.push(DESKS.filter(d => d.row === r));
    }

    return (
        <ImageBackground
            source={CLASS_BG}
            style={styles.background}
            resizeMode="cover"
        >
            {/* Desk grid positioned over classroom floor */}
            <View style={styles.deskGrid}>
                {rows.map((row, rIdx) => (
                    <View key={rIdx} style={styles.deskRow}>
                        {row.map(desk => (
                            <DeskCell
                                key={desk.id}
                                desk={desk}
                                owner={ownership[desk.id] ?? 'neutral'}
                                selectable={selectableSet.has(desk.id)}
                                onPress={() => onDeskPress(desk.id)}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    deskGrid: {
        position: 'absolute',
        top: GRID_TOP,
        bottom: GRID_BOTTOM,
        left: GRID_LEFT,
        right: GRID_RIGHT,
        flexDirection: 'column',
        justifyContent: 'space-around',
    },
    deskRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        flex: 1,
    },
    deskCell: {
        flex: 1,
        marginHorizontal: 3,
        aspectRatio: 1,
        maxWidth: 72,
        maxHeight: 72,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    deskImage: {
        width: '100%',
        height: '100%',
    },
    // Small badge shown in the top-right corner of owned desks
    ownerBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
        elevation: 4,
    },
    ownerBadgeIcon: {
        fontSize: 11,
    },
});
