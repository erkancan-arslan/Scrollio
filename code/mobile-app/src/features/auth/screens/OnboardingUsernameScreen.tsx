import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing, typography } from '../../../theme';
import { profileService } from '../../../services/profile/profileService';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OnboardingUsername'>;
};

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

function validateUsername(value: string): string | null {
    if (value.length < 3) return 'At least 3 characters required';
    if (value.length > 20) return 'Max 20 characters';
    if (!USERNAME_REGEX.test(value)) return 'Only lowercase letters, numbers, and underscores';
    return null;
}

export const OnboardingUsernameScreen: React.FC<Props> = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validationError = username.length > 0 ? validateUsername(username) : null;
    const isValid = username.length > 0 && validationError === null;

    const handleNext = async () => {
        const err = validateUsername(username);
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        setError(null);

        const result = await profileService.updateProfile({ username });

        setLoading(false);

        if (result.error) {
            if (result.error.toLowerCase().includes('taken') || result.error.toLowerCase().includes('conflict')) {
                setError('That username is already taken. Try another one.');
            } else {
                setError(result.error || 'Something went wrong. Please try again.');
            }
            return;
        }

        navigation.navigate('OnboardingInterests');
    };

    const handleChangeText = (text: string) => {
        setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
        setError(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.decorCircleTopRight} />
            <View style={styles.decorCircleLeft} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Step indicator */}
                    <View style={styles.stepRow}>
                        <View style={[styles.stepDot, styles.stepDotActive]} />
                        <View style={styles.stepLine} />
                        <View style={styles.stepDot} />
                        <View style={styles.stepLine} />
                        <View style={styles.stepDot} />
                    </View>
                    <Text style={styles.stepLabel}>Step 1 of 3</Text>

                    {/* Heading */}
                    <View style={styles.headingContainer}>
                        <Text style={styles.emoji}>✏️</Text>
                        <Text style={styles.title}>Choose your username</Text>
                        <Text style={styles.subtitle}>
                            This is how others will find and mention you on Scrollio.
                        </Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        {/* Error */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Input */}
                        <View style={[
                            styles.inputContainer,
                            isValid && styles.inputValid,
                            (validationError !== null) && styles.inputInvalid,
                        ]}>
                            <Text style={styles.atSign}>@</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="your_username"
                                placeholderTextColor="#AAAAAA"
                                value={username}
                                onChangeText={handleChangeText}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoFocus
                                maxLength={20}
                            />
                            {isValid && <Text style={styles.checkMark}>✓</Text>}
                        </View>

                        {/* Live hints */}
                        <View style={styles.hints}>
                            <HintRow text="3–20 characters" met={username.length >= 3} />
                            <HintRow text="Lowercase letters, numbers, underscores only" met={username.length > 0 && /^[a-z0-9_]+$/.test(username)} />
                        </View>

                        {/* Next button */}
                        <TouchableOpacity
                            style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
                            onPress={handleNext}
                            disabled={!isValid || loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Next →</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

interface HintRowProps {
    text: string;
    met: boolean;
}

const HintRow: React.FC<HintRowProps> = ({ text, met }) => (
    <View style={hintStyles.row}>
        <View style={[hintStyles.dot, met && hintStyles.dotMet]} />
        <Text style={[hintStyles.text, met && hintStyles.textMet]}>{text}</Text>
    </View>
);

const hintStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CCCCCC', marginRight: 8 },
    dotMet: { backgroundColor: '#34C759' },
    text: { fontSize: 12, color: '#999999' },
    textMet: { color: '#34C759' },
});

const ACCENT = '#FF8C42';
const BG = '#F7F3ED';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    decorCircleTopRight: {
        position: 'absolute', top: -60, right: -80,
        width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(244, 195, 176, 0.5)',
    },
    decorCircleLeft: {
        position: 'absolute', top: 180, left: -80,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: 'rgba(244, 195, 176, 0.4)',
    },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: 70,
        paddingBottom: spacing.xl,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: spacing.xs,
    },
    stepDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#D8D0C8',
    },
    stepDotActive: { backgroundColor: ACCENT, width: 24, borderRadius: 5 },
    stepLine: { width: 32, height: 2, backgroundColor: '#D8D0C8', marginHorizontal: 4 },
    stepLabel: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        marginBottom: spacing.xl,
        fontWeight: '500',
    },
    headingContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    emoji: { fontSize: 48, marginBottom: spacing.sm },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        borderRadius: 10,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    errorText: { color: '#D32F2F', fontSize: typography.fontSize.sm, textAlign: 'center' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        marginBottom: spacing.sm,
    },
    inputValid: { borderColor: '#34C759' },
    inputInvalid: { borderColor: '#FFCDD2' },
    atSign: { fontSize: 18, color: ACCENT, fontWeight: '600', marginRight: 6 },
    input: { flex: 1, fontSize: typography.fontSize.lg, color: '#1A1A1A', fontWeight: '500' },
    checkMark: { fontSize: 18, color: '#34C759' },
    hints: { paddingLeft: spacing.xs, marginBottom: spacing.lg },
    button: {
        backgroundColor: ACCENT,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.45 },
    buttonText: { color: '#FFFFFF', fontSize: typography.fontSize.md, fontWeight: '700' },
});
