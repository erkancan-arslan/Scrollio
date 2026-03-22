import React, { memo, useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText, G } from 'react-native-svg';
import { REGIONS, Region } from '../data/regions';
import { ProvinceOwnership, PlayerId, TurnPhase, PLAYER_COLORS, NEUTRAL_COLOR } from '../types';

interface TurkeyMapProps {
    ownership: ProvinceOwnership;
    selectableRegionIds: string[];
    onRegionPress: (regionId: string) => void;
    phase: TurnPhase;
}

const VIEW_BOX = '0 0 1000 580';

// Animated.createAnimatedComponent doesn't work directly with react-native-svg Path
// so we animate the wrapper G's opacity instead (native driver ok).
const RegionPath = memo(({
    region,
    fillColor,
    isSelectable,
    isSelecting,
    onPress,
    pulseAnim,
}: {
    region: Region;
    fillColor: string;
    isSelectable: boolean;
    isSelecting: boolean;
    onPress: (id: string) => void;
    pulseAnim: Animated.Value;
}) => {
    const baseOpacity = isSelecting && !isSelectable ? 0.38 : 1;
    const strokeColor = isSelectable ? '#FFFFFF' : 'rgba(255,255,255,0.18)';
    const strokeWidth = isSelectable ? 4 : 1.5;

    // For selectable regions, add an animated glow ring using a second (wider, semi-transparent) path
    return (
        <G opacity={baseOpacity}>
            {isSelectable && (
                <Path
                    d={region.svgPath}
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={10}
                    strokeLinejoin="round"
                    opacity={pulseAnim as any}
                />
            )}
            <Path
                d={region.svgPath}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                onPress={isSelectable ? () => onPress(region.id) : undefined}
            />
            <SvgText
                x={region.labelX}
                y={region.labelY}
                fontSize={26}
                fill="rgba(255,255,255,0.88)"
                textAnchor="middle"
                fontWeight="700"
                pointerEvents="none"
            >
                {region.name}
            </SvgText>
        </G>
    );
});

export const TurkeyMap: React.FC<TurkeyMapProps> = memo(({
    ownership,
    selectableRegionIds,
    onRegionPress,
    phase,
}) => {
    const isSelecting = phase === 'selecting' || phase === 'claiming';
    const selectableSet = new Set(selectableRegionIds);

    // Shared pulse animation for all selectable region glow rings
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (selectableRegionIds.length === 0) {
            pulseAnim.setValue(0.3);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.85,
                    duration: 700,
                    useNativeDriver: false,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.2,
                    duration: 700,
                    useNativeDriver: false,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [selectableRegionIds.length]);

    return (
        <View style={styles.container}>
            <Svg
                viewBox={VIEW_BOX}
                style={styles.svg}
                preserveAspectRatio="xMidYMid meet"
            >
                {REGIONS.map(region => {
                    const owner = ownership[region.id];
                    const fillColor =
                        owner === 'neutral' || owner === undefined
                            ? NEUTRAL_COLOR
                            : PLAYER_COLORS[owner as PlayerId];
                    const isSelectable = selectableSet.has(region.id);

                    return (
                        <RegionPath
                            key={region.id}
                            region={region}
                            fillColor={fillColor}
                            isSelectable={isSelectable}
                            isSelecting={isSelecting}
                            onPress={onRegionPress}
                            pulseAnim={pulseAnim}
                        />
                    );
                })}
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#0A1628',
    },
    svg: {
        flex: 1,
        width: '100%',
    },
});
