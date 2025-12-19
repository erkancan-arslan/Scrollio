import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing } from '../../../../theme';
import { useAppDispatch } from '../../../../store/hooks';
import { incrementScore } from '../../store/playgroundSlice';

import { useGameExit } from '../../hooks/useGameExit';

export const PerfectEyeScreen = () => {
    const dispatch = useAppDispatch();
    useGameExit();

    const [targetColor, setTargetColor] = useState({ r: 0, g: 0, b: 0 });
    const [userColor, setUserColor] = useState({ r: 128, g: 128, b: 128 });
    const [score, setScore] = useState(0);
    const [roundScore, setRoundScore] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const generateColor = () => ({
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    });

    useEffect(() => {
        setTargetColor(generateColor());
    }, []);

    const calculateScore = () => {
        const diffR = Math.abs(targetColor.r - userColor.r);
        const diffG = Math.abs(targetColor.g - userColor.g);
        const diffB = Math.abs(targetColor.b - userColor.b);
        const totalDiff = diffR + diffG + diffB;

        // Max difference is roughly 255 * 3 = 765. 
        // Let's say if total diff is < 15, it's perfect (100 pts)
        // If total diff is < 50, it's great (80 pts)
        // etc.

        let points = 0;
        if (totalDiff < 15) points = 100;
        else if (totalDiff < 40) points = 80;
        else if (totalDiff < 80) points = 50;
        else if (totalDiff < 150) points = 20;
        else points = 5;

        setRoundScore(points);
        setScore(s => s + points);
        dispatch(incrementScore(points));
        setShowResult(true);
    };

    const nextRound = () => {
        setTargetColor(generateColor());
        setUserColor({ r: 128, g: 128, b: 128 });
        setShowResult(false);
        setRoundScore(null);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.scoreText}>Total Score: {score}</Text>

            <View style={styles.comparisonContainer}>
                <View style={[styles.colorBox, { backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})` }]}>
                    <Text style={styles.label}>Target</Text>
                </View>
                <View style={[styles.colorBox, { backgroundColor: `rgb(${userColor.r}, ${userColor.g}, ${userColor.b})` }]}>
                    <Text style={styles.label}>Your Mix</Text>
                </View>
            </View>

            {showResult && (
                <View style={styles.resultOverlay}>
                    <Text style={styles.roundScore}>+ {roundScore} Points</Text>
                    <Text style={styles.diffText}>
                        Target: {targetColor.r}, {targetColor.g}, {targetColor.b}{'\n'}
                        Yours: {userColor.r}, {userColor.g}, {userColor.b}
                    </Text>
                </View>
            )}

            <View style={styles.controls}>
                <Text style={styles.sliderLabel}>Red: {userColor.r}</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={255}
                    step={1}
                    value={userColor.r}
                    onValueChange={val => setUserColor(c => ({ ...c, r: val }))}
                    minimumTrackTintColor="#FF0000"
                    thumbTintColor="#FF0000"
                />

                <Text style={styles.sliderLabel}>Green: {userColor.g}</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={255}
                    step={1}
                    value={userColor.g}
                    onValueChange={val => setUserColor(c => ({ ...c, g: val }))}
                    minimumTrackTintColor="#00FF00"
                    thumbTintColor="#00FF00"
                />

                <Text style={styles.sliderLabel}>Blue: {userColor.b}</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={255}
                    step={1}
                    value={userColor.b}
                    onValueChange={val => setUserColor(c => ({ ...c, b: val }))}
                    minimumTrackTintColor="#0000FF"
                    thumbTintColor="#0000FF"
                />
            </View>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={showResult ? nextRound : calculateScore}
            >
                <Text style={styles.actionText}>{showResult ? 'Next Round' : 'Match Color'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.md
    },
    scoreText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.md
    },
    comparisonContainer: {
        flexDirection: 'row',
        height: 150,
        marginBottom: spacing.md,
        borderRadius: spacing.md,
        overflow: 'hidden'
    },
    colorBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    label: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#FFF',
        padding: spacing.xs,
        borderRadius: 4
    },
    controls: {
        padding: spacing.md,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.md
    },
    sliderLabel: {
        color: colors.text.primary,
        marginBottom: spacing.xs
    },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: spacing.md
    },
    actionButton: {
        marginTop: spacing.xl,
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: spacing.md,
        alignItems: 'center'
    },
    actionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold'
    },
    resultOverlay: {
        alignItems: 'center',
        marginBottom: spacing.md
    },
    roundScore: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.success || '#4CAF50'
    },
    diffText: {
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm
    }
});
