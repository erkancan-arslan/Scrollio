import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { apiClient } from '../../../../services/api/apiClient';
import { secureStorage } from '../../../../services/storage/secureStorage';
import {
    bvfMultiplayerService,
    LobbyPresenceData,
    PlayerMap,
} from './services/multiplayerService';
import { BilVeFethetScreen } from './BilVeFethetScreen';
import { BilVeFethetMultiplayerScreen } from './BilVeFethetMultiplayerScreen';
import { PlayerId, PLAYER_COLORS } from './types';

type ScreenState = 'menu' | 'join_entry' | 'lobby' | 'single_player' | 'game';

interface Props {
    onSinglePlayer: () => void;
    onExit: () => void;
}

const SLOT_COLORS: Record<PlayerId, string> = {
    player: '#007AFF',
    bot1: '#FF3B30',
    bot2: '#34C759',
};

export const BilVeFethetMenuScreen: React.FC<Props> = ({ onSinglePlayer, onExit }) => {
    const [userId, setUserId] = useState<string>('anon');
    const [displayName, setDisplayName] = useState<string>('Oyuncu');

    useEffect(() => {
        secureStorage.getSession().then(({ userId: uid }) => {
            if (uid) setUserId(uid);
        });
    }, []);

    const [screen, setScreen] = useState<ScreenState>('menu');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lobby state
    const [roomCode, setRoomCode] = useState<string>('');
    const [mySlot, setMySlot] = useState<PlayerId>('player');
    const [isHost, setIsHost] = useState(false);
    const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPresenceData[]>([]);
    const [playerMap, setPlayerMap] = useState<PlayerMap>({ player: null, bot1: null, bot2: null });

    // Join entry state
    const [joinCode, setJoinCode] = useState('');

    const cleanedUp = useRef(false);

    useEffect(() => {
        cleanedUp.current = false;
        return () => {
            cleanedUp.current = true;
            bvfMultiplayerService.cleanup();
        };
    }, []);

    // Keep playerMap in sync with lobby players
    useEffect(() => {
        const map: PlayerMap = { player: null, bot1: null, bot2: null };
        for (const p of lobbyPlayers) {
            map[p.slot] = { userId: p.userId, displayName: p.displayName };
        }
        setPlayerMap(map);
    }, [lobbyPlayers]);

    const enterLobby = useCallback(
        async (code: string, slot: PlayerId, host: boolean) => {
            const myData: LobbyPresenceData = {
                userId,
                displayName,
                slot,
                isHost: host,
            };

            await bvfMultiplayerService.joinLobby(
                code,
                myData,
                (players) => {
                    if (!cleanedUp.current) setLobbyPlayers(players);
                },
                () => {
                    if (!cleanedUp.current) setScreen('game');
                },
            );

            if (!cleanedUp.current) {
                setRoomCode(code);
                setMySlot(slot);
                setIsHost(host);
                setScreen('lobby');
            }
        },
        [userId, displayName],
    );

    const createRoom = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.post<{ code: string; slot: PlayerId }>(
                '/bil-ve-fethet/rooms',
                { displayName },
            );
            if (res.error || !res.data) throw new Error(res.error ?? 'Oda oluşturulamadı');
            await enterLobby(res.data.code, res.data.slot, true);
        } catch (e: any) {
            setError(e?.message ?? 'Oda oluşturulamadı');
        } finally {
            setLoading(false);
        }
    }, [displayName, enterLobby]);

    const joinRoom = useCallback(async () => {
        const code = joinCode.trim().toUpperCase();
        if (code.length < 5) {
            setError('Geçerli bir oda kodu gir (5 karakter)');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.post<{ slot: PlayerId }>(
                `/bil-ve-fethet/rooms/${code}/join`,
                { displayName },
            );
            if (res.error || !res.data) throw new Error(res.error ?? 'Odaya girilemedi');
            await enterLobby(code, res.data.slot, false);
        } catch (e: any) {
            setError(e?.message ?? 'Odaya girilemedi');
        } finally {
            setLoading(false);
        }
    }, [joinCode, displayName, enterLobby]);

    const startGame = useCallback(async () => {
        await bvfMultiplayerService.broadcastStartGame(roomCode);
        setScreen('game');
    }, [roomCode]);

    const leaveRoom = useCallback(async () => {
        await bvfMultiplayerService.cleanup();
        setLobbyPlayers([]);
        setRoomCode('');
        setScreen('menu');
    }, []);

    const filledSlots = lobbyPlayers.length;
    const canStart = isHost && filledSlots >= 2;

    // ── Single player pass-through ───────────────────────────────────────────
    if (screen === 'single_player') {
        return <BilVeFethetScreen onExit={() => setScreen('menu')} />;
    }

    // ── Multiplayer game ─────────────────────────────────────────────────────
    if (screen === 'game') {
        return (
            <BilVeFethetMultiplayerScreen
                roomCode={roomCode}
                mySlot={mySlot}
                isHost={isHost}
                playerMap={playerMap}
                onExit={() => {
                    bvfMultiplayerService.cleanup();
                    setScreen('menu');
                }}
            />
        );
    }

    // ── Lobby ────────────────────────────────────────────────────────────────
    if (screen === 'lobby') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* HUD */}
                <View style={styles.hud}>
                    <TouchableOpacity onPress={leaveRoom} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={26} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.hudTitle}>Oyun Lobisi</Text>
                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.lobbyContent}>
                    {/* Room code */}
                    <View style={styles.codeCard}>
                        {isHost && (
                            <Text style={styles.codeLabel}>Arkadaşlarına bu kodu ver:</Text>
                        )}
                        {!isHost && (
                            <Text style={styles.codeLabel}>Oda Kodu</Text>
                        )}
                        <Text style={styles.codeText} selectable>
                            {roomCode}
                        </Text>
                    </View>

                    {/* Player count */}
                    <Text style={styles.playerCountText}>{filledSlots}/3 Oyuncu</Text>

                    {/* Player slots */}
                    <View style={styles.slotList}>
                        {(['player', 'bot1', 'bot2'] as PlayerId[]).map((slot) => {
                            const p = lobbyPlayers.find(lp => lp.slot === slot);
                            return (
                                <View key={slot} style={styles.slotRow}>
                                    <View style={[styles.slotDot, { backgroundColor: SLOT_COLORS[slot] }]} />
                                    <View style={styles.slotInfo}>
                                        <Text style={styles.slotName}>
                                            {p ? p.displayName : '—'}
                                        </Text>
                                        <Text style={styles.slotRole}>
                                            {slot === 'player' ? 'Ev Sahibi' : `Slot ${slot.slice(3)}`}
                                            {p?.isHost ? ' 👑' : ''}
                                            {!p ? ' (Boş)' : ''}
                                        </Text>
                                    </View>
                                    {p && (
                                        <View style={[styles.slotBadge, { borderColor: SLOT_COLORS[slot] }]}>
                                            <Text style={[styles.slotBadgeText, { color: SLOT_COLORS[slot] }]}>
                                                {slot === 'player' ? 'Mavi' : slot === 'bot1' ? 'Kırmızı' : 'Yeşil'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Host controls */}
                    {isHost ? (
                        <TouchableOpacity
                            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                            onPress={startGame}
                            disabled={!canStart}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.startBtnText}>
                                {canStart ? '🎮 Oyunu Başlat' : `Bekliyor... (${filledSlots}/2 min)`}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.waitingBanner}>
                            <ActivityIndicator color="#8E8E93" size="small" />
                            <Text style={styles.waitingText}>Oda başlatılmayı bekliyor...</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.leaveBtn} onPress={leaveRoom} activeOpacity={0.8}>
                        <Text style={styles.leaveBtnText}>← Lobiden Ayrıl</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Join entry ───────────────────────────────────────────────────────────
    if (screen === 'join_entry') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                <View style={styles.hud}>
                    <TouchableOpacity
                        onPress={() => { setScreen('menu'); setError(null); setJoinCode(''); }}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={26} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.hudTitle}>Odaya Gir</Text>
                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.joinContent}>
                    <Text style={styles.joinLabel}>Oda Kodu</Text>
                    <TextInput
                        style={styles.joinInput}
                        value={joinCode}
                        onChangeText={(t) => {
                            setJoinCode(t.toUpperCase());
                            setError(null);
                        }}
                        placeholder="XXXXX"
                        placeholderTextColor="#3A3A3C"
                        maxLength={5}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        keyboardAppearance="dark"
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={joinRoom}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryBtnText}>Katıl</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => { setScreen('menu'); setError(null); setJoinCode(''); }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.secondaryBtnText}>← Geri</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Menu ─────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.hud}>
                <TouchableOpacity onPress={onExit} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={26} color="white" />
                </TouchableOpacity>
                <Text style={styles.hudTitle}>Bil ve Fethet</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>🗺️</Text>
                <Text style={styles.menuHeading}>Bil ve Fethet</Text>
                <Text style={styles.menuSub}>Türkiye'nin tüm bölgelerini fethet!</Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.menuButtons}>
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => setScreen('single_player')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.menuBtnIcon}>🤖</Text>
                        <View style={styles.menuBtnTextGroup}>
                            <Text style={styles.menuBtnTitle}>Bota Karşı</Text>
                            <Text style={styles.menuBtnSub}>Tek oyunculu — botlara karşı oyna</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#3A3A3C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={createRoom}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#007AFF" style={{ marginRight: 12 }} />
                        ) : (
                            <Text style={styles.menuBtnIcon}>➕</Text>
                        )}
                        <View style={styles.menuBtnTextGroup}>
                            <Text style={styles.menuBtnTitle}>Oda Oluştur</Text>
                            <Text style={styles.menuBtnSub}>Arkadaşlarını davet et</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#3A3A3C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => { setError(null); setScreen('join_entry'); }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.menuBtnIcon}>🚪</Text>
                        <View style={styles.menuBtnTextGroup}>
                            <Text style={styles.menuBtnTitle}>Odaya Gir</Text>
                            <Text style={styles.menuBtnSub}>Oda kodu ile katıl</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#3A3A3C" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    hud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 4,
        height: 52,
    },
    backBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
    },
    hudTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Menu
    menuContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    menuTitle: {
        fontSize: 56,
        textAlign: 'center',
        marginBottom: 8,
    },
    menuHeading: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    menuSub: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 40,
    },
    menuButtons: {
        gap: 14,
    },
    menuBtn: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    menuBtnIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    menuBtnTextGroup: {
        flex: 1,
    },
    menuBtnTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    menuBtnSub: {
        color: '#8E8E93',
        fontSize: 12,
    },

    // Join entry
    joinContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'stretch',
    },
    joinLabel: {
        color: '#AEAEB2',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    joinInput: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 8,
        paddingHorizontal: 20,
        paddingVertical: 18,
        textAlign: 'center',
        marginBottom: 16,
    },
    primaryBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryBtnDisabled: {
        opacity: 0.5,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    secondaryBtnText: {
        color: '#AEAEB2',
        fontSize: 15,
        fontWeight: '600',
    },

    // Lobby
    lobbyContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    codeCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 20,
    },
    codeLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    codeText: {
        color: '#FFFFFF',
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 12,
        textAlign: 'center',
    },
    playerCountText: {
        color: '#AEAEB2',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    slotList: {
        gap: 10,
        marginBottom: 28,
    },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        gap: 12,
    },
    slotDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    slotInfo: {
        flex: 1,
    },
    slotName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    slotRole: {
        color: '#8E8E93',
        fontSize: 12,
        marginTop: 1,
    },
    slotBadge: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    slotBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    startBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    startBtnDisabled: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    startBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    waitingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    waitingText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    leaveBtn: {
        backgroundColor: '#1C1C1E',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    leaveBtnText: {
        color: '#FF3B30',
        fontSize: 15,
        fontWeight: '600',
    },

    // Shared
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
});
