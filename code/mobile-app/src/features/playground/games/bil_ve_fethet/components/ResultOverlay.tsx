import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { TurnResult, PlayerId, PLAYER_COLORS, PLAYER_LABELS, NEUTRAL_COLOR } from '../types';
import { REGION_BY_ID } from '../data/regions';

interface ResultOverlayProps {
    visible: boolean;
    result: TurnResult;
    onContinue: () => void;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({ visible, result, onContinue }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.7)).current;
    const cardSlideAnim = useRef(new Animated.Value(60)).current;
    const scoreAnim = useRef(new Animated.Value(0)).current;
    const [displayAttacker, setDisplayAttacker] = useState(0);
    const [displayDefender, setDisplayDefender] = useState(0);

    useEffect(() => {
        if (visible) {
            // Trigger haptic feedback
            if (result.conquered) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }

            // Reset animations
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.7);
            cardSlideAnim.setValue(60);
            scoreAnim.setValue(0);
            setDisplayAttacker(0);
            setDisplayDefender(0);

            // Entrance animation
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 90,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(cardSlideAnim, {
                    toValue: 0,
                    tension: 90,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]).start();

            // Animated score count-up
            const duration = 600;
            const steps = 20;
            const interval = duration / steps;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                const progress = step / steps;
                setDisplayAttacker(Math.round(result.attackerScore * progress));
                setDisplayDefender(Math.round(result.defenderScore * progress));
                if (step >= steps) {
                    clearInterval(timer);
                    setDisplayAttacker(result.attackerScore);
                    setDisplayDefender(result.defenderScore);
                }
            }, interval);
            return () => clearInterval(timer);
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.7);
            cardSlideAnim.setValue(60);
        }
    }, [visible]);

    if (!visible) return null;

    const provinceName = REGION_BY_ID[result.regionId]?.name ?? result.regionId;
    const conquered = result.conquered;
    const headline = conquered ? '⚔️ Fethedildi!' : '🛡️ Savunuldu!';
    const headlineColor = conquered ? '#34C759' : '#FF9500';
    const borderGlow = conquered ? 'rgba(52,199,89,0.35)' : 'rgba(255,149,0,0.35)';

    const attackerColor = PLAYER_COLORS[result.attackerId];
    const defenderColor =
        result.defenderId === 'neutral' ? NEUTRAL_COLOR : PLAYER_COLORS[result.defenderId as PlayerId];
    const defenderLabel =
        result.defenderId === 'neutral' ? 'Nötr' : PLAYER_LABELS[result.defenderId as PlayerId];

    const attackerWon = result.attackerScore > result.defenderScore;

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View
                style={[
                    styles.card,
                    {
                        borderColor: borderGlow,
                        transform: [
                            { scale: scaleAnim },
                            { translateY: cardSlideAnim },
                        ],
                    },
                ]}
            >
                {/* Headline */}
                <Text style={[styles.headline, { color: headlineColor }]}>{headline}</Text>
                <Text style={styles.regionName}>{provinceName}</Text>

                {/* Score comparison */}
                <View style={styles.scoreRow}>
                    <View style={[styles.scoreBox, attackerWon && styles.winnerBox]}>
                        <Text style={[styles.scoreLabel, { color: attackerColor }]}>
                            {PLAYER_LABELS[result.attackerId]}
                        </Text>
                        <Text style={[styles.scoreValue, attackerWon && styles.winnerScore]}>
                            {displayAttacker}
                        </Text>
                        <Text style={styles.scoreSub}>puan</Text>
                        {attackerWon && <Text style={styles.crownEmoji}>👑</Text>}
                    </View>

                    <View style={styles.vsContainer}>
                        <Text style={styles.vs}>VS</Text>
                    </View>

                    <View style={[styles.scoreBox, !attackerWon && styles.winnerBox]}>
                        <Text style={[styles.scoreLabel, { color: defenderColor }]}>
                            {defenderLabel}
                        </Text>
                        <Text style={[styles.scoreValue, !attackerWon && styles.winnerScore]}>
                            {displayDefender}
                        </Text>
                        <Text style={styles.scoreSub}>puan</Text>
                        {!attackerWon && <Text style={styles.crownEmoji}>👑</Text>}
                    </View>
                </View>

                {/* Continue button */}
                <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: headlineColor }]}
                    onPress={onContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueBtnText}>Devam Et</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 28,
        padding: 28,
        width: '84%',
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 16,
        gap: 4,
    },
    headline: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    regionName: {
        fontSize: 15,
        color: '#AEAEB2',
        fontWeight: '600',
        marginBottom: 20,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
        gap: 8,
    },
    scoreBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 2,
    },
    winnerBox: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    scoreValue: {
        fontSize: 38,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 44,
    },
    winnerScore: {
        fontSize: 42,
    },
    crownEmoji: {
        fontSize: 16,
        marginTop: 2,
    },
    scoreSub: {
        fontSize: 11,
        color: '#636366',
    },
    vsContainer: {
        width: 36,
        alignItems: 'center',
    },
    vs: {
        fontSize: 13,
        fontWeight: '900',
        color: '#48484A',
        letterSpacing: 1,
    },
    continueBtn: {
        borderRadius: 16,
        paddingVertical: 15,
        paddingHorizontal: 40,
        width: '100%',
        alignItems: 'center',
        marginTop: 4,
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
