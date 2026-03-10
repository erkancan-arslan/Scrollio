import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { spacing } from '../../../theme';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AppLanding'>;
};

const CORE_ACCENT = '#FF8C42';
const KIDS_ACCENT = '#FF6B35';
const BG = '#F7F3ED';

export const AppLandingScreen: React.FC<Props> = ({ navigation }) => {
    const { width } = useWindowDimensions();
    // Stack cards vertically on narrow viewports (e.g. phone); side-by-side on wide (e.g. desktop)
    const isWide = width >= 500;

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
                            onPress={() => navigation.navigate('SignIn')}
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
                        style={styles.adminLink}
                        onPress={() => navigation.navigate('Admin')}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Text style={styles.adminLinkText}>Admin</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
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
    adminLink: {
        marginTop: spacing.xl,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    adminLinkText: {
        fontSize: 14,
        color: '#666',
        textDecorationLine: 'underline',
    },
});
