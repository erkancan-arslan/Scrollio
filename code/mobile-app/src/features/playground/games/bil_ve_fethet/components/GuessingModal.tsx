import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerId, PLAYER_COLORS, NEUTRAL_COLOR, GuessingQuestion, GuessingResult } from '../types';
import { Lang, t, getPlayerLabel, getNeutralLabel } from '../i18n';

interface GuessingModalProps {
    visible: boolean;
    attackerId: PlayerId;
    defenderId: PlayerId | 'neutral';
    targetProvinceName: string;
    question: GuessingQuestion | null;
    /** Pre-simulated bot guess — hidden until reveal */
    botGuess: number | null;
    /** Null during 'guessing' phase, set once reducer resolves in 'guessing_result' */
    guessingResult: GuessingResult | null;
    onSubmit: (playerGuess: number) => void;
    onContinue: () => void;
    isDefending: boolean;
    lang?: Lang;
}

type DisplayPhase = 'input' | 'revealing' | 'result';

const GUESS_DURATION = 10;

export const GuessingModal: React.FC<GuessingModalProps> = ({
    visible,
    attackerId,
    defenderId,
    targetProvinceName,
    question,
    botGuess,
    guessingResult,
    onSubmit,
    onContinue,
    isDefending,
    lang = 'tr',
}) => {
    const q = question ? (lang === 'en' ? question.questionEn : question.question) : '';
    const qHint = question ? (lang === 'en' ? question.hintEn : question.hint) : '';
    const qUnit = question ? (lang === 'en' ? question.unitEn : question.unit) : '';
    const [timeLeft, setTimeLeft] = useState(GUESS_DURATION);
    const [inputValue, setInputValue] = useState('');
    const [displayPhase, setDisplayPhase] = useState<DisplayPhase>('input');
    const timerFiredRef = useRef(false);
    const inputRef = useRef<TextInput>(null);

    // Animations
    const sheetSlideAnim = useRef(new Animated.Value(500)).current;
    const timerBarAnim = useRef(new Animated.Value(1)).current;
    const revealFade = useRef(new Animated.Value(0)).current;
    const resultFade = useRef(new Animated.Value(0)).current;
    const winnerScale = useRef(new Animated.Value(0.7)).current;

    // Distance bar animations
    const playerBarWidth = useRef(new Animated.Value(0)).current;
    const botBarWidth = useRef(new Animated.Value(0)).current;
    const [maxBarPx, setMaxBarPx] = useState(200);

    // Reset everything when modal opens
    useEffect(() => {
        if (!visible) {
            setInputValue('');
            setDisplayPhase('input');
            setTimeLeft(GUESS_DURATION);
            timerFiredRef.current = false;
            timerBarAnim.setValue(1);
            revealFade.setValue(0);
            resultFade.setValue(0);
            winnerScale.setValue(0.7);
            playerBarWidth.setValue(0);
            botBarWidth.setValue(0);
            return;
        }

        sheetSlideAnim.setValue(500);
        setInputValue('');
        setDisplayPhase('input');
        setTimeLeft(GUESS_DURATION);
        timerFiredRef.current = false;
        timerBarAnim.setValue(1);

        Animated.spring(sheetSlideAnim, {
            toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
        }).start();

        Animated.timing(timerBarAnim, {
            toValue: 0, duration: GUESS_DURATION * 1000, useNativeDriver: false,
        }).start();

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (!timerFiredRef.current) {
                        timerFiredRef.current = true;
                        handleSubmit(true);
                    }
                    return 0;
                }
                if (prev <= 4) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible]);

    // Transition to result phases when reducer resolves
    useEffect(() => {
        if (!guessingResult || displayPhase !== 'input') return;
        Keyboard.dismiss();
        setDisplayPhase('revealing');

        revealFade.setValue(0);
        Animated.sequence([
            Animated.timing(revealFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.delay(1400),
        ]).start(() => {
            setDisplayPhase('result');
            resultFade.setValue(0);
            Animated.timing(resultFade, { toValue: 1, duration: 350, useNativeDriver: true }).start(() => {
                // Animate bars in after fade
                const pDist = guessingResult.playerDistance;
                const bDist = guessingResult.botDistance;
                const maxDist = Math.max(pDist, bDist, 1);
                const pFrac = pDist / maxDist;
                const bFrac = bDist / maxDist;

                playerBarWidth.setValue(0);
                botBarWidth.setValue(0);
                Animated.parallel([
                    Animated.spring(playerBarWidth, { toValue: pFrac, tension: 60, friction: 8, useNativeDriver: false }),
                    Animated.spring(botBarWidth, { toValue: bFrac, tension: 60, friction: 8, useNativeDriver: false }),
                ]).start(() => {
                    Animated.spring(winnerScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }).start();
                    Haptics.notificationAsync(
                        guessingResult.tie
                            ? Haptics.NotificationFeedbackType.Warning
                            : guessingResult.conquered === (attackerId === 'player')
                                ? Haptics.NotificationFeedbackType.Success
                                : Haptics.NotificationFeedbackType.Error,
                    );
                });
            });
        });
    }, [guessingResult]);

    const handleSubmit = (fromTimer = false) => {
        if (displayPhase !== 'input') return;
        if (!fromTimer) {
            timerFiredRef.current = true;
            timerBarAnim.stopAnimation();
        }
        const guess = parseInt(inputValue, 10) || 0;
        onSubmit(guess);
        // displayPhase transitions via the guessingResult useEffect above
    };

    const attackerColor = PLAYER_COLORS[attackerId];
    const defenderColor = defenderId === 'neutral' ? NEUTRAL_COLOR : PLAYER_COLORS[defenderId as PlayerId];
    const defenderLabel = defenderId === 'neutral' ? getNeutralLabel(lang) : getPlayerLabel(defenderId as PlayerId, lang);
    const timerColor = timeLeft <= 3 ? '#FF3B30' : timeLeft <= 5 ? '#FF9500' : '#34C759';
    const timerBarColor: [string, string] = timeLeft <= 3
        ? ['#FF3B30', '#FF6B60']
        : timeLeft <= 5
            ? ['#FF9500', '#FFBD44']
            : ['#34C759', '#30D158'];

    // Result derived values
    const r = guessingResult;
    const isPlayerAttacking = attackerId === 'player';
    const playerWon = r ? (r.tie ? !isPlayerAttacking : (isPlayerAttacking ? r.conquered : !r.conquered)) : false;
    const winnerLabel = r?.tie
        ? t(lang, 'tieBanner')
        : playerWon
            ? t(lang, 'youWon')
            : t(lang, 'youLost');
    const winnerColor = r?.tie ? '#FF9500' : playerWon ? '#34C759' : '#FF3B30';

    // Opponent color in result
    const opponentId = isPlayerAttacking ? defenderId : attackerId;
    const opponentColor = opponentId === 'neutral' ? NEUTRAL_COLOR : PLAYER_COLORS[opponentId as PlayerId];
    const opponentLabel = opponentId === 'neutral' ? getNeutralLabel(lang) : getPlayerLabel(opponentId as PlayerId, lang);

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetSlideAnim }] }]}>

                    {/* Defense banner */}
                    {isDefending && (
                        <View style={styles.defendBanner}>
                            <Text style={styles.defendBannerText}>{t(lang, 'defenseBanner')}</Text>
                        </View>
                    )}

                    {/* Round type badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t(lang, 'guessBadge')}</Text>
                    </View>

                    {/* ── INPUT PHASE ── */}
                    {displayPhase === 'input' && (
                        <>
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
                                <View style={[styles.playerPill, { backgroundColor: defenderColor + '20' }]}>
                                    <View style={[styles.playerDot, { backgroundColor: defenderColor }]} />
                                    <Text style={[styles.playerLabel, { color: defenderColor }]}>
                                        {defenderLabel}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.timerBarTrack}>
                                <Animated.View style={[styles.timerBarFill, { flex: timerBarAnim }]}>
                                    <LinearGradient
                                        colors={timerBarColor}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                </Animated.View>
                            </View>

                            <Text style={styles.targetLabel}>
                                <Text style={{ color: '#AEAEB2' }}>{t(lang, 'target')} </Text>
                                <Text style={{ color: '#FFF', fontWeight: '700' }}>{targetProvinceName}</Text>
                            </Text>

                            <Text style={styles.questionText}>{q}</Text>

                            {qHint ? (
                                <Text style={styles.hintText}>💡 {qHint}</Text>
                            ) : null}

                            <View style={styles.inputRow}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    value={inputValue}
                                    onChangeText={setInputValue}
                                    keyboardType="numeric"
                                    placeholder={t(lang, 'guessPlaceholder')}
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                    maxLength={8}
                                    autoFocus
                                    returnKeyType="done"
                                    onSubmitEditing={() => inputValue ? handleSubmit() : null}
                                    selectionColor="#007AFF"
                                />
                                {qUnit ? (
                                    <Text style={styles.unitLabel}>{qUnit}</Text>
                                ) : null}
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, !inputValue && styles.submitBtnDisabled]}
                                onPress={() => handleSubmit()}
                                disabled={!inputValue}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.submitBtnText}>{t(lang, 'submitGuess')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── REVEALING PHASE ── */}
                    {displayPhase === 'revealing' && (
                        <Animated.View style={[styles.revealContainer, { opacity: revealFade }]}>
                            <Text style={styles.revealTitle}>{t(lang, 'revealTitle')}</Text>
                            <Text style={styles.revealQuestion} numberOfLines={3}>{q}</Text>

                            <View style={styles.revealCards}>
                                <View style={[styles.revealCard, { borderColor: '#007AFF' }]}>
                                    <Text style={styles.revealCardLabel}>{t(lang, 'you')}</Text>
                                    <Text style={[styles.revealCardValue, { color: '#007AFF' }]}>
                                        {r?.playerGuess ?? 0}
                                    </Text>
                                    <Text style={styles.revealCardUnit}>{qUnit}</Text>
                                </View>

                                <Text style={styles.revealVs}>vs</Text>

                                <View style={[styles.revealCard, { borderColor: opponentColor }]}>
                                    <Text style={styles.revealCardLabel}>{opponentLabel}</Text>
                                    <Text style={[styles.revealCardValue, { color: opponentColor }]}>???</Text>
                                    <Text style={styles.revealCardUnit}> </Text>
                                </View>
                            </View>

                            <Text style={styles.revealSuspense}>{t(lang, 'calculating')}</Text>
                        </Animated.View>
                    )}

                    {/* ── RESULT PHASE ── */}
                    {displayPhase === 'result' && r && (
                        <Animated.View style={[styles.resultContainer, { opacity: resultFade }]}>
                            <Text style={styles.resultQuestion} numberOfLines={3}>{q}</Text>

                            {/* Correct answer */}
                            <View style={styles.correctRow}>
                                <Text style={styles.correctLabel}>{t(lang, 'correctAnswer')}</Text>
                                <Text style={styles.correctValue}>
                                    {r.correctAnswer} {qUnit}
                                </Text>
                            </View>

                            {/* Distance bar comparison */}
                            <View
                                style={styles.barsContainer}
                                onLayout={e => setMaxBarPx(e.nativeEvent.layout.width - 120)}
                            >
                                {/* Player row */}
                                <View style={styles.barRow}>
                                    <Text style={[styles.barLabel, { color: '#007AFF' }]}>{t(lang, 'you')}</Text>
                                    <View style={styles.barTrack}>
                                        <Animated.View
                                            style={[
                                                styles.barFill,
                                                {
                                                    backgroundColor: '#007AFF',
                                                    width: playerBarWidth.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [2, maxBarPx],
                                                    }),
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.barDiff, { color: '#007AFF' }]}>
                                        {r.playerGuess}
                                        <Text style={styles.barDiffSub}> ({r.playerDistance} {t(lang, 'diff')})</Text>
                                    </Text>
                                </View>

                                {/* Opponent row */}
                                <View style={styles.barRow}>
                                    <Text style={[styles.barLabel, { color: opponentColor }]}>{opponentLabel}</Text>
                                    <View style={styles.barTrack}>
                                        <Animated.View
                                            style={[
                                                styles.barFill,
                                                {
                                                    backgroundColor: opponentColor,
                                                    width: botBarWidth.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [2, maxBarPx],
                                                    }),
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.barDiff, { color: opponentColor }]}>
                                        {r.botGuess}
                                        <Text style={styles.barDiffSub}> ({r.botDistance} {t(lang, 'diff')})</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Winner banner */}
                            <Animated.View
                                style={[
                                    styles.winnerBanner,
                                    { borderColor: winnerColor, backgroundColor: winnerColor + '18' },
                                    { transform: [{ scale: winnerScale }] },
                                ]}
                            >
                                <Text style={[styles.winnerText, { color: winnerColor }]}>{winnerLabel}</Text>
                                {r.tie && (
                                    <Text style={styles.winnerSub}>{t(lang, 'tieNote')}</Text>
                                )}
                            </Animated.View>

                            <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.8}>
                                <Text style={styles.continueBtnText}>{t(lang, 'continueBtn')}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#111111',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 20,
        paddingBottom: 32,
        paddingHorizontal: 20,
        maxHeight: '92%',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        overflow: 'hidden',
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
    badge: {
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderRadius: 100,
        paddingHorizontal: 16,
        paddingVertical: 7,
        alignSelf: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    badgeText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.3,
    },
    // ── Input phase ──
    vsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
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
    playerDot: { width: 10, height: 10, borderRadius: 5 },
    playerLabel: { fontSize: 13, fontWeight: '700' },
    timerCircle: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#1C1C1E',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2.5,
    },
    timerText: { fontSize: 22, fontWeight: '900' },
    timerBarTrack: {
        height: 5, backgroundColor: '#2C2C2E', borderRadius: 3,
        overflow: 'hidden', flexDirection: 'row', marginBottom: 16,
    },
    timerBarFill: { borderRadius: 3, overflow: 'hidden' },
    targetLabel: { textAlign: 'center', fontSize: 13, marginBottom: 8 },
    questionText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 8,
    },
    hintText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#3A3A3C',
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
        paddingHorizontal: 16,
        paddingVertical: 12,
        textAlign: 'center',
    },
    unitLabel: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
        minWidth: 50,
    },
    submitBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#1C1C1E',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // ── Revealing phase ──
    revealContainer: {
        alignItems: 'center',
        paddingVertical: 8,
        gap: 16,
    },
    revealTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    revealQuestion: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 22,
    },
    revealCards: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    revealCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        borderWidth: 2,
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
        minWidth: 110,
        gap: 4,
    },
    revealCardLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
    revealCardValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
    revealCardUnit: { color: '#8E8E93', fontSize: 11 },
    revealVs: { color: '#3A3A3C', fontSize: 18, fontWeight: '900' },
    revealSuspense: {
        color: '#8E8E93',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 8,
    },
    // ── Result phase ──
    resultContainer: {
        gap: 14,
    },
    resultQuestion: {
        color: '#AEAEB2',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    correctRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
        gap: 6,
    },
    correctLabel: { color: '#8E8E93', fontSize: 13 },
    correctValue: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
    barsContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        gap: 14,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    barLabel: {
        fontSize: 12,
        fontWeight: '700',
        width: 48,
    },
    barTrack: {
        flex: 1,
        height: 10,
        backgroundColor: '#2C2C2E',
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    barDiff: {
        fontSize: 13,
        fontWeight: '800',
        minWidth: 70,
        textAlign: 'right',
    },
    barDiffSub: {
        fontSize: 11,
        fontWeight: '500',
        color: '#8E8E93',
    },
    winnerBanner: {
        borderRadius: 14,
        borderWidth: 1.5,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 4,
    },
    winnerText: {
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
    },
    winnerSub: {
        color: '#8E8E93',
        fontSize: 12,
    },
    continueBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
