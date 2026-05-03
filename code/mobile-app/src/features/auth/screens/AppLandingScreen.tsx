import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    useWindowDimensions,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { verifyPinThunk } from '../../kids/auth/store/authSlice';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AppLanding'>;
};

const CORE_ACCENT = '#FF8C42';
const KIDS_ACCENT = '#FF6B35';
const BG = '#F7F3ED';

export const AppLandingScreen: React.FC<Props> = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isWide = width >= 500;

    const dispatch = useAppDispatch();
    const isPinSet = useAppSelector((s) => s.kidsAuth.isPinSet);

    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    const handleCoreTap = useCallback(() => {
        if (isPinSet) {
            setPinInput('');
            setPinError(null);
            setPinModalVisible(true);
        } else {
            navigation.navigate('SignIn');
        }
    }, [isPinSet, navigation]);

    const handlePinSubmit = useCallback(async () => {
        if (verifying || pinInput.length < 4) return;
        setVerifying(true);
        setPinError(null);
        try {
            const result = await dispatch(verifyPinThunk(pinInput)).unwrap();
            if (result.valid) {
                setPinModalVisible(false);
                navigation.navigate('SignIn');
            } else {
                setPinError('Incorrect PIN. Please try again.');
            }
        } catch {
            setPinError('Incorrect PIN. Please try again.');
        } finally {
            setVerifying(false);
        }
    }, [dispatch, pinInput, verifying, navigation]);

    return (
        <SafeAreaView style={styles.safeRoot} edges={['top', 'bottom']}>
            <View style={styles.container}>
                <View style={styles.bubble1} />
                <View style={styles.bubble2} />
                <View style={styles.bubble3} />
                <View style={styles.bubble4} />
                <View style={styles.bubble5} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../../assets/scrollio-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.heading}>Welcome to Scrollio</Text>
                    <Text style={styles.subheading}>Choose your experience</Text>

                    <View style={[styles.cardRow, isWide && styles.cardRowWide]}>
                        {/* Core card */}
                        <TouchableOpacity
                            style={[styles.card, styles.coreCard, isWide && styles.cardWide]}
                            activeOpacity={0.85}
                            onPress={handleCoreTap}
                        >
                            <Image
                                source={require('../../../../assets/core_register.png')}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <Text style={[styles.cardTitle, { color: CORE_ACCENT }]}>Scrollio</Text>
                            <Text style={styles.cardSubtitle}>Learn something new{'\n'}every moment.</Text>
                            <View style={[styles.cardButton, { backgroundColor: CORE_ACCENT }]}>
                                <Text style={styles.cardButtonText}>Get Started</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Kids card */}
                        <TouchableOpacity
                            style={[styles.card, styles.kidsCard, isWide && styles.cardWide]}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('Kids')}
                        >
                            <Image
                                source={require('../../../../assets/kids_register.png')}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <Text style={[styles.cardTitle, { color: KIDS_ACCENT }]}>Scrollio Kids</Text>
                            <Text style={styles.cardSubtitle}>Fun learning{'\n'}for ages 7–12</Text>
                            <View style={[styles.cardButton, { backgroundColor: KIDS_ACCENT }]}>
                                <Text style={styles.cardButtonText}>Let's Go!</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.teacherLink}
                        onPress={() => navigation.navigate('Teacher')}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={styles.teacherLinkText}>Teacher Panel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.adminLink}
                        onPress={() => navigation.navigate('Admin')}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={styles.adminLinkText}>Admin</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Parental PIN gate — shown when a Kids PIN is set and user taps Core */}
            <Modal
                visible={pinModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPinModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalBackdrop}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.pinSheet}>
                        <Text style={styles.pinTitle}>Parental Approval Required</Text>
                        <Text style={styles.pinSubtitle}>
                            Enter your parental PIN to switch to Scrollio.
                        </Text>

                        <TextInput
                            style={styles.pinInput}
                            value={pinInput}
                            onChangeText={(t) => {
                                setPinInput(t.replace(/[^0-9]/g, '').slice(0, 6));
                                setPinError(null);
                            }}
                            keyboardType="number-pad"
                            secureTextEntry
                            maxLength={6}
                            placeholder="••••"
                            placeholderTextColor="#BBBBBB"
                            autoFocus
                        />

                        {pinError && (
                            <Text style={styles.pinError}>{pinError}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.pinButton, (verifying || pinInput.length < 4) && styles.pinButtonDisabled]}
                            onPress={handlePinSubmit}
                            disabled={verifying || pinInput.length < 4}
                            activeOpacity={0.85}
                        >
                            {verifying
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={styles.pinButtonText}>Confirm</Text>
                            }
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pinCancel}
                            onPress={() => setPinModalVisible(false)}
                        >
                            <Text style={styles.pinCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeRoot: {
        flex: 1,
        backgroundColor: BG,
    },
    container: {
        flex: 1,
        backgroundColor: BG,
        padding: spacing.lg,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 24,
        alignItems: 'center',
    },
    bubble1: {
        position: 'absolute',
        top: '6%',
        left: '8%',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(244, 195, 176, 0.4)',
    },
    bubble2: {
        position: 'absolute',
        top: '28%',
        left: '78%',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(244, 195, 176, 0.35)',
    },
    bubble3: {
        position: 'absolute',
        top: '52%',
        left: '15%',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(244, 195, 176, 0.38)',
    },
    bubble4: {
        position: 'absolute',
        top: '65%',
        left: '72%',
        width: 95,
        height: 95,
        borderRadius: 48,
        backgroundColor: 'rgba(244, 195, 176, 0.32)',
    },
    bubble5: {
        position: 'absolute',
        top: '85%',
        left: '45%',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(244, 195, 176, 0.36)',
    },
    logoContainer: {
        marginBottom: spacing.md,
    },
    logo: {
        width: 120,
        height: 120,
    },
    heading: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subheading: {
        fontSize: 16,
        color: '#666',
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    cardRow: {
        width: '100%',
        maxWidth: 500,
        gap: spacing.md,
        flexDirection: 'column', // mobile: stack Scrollio & Scrollio Kids vertically
    },
    cardRowWide: {
        flexDirection: 'row', // wide viewport: side by side
    },
    card: {
        borderRadius: 24,
        padding: spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardWide: {
        flex: 1,
    },
    coreCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: 'rgba(255,140,66,0.15)',
    },
    kidsCard: {
        backgroundColor: '#FFF8F0',
        borderWidth: 2,
        borderColor: 'rgba(255,107,53,0.15)',
    },
    cardIcon: {
        width: 160,
        height: 160,
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    cardButton: {
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        alignItems: 'center',
        width: '100%',
    },
    cardButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    teacherLink: {
        marginTop: spacing.xl,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    teacherLinkText: {
        fontSize: 14,
        color: '#0277BD',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    adminLink: {
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    adminLinkText: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'underline',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    pinSheet: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: spacing.xl,
        alignItems: 'center',
    },
    pinTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    pinSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    pinInput: {
        width: '100%',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        fontSize: 22,
        textAlign: 'center',
        letterSpacing: 8,
        color: '#1A1A1A',
        marginBottom: spacing.sm,
    },
    pinError: {
        fontSize: 13,
        color: '#D32F2F',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    pinButton: {
        width: '100%',
        backgroundColor: CORE_ACCENT,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    pinButtonDisabled: {
        opacity: 0.45,
    },
    pinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    pinCancel: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
    },
    pinCancelText: {
        fontSize: 14,
        color: '#999',
    },
});
