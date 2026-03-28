import React, { memo, useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path, G, Image as SvgImage, Circle, Text as SvgText } from 'react-native-svg';
import { REGIONS, Region } from '../data/regions';
import { ProvinceOwnership, PlayerId, TurnPhase, PLAYER_COLORS, PLAYER_LABELS, NEUTRAL_COLOR } from '../types';

const MAP_IMAGE = require('../../../../../../assets/lastmap.png');

interface TurkeyMapProps {
    ownership: ProvinceOwnership;
    selectableRegionIds: string[];
    onRegionPress: (regionId: string) => void;
    phase: TurnPhase;
}

const VIEW_BOX = '0 0 720 1280';

const RegionPath = memo(({
    region,
    owner,
    fillColor,
    isSelectable,
    isSelecting,
    onPress,
    pulseAnim,
}: {
    region: Region;
    owner: PlayerId | 'neutral' | undefined;
    fillColor: string;
    isSelectable: boolean;
    isSelecting: boolean;
    onPress: (id: string) => void;
    pulseAnim: Animated.Value;
}) => {
    const isNeutral = !owner || owner === 'neutral';
    const baseOpacity = isSelecting && !isSelectable ? 0.4 : 1;

    return (
        <G opacity={baseOpacity}>
            {isSelectable && (
                <Path
                    d={region.svgPath}
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth={10}
                    strokeLinejoin="round"
                    opacity={pulseAnim as any}
                />
            )}
            <Path
                d={region.svgPath}
                fill="none"
                stroke="none"
                onPress={isSelectable ? () => onPress(region.id) : undefined}
            />
            {!isNeutral && (
                <G>
                    <Circle
                        cx={region.labelX}
                        cy={region.labelY}
                        r={22}
                        fill={fillColor}
                        opacity={0.92}
                    />
                    <Circle
                        cx={region.labelX}
                        cy={region.labelY}
                        r={22}
                        fill="none"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={2.5}
                    />
                    <SvgText
                        x={region.labelX}
                        y={region.labelY + 5}
                        fontSize={12}
                        fill="#FFFFFF"
                        textAnchor="middle"
                        fontWeight="700"
                        pointerEvents="none"
                    >
                        {PLAYER_LABELS[owner as PlayerId]}
                    </SvgText>
                </G>
            )}
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

    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (selectableRegionIds.length === 0) {
            pulseAnim.setValue(0.3);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.85, duration: 700, useNativeDriver: false }),
                Animated.timing(pulseAnim, { toValue: 0.2, duration: 700, useNativeDriver: false }),
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
                <SvgImage
                    x={0}
                    y={0}
                    width={720}
                    height={1280}
                    href={MAP_IMAGE}
                    preserveAspectRatio="xMidYMid meet"
                />
                <G transform="translate(0, 25)">
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
                                owner={owner}
                                fillColor={fillColor}
                                isSelectable={isSelectable}
                                isSelecting={isSelecting}
                                onPress={onRegionPress}
                                pulseAnim={pulseAnim}
                            />
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#1A3A5C',
    },
    svg: {
        flex: 1,
        width: '100%',
    },
});
