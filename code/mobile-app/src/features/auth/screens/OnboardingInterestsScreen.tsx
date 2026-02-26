import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing, typography } from '../../../theme';
import { TOPICS } from '../constants/topics';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingInterests'>;
};

const MIN_SELECTIONS = 3;

export const OnboardingInterestsScreen: React.FC<Props> = ({ navigation }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleTopic = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const canContinue = selected.size >= MIN_SELECTIONS;

    const handleNext = () => {
        if (!canContinue) return;
        navigation.navigate('OnboardingDifficulty', { topics: Array.from(selected) });
    };

    return (
        <View style={styles.container}>
            <View style={styles.decorCircleTopRight} />
            <View style={styles.decorCircleBottomLeft} />

            {/* Fixed header */}
            <View style={styles.header}>
                <View style={styles.stepRow}>
                    <View style={[styles.stepDot, styles.stepDotDone]} />
                    <View style={[styles.stepLine, styles.stepLineDone]} />
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={styles.stepLine} />
                    <View style={styles.stepDot} />
                </View>
                <Text style={styles.stepLabel}>Step 2 of 3</Text>

                <Text style={styles.emoji}>🎯</Text>
                <Text style={styles.title}>What interests you?</Text>
                <Text style={styles.subtitle}>
                    Select at least {MIN_SELECTIONS} topics to personalise your feed.
                </Text>

                <View style={styles.counterRow}>
                    <Text style={[styles.counter, canContinue && styles.counterReady]}>
                        {selected.size} selected{canContinue ? ' ✓' : ` / ${MIN_SELECTIONS} min`}
                    </Text>
                </View>
            </View>

            {/* Scrollable grid */}
            <ScrollView
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
            >
                {TOPICS.map((topic) => {
                    const isSelected = selected.has(topic.id);
                    return (
                        <TouchableOpacity
                            key={topic.id}
                            style={[styles.tile, isSelected && styles.tileSelected]}
                            onPress={() => toggleTopic(topic.id)}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.tileEmoji}>{topic.emoji}</Text>
                            <Text style={[styles.tileLabel, isSelected && styles.tileLabelSelected]}>
                                {topic.label}
                            </Text>
                            {isSelected && (
                                <View style={styles.checkBadge}>
                                    <Text style={styles.checkBadgeText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky next button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !canContinue && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={!canContinue}
                    activeOpacity={0.85}
                >
                    <Text style={styles.buttonText}>Next →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ACCENT = '#FF8C42';
const BG = '#F7F3ED';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    decorCircleTopRight: {
        position: 'absolute', top: -60, right: -80,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(244, 195, 176, 0.5)',
    },
    decorCircleBottomLeft: {
        position: 'absolute', bottom: 100, left: -80,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(244, 195, 176, 0.35)',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: 70,
        paddingBottom: spacing.md,
        alignItems: 'center',
    },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D8D0C8' },
    stepDotDone: { backgroundColor: ACCENT },
    stepDotActive: { backgroundColor: ACCENT, width: 24, borderRadius: 5 },
    stepLine: { width: 32, height: 2, backgroundColor: '#D8D0C8', marginHorizontal: 4 },
    stepLineDone: { backgroundColor: ACCENT },
    stepLabel: { fontSize: 12, color: '#999999', fontWeight: '500', marginBottom: spacing.lg },
    emoji: { fontSize: 44, marginBottom: spacing.sm },
    title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: spacing.xs },
    subtitle: {
        fontSize: typography.fontSize.md, color: '#666666',
        textAlign: 'center', lineHeight: 22, marginBottom: spacing.md,
    },
    counterRow: { marginBottom: spacing.sm },
    counter: { fontSize: 13, color: '#999999', fontWeight: '600' },
    counterReady: { color: '#34C759' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.md,
        gap: 10,
        justifyContent: 'center',
    },
    tile: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        position: 'relative',
        paddingHorizontal: 6,
    },
    tileSelected: { backgroundColor: '#FFF2E8', borderColor: ACCENT },
    tileEmoji: { fontSize: 28, marginBottom: 6 },
    tileLabel: { fontSize: 11, fontWeight: '600', color: '#555555', textAlign: 'center', lineHeight: 14 },
    tileLabelSelected: { color: ACCENT },
    checkBadge: {
        position: 'absolute', top: 6, right: 6,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: ACCENT,
        alignItems: 'center', justifyContent: 'center',
    },
    checkBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        paddingTop: spacing.sm,
        backgroundColor: BG,
    },
    button: {
        backgroundColor: ACCENT,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: { opacity: 0.45, shadowOpacity: 0 },
    buttonText: { color: '#FFFFFF', fontSize: typography.fontSize.md, fontWeight: '700' },
});
