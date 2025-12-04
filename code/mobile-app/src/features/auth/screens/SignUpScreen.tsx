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
    Image,
    Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing, typography } from '../../../theme';
import { authService } from '../../../services';

type SignUpScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
};

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

    const handleSignUp = async () => {
        // Validate inputs
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setError('Password must include uppercase, lowercase, and number');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await authService.signUp({
            email,
            password,
            displayName: name,
        });

        setLoading(false);

        if (result.success) {
            // Navigate to Home on successful sign up
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        } else {
            setError(result.error || 'Sign up failed. Please try again.');
        }
    };

    const handleTabChange = (tab: 'signin' | 'signup') => {
        if (tab === 'signin') {
            navigation.navigate('SignIn');
        } else {
            setActiveTab(tab);
        }
    };

    // Password validation
    const hasMinLength = password.length >= 8;
    const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
    const hasNumber = /\d/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    return (
        <View style={styles.container}>
            {/* Decorative circles */}
            <View style={styles.decorCircleTopRight} />
            <View style={styles.decorCircleLeft} />
            <View style={styles.decorCircleBottom} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../../assets/scrollio-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Welcome text */}
                    <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeTitle}>Create Account</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Start your micro-learning journey today.
                        </Text>
                    </View>

                    {/* Auth Card */}
                    <View style={styles.card}>
                        {/* Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
                                onPress={() => handleTabChange('signin')}
                            >
                                <Text style={[styles.tabText, activeTab === 'signin' && styles.activeTabText]}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                                onPress={() => handleTabChange('signup')}
                            >
                                <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Error Message */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputIcon}>👤</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#A0A0A0"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputIcon}>@</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#A0A0A0"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputIcon}>🔒</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#A0A0A0"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
                                </Pressable>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputIcon}>🔒</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#A0A0A0"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <Pressable
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁' : '👁‍🗨'}</Text>
                                </Pressable>
                            </View>

                            {/* Password Requirements */}
                            {password.length > 0 && (
                                <View style={styles.requirements}>
                                    <RequirementRow text="At least 8 characters" met={hasMinLength} />
                                    <RequirementRow text="Uppercase & lowercase" met={hasUpperLower} />
                                    <RequirementRow text="At least one number" met={hasNumber} />
                                    {confirmPassword.length > 0 && (
                                        <RequirementRow text="Passwords match" met={passwordsMatch} />
                                    )}
                                </View>
                            )}

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                onPress={handleSignUp}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>

                            {/* Terms */}
                            <Text style={styles.terms}>
                                By signing up, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms</Text> and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>
                            </Text>

                            {/* Divider */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Google Button */}
                            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
                                <Text style={styles.googleIcon}>G</Text>
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </TouchableOpacity>

                            {/* Sign In Link */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                    <Text style={styles.footerLink}>Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Skip for Development */}
                    <TouchableOpacity 
                        style={styles.skipButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.skipButtonText}>Skip for now →</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

interface RequirementRowProps {
    text: string;
    met: boolean;
}

const RequirementRow: React.FC<RequirementRowProps> = ({ text, met }) => (
    <View style={requirementStyles.row}>
        <View style={[requirementStyles.dot, met && requirementStyles.dotMet]} />
        <Text style={[requirementStyles.text, met && requirementStyles.textMet]}>{text}</Text>
    </View>
);

const requirementStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#CCCCCC',
        marginRight: 8,
    },
    dotMet: {
        backgroundColor: '#34C759',
    },
    text: {
        fontSize: 12,
        color: '#999999',
    },
    textMet: {
        color: '#34C759',
    },
});

const ACCENT_COLOR = '#FF8C42';
const BACKGROUND_COLOR = '#F7F3ED';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
    },
    decorCircleTopRight: {
        position: 'absolute',
        top: -60,
        right: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(244, 195, 176, 0.5)',
    },
    decorCircleLeft: {
        position: 'absolute',
        top: 120,
        left: -80,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(244, 195, 176, 0.4)',
    },
    decorCircleBottom: {
        position: 'absolute',
        bottom: 50,
        right: -60,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(244, 195, 176, 0.3)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: 50,
        paddingBottom: spacing.xl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logo: {
        width: 200,
        height: 200,
    },
    welcomeContainer: {
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: spacing.xs,
    },
    welcomeSubtitle: {
        fontSize: typography.fontSize.md,
        color: '#666666',
        lineHeight: 22,
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        color: '#888888',
    },
    activeTabText: {
        color: ACCENT_COLOR,
    },
    form: {
        gap: spacing.sm,
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        borderRadius: 10,
        padding: spacing.sm,
        marginBottom: spacing.xs,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        height: 54,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    inputIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
        color: '#888888',
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: '#1A1A1A',
    },
    eyeIcon: {
        fontSize: 16,
        color: '#888888',
    },
    requirements: {
        paddingLeft: spacing.xs,
        paddingTop: spacing.xs,
    },
    primaryButton: {
        backgroundColor: ACCENT_COLOR,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: typography.fontSize.md,
        fontWeight: '600',
    },
    terms: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#1A1A1A',
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xs,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    dividerText: {
        marginHorizontal: spacing.md,
        fontSize: typography.fontSize.sm,
        color: '#999999',
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#EEEEEE',
        gap: spacing.sm,
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: '#EA4335',
    },
    googleButtonText: {
        fontSize: typography.fontSize.md,
        color: ACCENT_COLOR,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: spacing.xs,
    },
    footerText: {
        fontSize: typography.fontSize.sm,
        color: '#666666',
    },
    footerLink: {
        fontSize: typography.fontSize.sm,
        color: ACCENT_COLOR,
        fontWeight: '600',
    },
    skipButton: {
        alignSelf: 'center',
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    skipButtonText: {
        fontSize: typography.fontSize.md,
        color: '#888888',
        fontWeight: '500',
    },
});
