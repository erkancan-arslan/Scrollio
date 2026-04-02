import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAppSelector } from '../../../../store/hooks';
import { SpaceRepairScreen } from './SpaceRepairScreen';
import { spaceRepairService, LobbyPresenceData } from './services/multiplayerService';
import { RepairSlot, AnswerBlock, PlayerId } from './types';
import { pickRoundQuestions } from './data/questions';

interface Props {
    onExit: () => void;
}

type LobbyPhase = 'choose' | 'joining' | 'waiting' | 'game';

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function buildGameData(roomCode: string, singlePlayer: boolean) {
    const questions = pickRoundQuestions(roomCode);
    const slots: RepairSlot[] = questions.map((q, i) => ({
        id: `slot_${i}`,
        question: q.question,
        correctAnswerId: `answer_${i}`,
        filledByPlayerId: null,
    }));
    const answers: AnswerBlock[] = questions.map((q, i) => ({
        id: `answer_${i}`,
        label: q.answer,
        // Single-player: all 6 go to playerA. Multiplayer: split 3 and 3.
        assignedTo: (singlePlayer ? 'playerA' : i < 3 ? 'playerA' : 'playerB') as PlayerId,
        isUsed: false,
    }));
    return { slots, answers };
}

export const SpaceRepairLobbyScreen: React.FC<Props> = ({ onExit }) => {
    const session = useAppSelector((state: any) => state.kidsAuth?.session ?? null);

    const [phase, setPhase] = useState<LobbyPhase>('choose');
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [players, setPlayers] = useState<LobbyPresenceData[]>([]);
    const [myData, setMyData] = useState<LobbyPresenceData | null>(null);
    const [gameSlots, setGameSlots] = useState<RepairSlot[]>([]);
    const [gameAnswers, setGameAnswers] = useState<AnswerBlock[]>([]);
    const [isSinglePlayer, setIsSinglePlayer] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Build identity from Redux session (works in both adult and kids app)
    const resolveMyData = useCallback(
        (slot: PlayerId, isHost: boolean): LobbyPresenceData | null => {
            if (!session?.user) return null;
            return {
                userId: session.user.id,
                displayName: session.user.displayName ?? session.user.email ?? 'Oyuncu',
                slot,
                isHost,
            };
        },
        [session],
    );

    // ──────────────────────────────────────────────
    // Single-player — skip lobby entirely
    // ──────────────────────────────────────────────
    const handleSinglePlayer = useCallback(() => {
        const code = generateRoomCode();
        const { slots, answers } = buildGameData(code, true);
        setRoomCode(code);
        setGameSlots(slots);
        setGameAnswers(answers);
        setIsSinglePlayer(true);
        setPhase('game');
    }, []);

    // ──────────────────────────────────────────────
    // Host flow
    // ──────────────────────────────────────────────
    const handleHost = useCallback(async () => {
        const me = resolveMyData('playerA', true);
        if (!me) {
            Alert.alert('Hata', 'Oturum açık değil.');
            return;
        }
        setIsLoading(true);
        const code = generateRoomCode();
        setMyData(me);
        setRoomCode(code);

        await spaceRepairService.joinLobby(
            code,
            me,
            (updatedPlayers) => setPlayers(updatedPlayers),
            () => {}, // host controls start; guest's start_game broadcast is ignored
        );
        setIsLoading(false);
        setPhase('waiting');
    }, [resolveMyData]);

    // ──────────────────────────────────────────────
    // Guest flow
    // ──────────────────────────────────────────────
    const handleJoin = useCallback(async () => {
        const code = inputCode.trim().toUpperCase();
        if (code.length < 4) {
            Alert.alert('Geçersiz kod', 'Lütfen 4-5 haneli oda kodunu girin.');
            return;
        }
        const me = resolveMyData('playerB', false);
        if (!me) {
            Alert.alert('Hata', 'Oturum açık değil.');
            return;
        }
        setIsLoading(true);
        setMyData(me);
        setRoomCode(code);

        await spaceRepairService.joinLobby(
            code,
            me,
            (updatedPlayers) => setPlayers(updatedPlayers),
            () => {},
        );
        // Listen for host's game_init so we receive the seeded board
        await spaceRepairService.joinGame(
            code,
            (payload) => {
                setGameSlots(payload.slots);
                setGameAnswers(payload.answers);
                setPhase('game');
            },
            () => {},
            () => {},
            () => {},
        );
        setIsLoading(false);
        setPhase('waiting');
    }, [inputCode, resolveMyData]);

    // ──────────────────────────────────────────────
    // Host starts the game
    // ──────────────────────────────────────────────
    const handleStartGame = useCallback(async () => {
        if (!myData || !roomCode) return;

        const { slots, answers } = buildGameData(roomCode, false);

        await spaceRepairService.joinGame(roomCode, () => {}, () => {}, () => {}, () => {});
        await spaceRepairService.broadcastStartGame(roomCode);
        await spaceRepairService.broadcastGameInit(roomCode, { slots, answers, timeRemaining: 60 });

        setGameSlots(slots);
        setGameAnswers(answers);
        setPhase('game');
    }, [myData, roomCode]);

    useEffect(() => {
        return () => {
            spaceRepairService.cleanup();
        };
    }, []);

    // ──────────────────────────────────────────────
    // Render: game
    // ──────────────────────────────────────────────
    if (phase === 'game') {
        return (
            <SpaceRepairScreen
                roomCode={roomCode}
                myPlayerId={isSinglePlayer ? 'playerA' : (myData?.slot ?? 'playerA')}
                isHost={isSinglePlayer || (myData?.isHost ?? false)}
                isSinglePlayer={isSinglePlayer}
                initialSlots={gameSlots}
                initialAnswers={gameAnswers}
                initialTimeRemaining={60}
                onExit={() => {
                    spaceRepairService.cleanup();
                    onExit();
                }}
            />
        );
    }

    // ──────────────────────────────────────────────
    // Render: waiting room
    // ──────────────────────────────────────────────
    if (phase === 'waiting') {
        const partnerConnected = players.length >= 2;
        const isHost = myData?.isHost ?? false;

        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={onExit}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>

                <View style={styles.centerContent}>
                    <Text style={styles.rocketBig}>🚀</Text>
                    <Text style={styles.title}>Oda Kodu</Text>
                    <Text style={styles.roomCode}>{roomCode}</Text>
                    <Text style={styles.hint}>
                        {isHost ? 'Bu kodu arkadaşına gönder!' : 'Bağlantı bekleniyor…'}
                    </Text>

                    <View style={styles.playerList}>
                        {(['playerA', 'playerB'] as PlayerId[]).map((slot) => {
                            const found = players.find((p) => p.slot === slot);
                            return (
                                <View key={slot} style={styles.playerRow}>
                                    <Text style={styles.playerIcon}>{found ? '👤' : '❓'}</Text>
                                    <Text style={[styles.playerName, !found && styles.playerEmpty]}>
                                        {found
                                            ? found.displayName
                                            : slot === 'playerA'
                                            ? 'Oyuncu A (sen?)'
                                            : 'Ortağın bekleniyor…'}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {isHost && (
                        <TouchableOpacity
                            style={[
                                styles.startButton,
                                !partnerConnected && styles.startButtonDisabled,
                            ]}
                            onPress={handleStartGame}
                            disabled={!partnerConnected}
                        >
                            <Text style={styles.startButtonText}>
                                {partnerConnected ? '🚀 Oyunu Başlat!' : 'Ortak bekleniyor…'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    // ──────────────────────────────────────────────
    // Render: mode selection
    // ──────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={onExit}>
                <Text style={styles.backText}>← Geri</Text>
            </TouchableOpacity>

            <View style={styles.centerContent}>
                <Text style={styles.rocketBig}>🚀</Text>
                <Text style={styles.title}>Uzay Gemisi Tamiri</Text>
                <Text style={styles.subtitle}>
                    Bozuk uzay gemisini tamir et!{'\n'}Yalnız ya da bir arkadaşınla oyna.
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#4DFFB4" style={{ marginTop: 32 }} />
                ) : phase === 'joining' ? (
                    <View style={styles.joinContainer}>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="Oda kodunu gir…"
                            placeholderTextColor="#666"
                            value={inputCode}
                            onChangeText={setInputCode}
                            autoCapitalize="characters"
                            maxLength={6}
                        />
                        <TouchableOpacity style={styles.startButton} onPress={handleJoin}>
                            <Text style={styles.startButtonText}>Katıl</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setPhase('choose')}
                        >
                            <Text style={styles.secondaryButtonText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.choiceGrid}>
                        {/* Single player */}
                        <TouchableOpacity
                            style={[styles.choiceButton, styles.choiceButtonSolo]}
                            onPress={handleSinglePlayer}
                        >
                            <Text style={styles.choiceIcon}>🧑‍🚀</Text>
                            <Text style={styles.choiceLabel}>Tek Kişilik</Text>
                            <Text style={styles.choiceDesc}>Tüm parçalar sende!</Text>
                        </TouchableOpacity>

                        {/* Multiplayer row */}
                        <View style={styles.multiRow}>
                            <TouchableOpacity style={styles.choiceButton} onPress={handleHost}>
                                <Text style={styles.choiceIcon}>🏠</Text>
                                <Text style={styles.choiceLabel}>Oda Kur</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.choiceButton}
                                onPress={() => setPhase('joining')}
                            >
                                <Text style={styles.choiceIcon}>🔗</Text>
                                <Text style={styles.choiceLabel}>Odaya Katıl</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D1A',
    },
    backButton: {
        padding: 16,
    },
    backText: {
        color: '#8E8E93',
        fontSize: 16,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    rocketBig: {
        fontSize: 64,
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    choiceGrid: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    multiRow: {
        flexDirection: 'row',
        gap: 12,
    },
    choiceButton: {
        backgroundColor: '#1C1C2E',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        width: 140,
        borderWidth: 1,
        borderColor: '#2C2C3E',
    },
    choiceButtonSolo: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 16,
        paddingHorizontal: 24,
        borderColor: '#4DFFB4',
        borderWidth: 1.5,
    },
    choiceIcon: {
        fontSize: 32,
    },
    choiceLabel: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginTop: 6,
    },
    choiceDesc: {
        color: '#8E8E93',
        fontSize: 11,
        marginTop: 2,
    },
    joinContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    codeInput: {
        backgroundColor: '#1C1C2E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2C2C3E',
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        width: '80%',
        letterSpacing: 4,
    },
    startButton: {
        backgroundColor: '#4DFFB4',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        marginTop: 8,
    },
    startButtonDisabled: {
        backgroundColor: '#2C4A3E',
    },
    startButtonText: {
        color: '#0D0D1A',
        fontWeight: '900',
        fontSize: 16,
    },
    secondaryButton: {
        paddingVertical: 10,
    },
    secondaryButtonText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    roomCode: {
        fontSize: 42,
        fontWeight: '900',
        color: '#4DFFB4',
        letterSpacing: 8,
        marginVertical: 8,
    },
    hint: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 24,
    },
    playerList: {
        width: '100%',
        gap: 12,
        marginBottom: 32,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C2E',
        borderRadius: 12,
        padding: 14,
        gap: 12,
    },
    playerIcon: {
        fontSize: 24,
    },
    playerName: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    playerEmpty: {
        color: '#555570',
        fontStyle: 'italic',
    },
});
