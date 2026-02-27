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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing, typography } from '../../../theme';
import { authService, apiClient } from '../../../services';

type SignInScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
};

const testEmail = __DEV__ ? (process.env.EXPO_PUBLIC_TEST_EMAIL ?? '') : '';
const testPassword = __DEV__ ? (process.env.EXPO_PUBLIC_TEST_PASSWORD ?? '') : '';

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState(testEmail);
    const [password, setPassword] = useState(testPassword);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            setError('Please enter email and password');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await authService.signIn({ email, password });

        setLoading(false);

        if (result.success) {
            // If user has parent/school role, send them to Kids flow
            const meRes = await apiClient.get<{ primaryRole?: string }>('/kids/auth/me').catch(() => ({ data: null }));
            const role = meRes?.data?.primaryRole;
            const isParentOrSchool = role === 'parent' || role === 'school';
            navigation.reset({
                index: 0,
                routes: [{ name: isParentOrSchool ? 'Kids' : 'MainTabs' }],
            });
        } else {
            setError(result.error || 'Sign in failed. Please try again.');
        }
    };

    const handleTabChange = (tab: 'signin' | 'signup') => {
        if (tab === 'signup') {
            navigation.navigate('SignUp');
        } else {
            setActiveTab(tab);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Decorative circles */}
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
                    {/* Back to landing */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('AppLanding')}
                        accessibilityLabel="Go back"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={styles.backArrow}>{'<'}</Text>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

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
                        <Text style={styles.welcomeTitle}>Welcome back!</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Learn something new every moment.
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

                            {/* Sign In Button */}
                            <TouchableOpacity
                                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                onPress={handleSignIn}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>

                            {/* Forgot Password */}
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

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

                            {/* Sign Up Link */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                    <Text style={styles.footerLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
        paddingBottom: spacing.xl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: spacing.sm,
        padding: spacing.sm,
        minHeight: 44,
    },
    backArrow: {
        fontSize: 20,
        fontWeight: '700',
        color: ACCENT_COLOR,
        marginRight: 4,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        color: ACCENT_COLOR,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    logo: {
        width: 200,
        height: 200,
    },
    welcomeContainer: {
        marginBottom: spacing.lg,
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
        marginBottom: spacing.lg,
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
        gap: spacing.md,
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
        height: 56,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    inputIcon: {
        fontSize: 18,
        marginRight: spacing.sm,
        color: '#888888',
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: '#1A1A1A',
    },
    eyeIcon: {
        fontSize: 18,
        color: '#888888',
    },
    primaryButton: {
        backgroundColor: ACCENT_COLOR,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: typography.fontSize.md,
        fontWeight: '600',
    },
    forgotPassword: {
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    forgotPasswordText: {
        fontSize: typography.fontSize.sm,
        color: ACCENT_COLOR,
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.sm,
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
        fontSize: 20,
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
        paddingTop: spacing.sm,
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
});
