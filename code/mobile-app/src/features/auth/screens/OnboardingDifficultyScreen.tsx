import React, { useState } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing, typography } from '../../../theme';
import { profileService } from '../../../services/profile/profileService';
import { TOPIC_MAP, DIFFICULTY_LEVELS, DifficultyLevel } from '../constants/topics';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingDifficulty'>;
    route: RouteProp<RootStackParamList, 'OnboardingDifficulty'>;
};

export const OnboardingDifficultyScreen: React.FC<Props> = ({ navigation, route }) => {
    const { topics } = route.params;

    // Initialise all topics to 'beginner'
    const [difficulties, setDifficulties] = useState<Record<string, DifficultyLevel>>(
        Object.fromEntries(topics.map((id) => [id, 'beginner'])),
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setDifficulty = (topicId: string, level: DifficultyLevel) => {
        setDifficulties((prev) => ({ ...prev, [topicId]: level }));
    };

    const handleFinish = async () => {
        setLoading(true);
        setError(null);

        const result = await profileService.updateProfile({
            preferences: {
                preferredTopics: topics,
                topicDifficulties: difficulties,
            },
        });

        setLoading(false);

        if (result.error) {
            setError('Something went wrong. Please try again.');
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
                    <View style={[styles.stepDot, styles.stepDotDone]} />
                    <View style={[styles.stepLine, styles.stepLineDone]} />
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                </View>
                <Text style={styles.stepLabel}>Step 3 of 3</Text>

                <Text style={styles.emoji}>📊</Text>
                <Text style={styles.title}>Your level per topic</Text>
                <Text style={styles.subtitle}>
                    Tell us how much you already know. We'll match the content difficulty for each topic.
                </Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </View>

            {/* Topic list */}
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {topics.map((topicId) => {
                    const topic = TOPIC_MAP[topicId];
                    if (!topic) return null;
                    const current = difficulties[topicId];

                    return (
                        <View key={topicId} style={styles.card}>
                            {/* Topic label */}
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardEmoji}>{topic.emoji}</Text>
                                <Text style={styles.cardTitle}>{topic.label}</Text>
                            </View>

                            {/* Difficulty pills */}
                            <View style={styles.pillRow}>
                                {DIFFICULTY_LEVELS.map((level) => {
                                    const isSelected = current === level.id;
                                    return (
                                        <TouchableOpacity
                                            key={level.id}
                                            style={[styles.pill, isSelected && styles.pillSelected]}
                                            onPress={() => setDifficulty(topicId, level.id)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={styles.pillEmoji}>{level.emoji}</Text>
                                            <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
                                                {level.label}
                                            </Text>
                                            <Text style={[styles.pillDesc, isSelected && styles.pillDescSelected]}>
                                                {level.description}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky finish button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleFinish}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
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

    // Header
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
        textAlign: 'center', lineHeight: 22, marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    errorContainer: {
        backgroundColor: '#FFEBEE', borderRadius: 10,
        paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.xs,
    },
    errorText: { color: '#D32F2F', fontSize: typography.fontSize.sm, textAlign: 'center' },

    // Cards
    list: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: 12 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    cardEmoji: { fontSize: 22, marginRight: spacing.sm },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

    // Difficulty pills
    pillRow: { flexDirection: 'row', gap: 8 },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pillSelected: { backgroundColor: '#FFF2E8', borderColor: ACCENT },
    pillEmoji: { fontSize: 18, marginBottom: 3 },
    pillLabel: { fontSize: 11, fontWeight: '700', color: '#555555' },
    pillLabelSelected: { color: ACCENT },
    pillDesc: { fontSize: 9, color: '#AAAAAA', marginTop: 1 },
    pillDescSelected: { color: '#FF8C4299' },

    // Footer
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
    buttonDisabled: { opacity: 0.6, shadowOpacity: 0 },
    buttonText: { color: '#FFFFFF', fontSize: typography.fontSize.md, fontWeight: '700' },
});
