/**
 * DuelRequestModal
 * Shown when the current user receives an incoming duel request.
 * Displays challenger info, countdown, and accept/decline buttons.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIncomingDuelRequest, setIncomingDuelRequest } from '../store/playgroundSlice';
import { duelService } from '../services/duelService';
import { colors, spacing } from '../../../theme';

export const DuelRequestModal: React.FC = () => {
    const dispatch = useAppDispatch();
    const request = useAppSelector(selectIncomingDuelRequest);
    const [countdown, setCountdown] = useState(30);
    const [isResponding, setIsResponding] = useState(false);
    const pulseAnim = useState(new Animated.Value(1))[0];

    // Countdown timer
    useEffect(() => {
        if (!request) return;

        const expiresAt = new Date(request.expiresAt).getTime();
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
            setCountdown(remaining);

            if (remaining <= 0) {
                dispatch(setIncomingDuelRequest(null));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [request, dispatch]);

    // Pulse animation for the icon
    useEffect(() => {
        if (!request) return;

        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        );
        anim.start();
        return () => anim.stop();
    }, [request, pulseAnim]);

    const handleAccept = useCallback(async () => {
        if (!request || isResponding) return;
        setIsResponding(true);
        try {
            await duelService.respondDuelRequest(request.id, 'accept');
            // The match navigation will be handled by the request update listener
        } catch (err) {
            console.error('Error accepting duel:', err);
        } finally {
            setIsResponding(false);
            dispatch(setIncomingDuelRequest(null));
        }
    }, [request, isResponding, dispatch]);

    const handleDecline = useCallback(async () => {
        if (!request || isResponding) return;
        setIsResponding(true);
        try {
            await duelService.respondDuelRequest(request.id, 'reject');
        } catch (err) {
            console.error('Error declining duel:', err);
        } finally {
            setIsResponding(false);
            dispatch(setIncomingDuelRequest(null));
        }
    }, [request, isResponding, dispatch]);

    if (!request) return null;

    return (
        <Modal
            visible={!!request}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header */}
                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="flash" size={40} color="#FFD700" />
                    </Animated.View>

                    <Text style={styles.title}>DUEL CHALLENGE!</Text>

                    {/* Challenger Info */}
                    <View style={styles.challengerRow}>
                        {request.fromUserAvatar ? (
                            <Image
                                source={{ uri: request.fromUserAvatar }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={24} color="#666" />
                            </View>
                        )}
                        <Text style={styles.challengerName}>{request.fromUserName}</Text>
                    </View>

                    <Text style={styles.subtitle}>wants to duel you in Infinite Flow!</Text>

                    {/* Countdown */}
                    <View style={styles.countdownContainer}>
                        <Text style={[styles.countdown, countdown <= 5 && styles.countdownUrgent]}>
                            {countdown}s
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.btn, styles.acceptBtn]}
                            onPress={handleAccept}
                            disabled={isResponding}
                        >
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={styles.btnText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.declineBtn]}
                            onPress={handleDecline}
                            disabled={isResponding}
                        >
                            <Ionicons name="close-circle" size={22} color="#fff" />
                            <Text style={styles.btnText}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    card: {
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,215,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: 2,
        marginBottom: spacing.lg,
    },
    challengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: spacing.sm,
    },
    avatarPlaceholder: {
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    challengerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: spacing.lg,
    },
    countdownContainer: {
        marginBottom: spacing.lg,
    },
    countdown: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    countdownUrgent: {
        color: '#FF4444',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 6,
    },
    acceptBtn: {
        backgroundColor: '#00C853',
    },
    declineBtn: {
        backgroundColor: '#FF4444',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
