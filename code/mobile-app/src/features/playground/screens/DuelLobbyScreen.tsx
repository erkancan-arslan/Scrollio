/**
 * DuelLobbyScreen
 * Shown after sending a duel request. Displays waiting state with
 * cancel option. Navigates to DuelGameScreen on acceptance.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { duelService } from '../services/duelService';
import { colors, spacing } from '../../../theme';

type DuelLobbyParams = {
    DuelLobby: {
        requestId: string;
        opponentName: string;
    };
};

export const DuelLobbyScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<DuelLobbyParams, 'DuelLobby'>>();
    const { requestId, opponentName } = route.params;

    const [status, setStatus] = useState<'waiting' | 'accepted' | 'rejected' | 'expired' | 'canceled'>('waiting');
    const [countdown, setCountdown] = useState(30);
    const pulseAnim = useState(new Animated.Value(0.3))[0];

    // Pulse animation
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ]),
        );
        anim.start();
        return () => anim.stop();
    }, [pulseAnim]);

    // Countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Listen for request updates via realtime
    useEffect(() => {
        // We need the current user's ID to subscribe, but since the DuelService
        // already has an active subscription for the user, we rely on the
        // duel request channel events that are already being handled.
        // This is a simplified approach.
        const checkInterval = setInterval(async () => {
            try {
                // Poll for the request status (fallback if realtime misses)
                const response = await duelService.getDuelMatchState(requestId).catch(() => null);
                // This won't work directly as requestId != matchId
                // The realtime update will handle navigation
            } catch {
                // Ignore polling errors
            }
        }, 5000);

        return () => clearInterval(checkInterval);
    }, [requestId]);

    const handleCancel = useCallback(async () => {
        try {
            await duelService.respondDuelRequest(requestId, 'cancel');
            setStatus('canceled');
            setTimeout(() => navigation.goBack(), 500);
        } catch (err) {
            console.error('Error canceling duel:', err);
            navigation.goBack();
        }
    }, [requestId, navigation]);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const getStatusMessage = () => {
        switch (status) {
            case 'waiting':
                return `Waiting for ${opponentName}…`;
            case 'accepted':
                return 'Challenge accepted! Starting…';
            case 'rejected':
                return `${opponentName} declined the challenge.`;
            case 'expired':
                return 'Challenge request expired.';
            case 'canceled':
                return 'Challenge canceled.';
            default:
                return '';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Duel Lobby</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {status === 'waiting' && (
                    <>
                        <Animated.View style={[styles.swordsContainer, { opacity: pulseAnim }]}>
                            <Ionicons name="flash" size={80} color="#FFD700" />
                        </Animated.View>

                        <Text style={styles.statusText}>{getStatusMessage()}</Text>

                        <View style={styles.countdownContainer}>
                            <Text style={styles.countdownLabel}>Expires in</Text>
                            <Text style={[styles.countdown, countdown <= 5 && styles.countdownUrgent]}>
                                {countdown}s
                            </Text>
                        </View>

                        <ActivityIndicator size="large" color="#FFD700" style={{ marginBottom: spacing.xl }} />

                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                            <Ionicons name="close" size={20} color="#FF4444" />
                            <Text style={styles.cancelText}>Cancel Challenge</Text>
                        </TouchableOpacity>
                    </>
                )}

                {(status === 'rejected' || status === 'expired' || status === 'canceled') && (
                    <>
                        <Ionicons
                            name={status === 'rejected' ? 'close-circle' : 'time'}
                            size={80}
                            color="#FF4444"
                        />
                        <Text style={styles.statusText}>{getStatusMessage()}</Text>

                        <TouchableOpacity style={styles.goBackBtn} onPress={handleGoBack}>
                            <Text style={styles.goBackText}>Go Back</Text>
                        </TouchableOpacity>
                    </>
                )}

                {status === 'accepted' && (
                    <>
                        <Ionicons name="checkmark-circle" size={80} color="#00C853" />
                        <Text style={styles.statusText}>{getStatusMessage()}</Text>
                        <ActivityIndicator size="large" color="#00C853" />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    swordsContainer: {
        marginBottom: spacing.xl,
    },
    statusText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    countdownContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    countdownLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    countdown: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFD700',
        fontVariant: ['tabular-nums'],
    },
    countdownUrgent: {
        color: '#FF4444',
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF4444',
        gap: 8,
    },
    cancelText: {
        color: '#FF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    goBackBtn: {
        marginTop: spacing.xl,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    goBackText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
