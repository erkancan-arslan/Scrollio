import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Image,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { DESKS, Desk } from '../data/classroom';
import { ProvinceOwnership, PlayerId, PLAYER_COLORS } from '../../../games/bil_ve_fethet/types';

const CLASS_BG = require('../../../../../../assets/class.png');
const DESK_IMG = require('../../../../../../assets/desk.png');

// Classroom image native size: 1536 × 2752
// Desk grid starts roughly at 33% from top, occupies ~53% of height
// Left/right margins: ~10%
const GRID_TOP = '33%';
const GRID_BOTTOM = '14%';
const GRID_LEFT = '9%';
const GRID_RIGHT = '9%';

const ROWS = 3;
const COLS = 5;

interface ClassroomMapProps {
    ownership: ProvinceOwnership;
    selectableIds: string[];
    onDeskPress: (id: string) => void;
    phase: string;
}

// Animated contour border around owned / selectable desks
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
                Animated.timing(anim, { toValue: 0.35, duration: 550, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: true }),
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
                    borderRadius: 7,
                    borderWidth: 3,
                    borderColor: color,
                    opacity: anim,
                },
            ]}
        />
    );
};

const DeskCell: React.FC<{
    desk: Desk;
    owner: PlayerId | 'neutral';
    selectable: boolean;
    onPress: () => void;
}> = ({ desk, owner, selectable, onPress }) => {
    const isNeutral = owner === 'neutral';
    const ownerColor = isNeutral ? null : PLAYER_COLORS[owner];
    // Selectable desks pulse in player color; owned desks show a static contour
    const borderColor = selectable ? PLAYER_COLORS.player : ownerColor;

    return (
        <TouchableOpacity
            style={styles.deskCell}
            onPress={onPress}
            activeOpacity={selectable ? 0.75 : 0.95}
        >
            {/* Pixel art desk — untouched, no overlay */}
            <Image source={DESK_IMG} style={styles.deskImage} resizeMode="contain" />

            {/* Colored contour: owned desks get static, selectable desks pulse */}
            {borderColor && (
                <ContourBorder color={borderColor} pulse={selectable} />
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
});
