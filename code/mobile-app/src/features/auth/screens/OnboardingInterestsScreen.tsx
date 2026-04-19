import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing, typography } from '../../../theme';
import { feedService } from '../../../services/feed/feedService';
import { profileService } from '../../../services/profile/profileService';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingInterests'>;
};

const MIN_SELECTIONS = 3;

/** Maps known topic names to emojis for display. Falls back to 📚. */
const TOPIC_EMOJI: Record<string, string> = {
    'Financial Markets':   '📈',
    'Personal Finance':    '💰',
    'Economics':           '📊',
    'Investing':           '💎',
    'Computer Networks':   '🌐',
    'Discrete Mathematics':'🔢',
    'Mathematics':         '📐',
    'History':             '📜',
    'Chess':               '♟️',
    'Backgammon':          '🎲',
    'Colors':              '🎨',
    'Science':             '🔬',
    'Technology':          '💻',
    'Psychology':          '🧠',
    'Health':              '💪',
    'Music':               '🎵',
    'Art':                 '🖼️',
    'Space':               '🌌',
    'Philosophy':          '🤔',
    'Literature':          '📚',
    'Politics':            '🗳️',
    'Sports':              '⚽',
    'Food':                '🍳',
    'Travel':              '✈️',
    'Environment':         '🌱',
    'Film':                '🎬',
};

const getEmoji = (topic: string) => TOPIC_EMOJI[topic] ?? '📚';

export const OnboardingInterestsScreen: React.FC<Props> = ({ navigation }) => {
    const [topics, setTopics]       = useState<string[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [selected, setSelected]   = useState<Set<string>>(new Set());
    const [saving, setSaving]       = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const result = await feedService.getVideoTopics();
            if (cancelled) return;
            if (result.data && result.data.topics.length > 0) {
                setTopics(result.data.topics);
            } else {
                setLoadError('Could not load topics. Please try again.');
            }
            setLoadingTopics(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const toggleTopic = (topic: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(topic)) next.delete(topic);
            else next.add(topic);
            return next;
        });
    };

    const canContinue = selected.size >= MIN_SELECTIONS;

    const handleFinish = async () => {
        if (!canContinue || saving) return;
        setSaving(true);
        setSaveError(null);

        const result = await profileService.updateProfile({
            preferences: {
                preferredTopics: Array.from(selected),
            },
        });

        setSaving(false);

        if (result.error) {
            setSaveError('Something went wrong. Please try again.');
            return;
        }

        navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }),
        );
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
                </View>
                <Text style={styles.stepLabel}>Step 2 of 2</Text>

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

                {saveError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{saveError}</Text>
                    </View>
                )}
            </View>

            {/* Topic grid */}
            {loadingTopics ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : loadError ? (
                <View style={styles.loadingBox}>
                    <Text style={styles.errorText}>{loadError}</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                >
                    {topics.map((topic) => {
                        const isSelected = selected.has(topic);
                        return (
                            <TouchableOpacity
                                key={topic}
                                style={[styles.tile, isSelected && styles.tileSelected]}
                                onPress={() => toggleTopic(topic)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.tileEmoji}>{getEmoji(topic)}</Text>
                                <Text
                                    style={[styles.tileLabel, isSelected && styles.tileLabelSelected]}
                                    numberOfLines={2}
                                >
                                    {topic}
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
            )}

            {/* Sticky finish button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, (!canContinue || saving) && styles.buttonDisabled]}
                    onPress={handleFinish}
                    disabled={!canContinue || saving}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Finish & Explore 🎉</Text>
                    )}
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
    counterRow: { marginBottom: spacing.xs },
    counter: { fontSize: 13, color: '#999999', fontWeight: '600' },
    counterReady: { color: '#34C759' },
    errorContainer: {
        backgroundColor: '#FFEBEE', borderRadius: 10,
        paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.xs,
    },
    errorText: { color: '#D32F2F', fontSize: typography.fontSize.sm, textAlign: 'center' },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
