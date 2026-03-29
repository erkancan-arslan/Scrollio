import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeableCardStack } from '../../../components/SwipeableCardStack';
import { PlayerId, PLAYER_COLORS, NEUTRAL_COLOR } from '../types';
import { Lang, t, getPlayerLabel, getNeutralLabel } from '../i18n';

interface QuestionItem {
    id: number;
    type: string;
    question: string;
    answer: boolean;
    hint: string;
}

interface BattleModalProps {
    visible: boolean;
    attackerId: PlayerId;
    defenderId: PlayerId | 'neutral';
    targetProvinceName: string;
    currentScore: number;
    questions: QuestionItem[];
    onAnswer: (isCorrect: boolean) => void;
    onTimeUp: () => void;
    isDefending?: boolean;
    lang?: Lang;
}

const BATTLE_DURATION = 10;

export const BattleModal: React.FC<BattleModalProps> = ({
    visible,
    attackerId,
    defenderId,
    targetProvinceName,
    currentScore,
    questions,
    onAnswer,
    onTimeUp,
    isDefending = false,
    lang = 'tr',
}) => {
    const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
    const timerFiredRef = useRef(false);

    // Animations
    const timerBarAnim = useRef(new Animated.Value(1)).current;
    const scoreScaleAnim = useRef(new Animated.Value(1)).current;
    const flashAnim = useRef(new Animated.Value(0)).current;
    const flashColorRef = useRef<'correct' | 'wrong'>('correct');
    const sheetSlideAnim = useRef(new Animated.Value(400)).current;

    // Sheet slide in on appear
    useEffect(() => {
        if (visible) {
            sheetSlideAnim.setValue(400);
            Animated.spring(sheetSlideAnim, {
                toValue: 0,
                tension: 65,
                friction: 11,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // Timer management
    useEffect(() => {
        if (!visible) {
            timerFiredRef.current = false;
            setTimeLeft(BATTLE_DURATION);
            timerBarAnim.setValue(1);
            return;
        }
        timerFiredRef.current = false;
        setTimeLeft(BATTLE_DURATION);
        timerBarAnim.setValue(1);

        // Animate bar from full to empty over BATTLE_DURATION seconds
        Animated.timing(timerBarAnim, {
            toValue: 0,
            duration: BATTLE_DURATION * 1000,
            useNativeDriver: false,
        }).start();

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (!timerFiredRef.current) {
                        timerFiredRef.current = true;
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        setTimeout(onTimeUp, 0);
                    }
                    return 0;
                }
                // Haptic on last 3 seconds
                if (prev <= 4) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible]);

    // Score bounce animation when score changes
    const prevScoreRef = useRef(currentScore);
    useEffect(() => {
        if (currentScore !== prevScoreRef.current) {
            prevScoreRef.current = currentScore;
            Animated.sequence([
                Animated.spring(scoreScaleAnim, {
                    toValue: 1.45,
                    tension: 200,
                    friction: 6,
                    useNativeDriver: true,
                }),
                Animated.spring(scoreScaleAnim, {
                    toValue: 1,
                    tension: 120,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [currentScore]);

    const triggerAnswerFlash = (correct: boolean) => {
        flashColorRef.current = correct ? 'correct' : 'wrong';
        flashAnim.setValue(0.5);
        Animated.timing(flashAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
        }).start();

        if (correct) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleDeckFinished = () => {
        if (!timerFiredRef.current) {
            timerFiredRef.current = true;
            onTimeUp();
        }
    };

    const handleSwipeRight = (item: QuestionItem) => {
        const correct = item.answer === true;
        triggerAnswerFlash(correct);
        onAnswer(correct);
    };

    const handleSwipeLeft = (item: QuestionItem) => {
        const correct = item.answer === false;
        triggerAnswerFlash(correct);
        onAnswer(correct);
    };

    const attackerColor = PLAYER_COLORS[attackerId];
    const defenderColor = defenderId === 'neutral' ? NEUTRAL_COLOR : PLAYER_COLORS[defenderId as PlayerId];
    const defenderLabel = defenderId === 'neutral' ? getNeutralLabel(lang) : getPlayerLabel(defenderId as PlayerId, lang);

    const timerColor = timeLeft <= 3 ? '#FF3B30' : timeLeft <= 5 ? '#FF9500' : '#34C759';
    const timerBarColor: [string, string] =
        timeLeft <= 3
            ? ['#FF3B30', '#FF6B60']
            : timeLeft <= 5
            ? ['#FF9500', '#FFBD44']
            : ['#34C759', '#30D158'];

    const flashOverlayColor = flashColorRef.current === 'correct'
        ? 'rgba(52,199,89,0.22)'
        : 'rgba(255,59,48,0.22)';

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View
                    style={[styles.sheet, { transform: [{ translateY: sheetSlideAnim }] }]}
                >
                    {/* Flash feedback overlay */}
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFillObject,
                            styles.flashOverlay,
                            { opacity: flashAnim, backgroundColor: flashOverlayColor },
                        ]}
                    />

                    {/* Defense mode banner */}
                    {isDefending && (
                        <View style={styles.defendBanner}>
                            <Text style={styles.defendBannerText}>{t(lang, 'defenseBanner')}</Text>
                        </View>
                    )}

                    {/* Header: who vs who */}
                    <View style={styles.vsRow}>
                        <View style={[styles.playerPill, { backgroundColor: attackerColor + '20' }]}>
                            <View style={[styles.playerDot, { backgroundColor: attackerColor }]} />
                            <Text style={[styles.playerLabel, { color: attackerColor }]}>
                                {getPlayerLabel(attackerId, lang)}
                            </Text>
                        </View>

                        <View style={[styles.timerCircle, { borderColor: timerColor }]}>
                            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
                        </View>

                        <View style={[styles.playerPill, { backgroundColor: defenderColor + '20', justifyContent: 'flex-end' }]}>
                            <View style={[styles.playerDot, { backgroundColor: defenderColor }]} />
                            <Text style={[styles.playerLabel, { color: defenderColor }]}>
                                {defenderLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Timer bar */}
                    <View style={styles.timerBarTrack}>
                        <Animated.View
                            style={[
                                styles.timerBarFill,
                                { flex: timerBarAnim },
                            ]}
                        >
                            <LinearGradient
                                colors={timerBarColor}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                        </Animated.View>
                    </View>

                    {/* Province target */}
                    <Text style={styles.targetLabel}>
                        <Text style={{ color: '#AEAEB2' }}>{t(lang, 'target')} </Text>
                        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{targetProvinceName}</Text>
                    </Text>

                    {/* Animated score */}
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>{t(lang, 'score')} </Text>
                        <Animated.Text
                            style={[
                                styles.scoreValue,
                                { transform: [{ scale: scoreScaleAnim }] },
                            ]}
                        >
                            {currentScore}
                        </Animated.Text>
                    </View>

                    {/* Card stack */}
                    <View style={styles.cardArea}>
                        <SwipeableCardStack
                            key={`battle-${targetProvinceName}-${visible}`}
                            data={questions}
                            onSwipeRight={handleSwipeRight}
                            onSwipeLeft={handleSwipeLeft}
                            onFinished={handleDeckFinished}
                            renderItem={(item: QuestionItem) => (
                                <View style={styles.cardContent}>
                                    <View style={styles.cardBadge}>
                                        <Text style={styles.cardBadgeText}>{t(lang, 'trueFalse')}</Text>
                                    </View>
                                    <Text style={styles.questionText}>{item.question}</Text>
                                    {item.hint ? (
                                        <Text style={styles.hintText}>{item.hint}</Text>
                                    ) : null}
                                </View>
                            )}
                        />
                    </View>

                    {/* Swipe hint */}
                    <View style={styles.hintRow}>
                        <View style={styles.hintPill}>
                            <Text style={styles.hintLeft}>{t(lang, 'swipeLeft')}</Text>
                        </View>
                        <View style={[styles.hintPill, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
                            <Text style={styles.hintRight}>{t(lang, 'swipeRight')}</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#111111',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 16,
        maxHeight: '92%',
        flex: 1,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        overflow: 'hidden',
    },
    flashOverlay: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        zIndex: 10,
    },
    vsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    playerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minWidth: 90,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    playerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    playerLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    timerCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
    },
    timerText: {
        fontSize: 22,
        fontWeight: '900',
    },
    timerBarTrack: {
        height: 5,
        backgroundColor: '#2C2C2E',
        borderRadius: 3,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: 12,
    },
    timerBarFill: {
        borderRadius: 3,
        overflow: 'hidden',
    },
    targetLabel: {
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 4,
        gap: 2,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    scoreValue: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 22,
        lineHeight: 26,
    },
    cardArea: {
        flex: 1,
    },
    cardContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 16,
    },
    cardBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 100,
    },
    cardBadgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 30,
    },
    hintText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    hintRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingTop: 8,
        gap: 8,
    },
    hintPill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,59,48,0.12)',
    },
    hintLeft: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '700',
    },
    hintRight: {
        color: '#34C759',
        fontSize: 13,
        fontWeight: '700',
    },
    defendBanner: {
        backgroundColor: 'rgba(255,149,0,0.12)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 14,
        alignSelf: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,149,0,0.3)',
    },
    defendBannerText: {
        color: '#FF9500',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});
