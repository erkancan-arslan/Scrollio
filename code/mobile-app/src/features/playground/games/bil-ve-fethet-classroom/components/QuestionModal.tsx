/**
 * Bil ve Fethet: Classroom — Question Modal
 *
 * Overlay shown during question phase with question text,
 * True/False buttons, countdown timer, and answer status.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
} from 'react-native';
import { QuestionState, ClassroomPlayer, PLAYER_COLOR_HEX, QUESTION_TIMER_MS } from '../types';
import { colors, spacing } from '../../../../../theme';

interface QuestionModalProps {
    visible: boolean;
    question: QuestionState | null;
    players: ClassroomPlayer[];
    attackerId: string | null;
    defenderId: string | null;
    myPlayerId: string;
    onAnswer: (answer: boolean) => void;
    hasAnswered: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
    visible,
    question,
    players,
    attackerId,
    defenderId,
    myPlayerId,
    onAnswer,
    hasAnswered,
}) => {
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_MS / 1000);
    const progressAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!question || !visible) return;

        const remaining = Math.max(0, question.endsAt - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));

        // Animate timer bar
        progressAnim.setValue(remaining / QUESTION_TIMER_MS);
        Animated.timing(progressAnim, {
            toValue: 0,
            duration: remaining,
            useNativeDriver: false,
        }).start();

        const interval = setInterval(() => {
            const left = Math.max(0, question.endsAt - Date.now());
            setTimeLeft(Math.ceil(left / 1000));
            if (left <= 0) clearInterval(interval);
        }, 100);

        return () => clearInterval(interval);
    }, [question, visible]);

    if (!question) return null;

    const getPlayerName = (id: string | null): string => {
        if (!id) return '';
        const player = players.find(p => p.id === id);
        return player?.displayName || '';
    };

    const attackerPlayer = players.find(p => p.id === attackerId);
    const defenderPlayer = players.find(p => p.id === defenderId);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header: Attacker vs Defender */}
                    <View style={styles.header}>
                        <View style={styles.playerBadge}>
                            <View style={[
                                styles.playerDot,
                                { backgroundColor: attackerPlayer ? PLAYER_COLOR_HEX[attackerPlayer.color] : '#666' },
                            ]} />
                            <Text style={styles.playerName}>
                                {getPlayerName(attackerId)}
                                {attackerId === myPlayerId ? ' (Sen)' : ''}
                            </Text>
                            <Text style={styles.roleLabel}>⚔️ Saldırı</Text>
                        </View>
                        <Text style={styles.vsText}>VS</Text>
                        <View style={styles.playerBadge}>
                            <View style={[
                                styles.playerDot,
                                { backgroundColor: defenderPlayer ? PLAYER_COLOR_HEX[defenderPlayer.color] : '#666' },
                            ]} />
                            <Text style={styles.playerName}>
                                {getPlayerName(defenderId)}
                                {defenderId === myPlayerId ? ' (Sen)' : ''}
                            </Text>
                            <Text style={styles.roleLabel}>🛡️ Savunma</Text>
                        </View>
                    </View>

                    {/* Timer Bar */}
                    <View style={styles.timerContainer}>
                        <Animated.View
                            style={[
                                styles.timerBar,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    backgroundColor: timeLeft <= 3 ? '#FF3B30' : '#34C759',
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.timerText}>{timeLeft}s</Text>

                    {/* Question */}
                    <Text style={styles.questionText}>{question.questionText}</Text>

                    {/* Answer Buttons */}
                    {!hasAnswered ? (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.answerBtn, styles.trueBtn]}
                                onPress={() => onAnswer(true)}
                                accessibilityLabel="Doğru"
                            >
                                <Text style={styles.answerBtnText}>✓ DOĞRU</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.answerBtn, styles.falseBtn]}
                                onPress={() => onAnswer(false)}
                                accessibilityLabel="Yanlış"
                            >
                                <Text style={styles.answerBtnText}>✗ YANLIŞ</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.waitingContainer}>
                            <Text style={styles.waitingText}>
                                Cevabın gönderildi! Diğer oyuncular bekleniyor...
                            </Text>
                        </View>
                    )}

                    {/* Answer Status */}
                    <View style={styles.statusRow}>
                        {[attackerId, defenderId].filter(Boolean).map(pid => {
                            const answered = question.answeredPlayerIds.includes(pid!);
                            return (
                                <View key={pid} style={styles.statusItem}>
                                    <Text style={[
                                        styles.statusDot,
                                        { color: answered ? '#34C759' : '#666' },
                                    ]}>
                                        {answered ? '●' : '○'}
                                    </Text>
                                    <Text style={styles.statusName}>
                                        {getPlayerName(pid)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    playerBadge: {
        alignItems: 'center',
        flex: 1,
    },
    playerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginBottom: 4,
    },
    playerName: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    roleLabel: {
        color: '#8E8E93',
        fontSize: 11,
        marginTop: 2,
    },
    vsText: {
        color: '#48484A',
        fontSize: 18,
        fontWeight: '900',
        marginHorizontal: 12,
    },
    timerContainer: {
        height: 4,
        backgroundColor: '#2C2C2E',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    timerBar: {
        height: '100%',
        borderRadius: 2,
    },
    timerText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    questionText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 28,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    answerBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    trueBtn: {
        backgroundColor: '#34C759',
    },
    falseBtn: {
        backgroundColor: '#FF3B30',
    },
    answerBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    waitingContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    waitingText: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 16,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        fontSize: 14,
    },
    statusName: {
        color: '#8E8E93',
        fontSize: 12,
    },
});
