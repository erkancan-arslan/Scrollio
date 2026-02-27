/**
 * Bil ve Fethet: Classroom — Lobby Screen
 *
 * Room waiting screen showing connected players, room code,
 * copy/share UI, and start button for the host.
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import { Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { classroomService } from './services/classroomService';
import { ClassroomRoom } from './types';
import { colors, spacing } from '../../../../theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type LobbyRouteProp = RouteProp<RootStackParamList, 'ClassroomLobby'>;

export const ClassroomLobbyScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<LobbyRouteProp>();
    const { roomCode, isHost } = route.params;

    const [room, setRoom] = useState<ClassroomRoom | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Fetch initial room state
        classroomService.getRoomState(roomCode)
            .then(({ room: r }) => {
                setRoom(r);
                setIsLoading(false);
            })
            .catch(err => {
                Alert.alert('Hata', err.message);
                navigation.goBack();
            });

        // Subscribe to room updates
        classroomService.subscribeToRoom(roomCode, (updatedRoom) => {
            setRoom(updatedRoom);
        });

        // Subscribe to match found notifications
        classroomService.subscribeToPlayerNotifications('self', (data) => {
            navigation.navigate('ClassroomGame', { matchId: data.matchId });
        });

        return () => {
            classroomService.unsubscribeFromRoom();
            classroomService.unsubscribeFromPlayerNotifications();
        };
    }, [roomCode]);

    const handleCopyCode = async (): Promise<void> => {
        Clipboard.setString(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async (): Promise<void> => {
        try {
            await Share.share({
                message: `Bil ve Fethet: Sınıf oyununa katıl! Oda kodu: ${roomCode}`,
            });
        } catch (error) {
            // User cancelled sharing
        }
    };

    const handleStart = async (): Promise<void> => {
        try {
            setIsStarting(true);
            const { matchId } = await classroomService.startRoom(roomCode);
            navigation.navigate('ClassroomGame', { matchId });
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Oyun başlatılamadı');
            setIsStarting(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Oda Lobisi</Text>
            </View>

            {/* Room Code */}
            <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>ODA KODU</Text>
                <Text style={styles.codeText}>{roomCode}</Text>
                <View style={styles.codeActions}>
                    <TouchableOpacity
                        style={styles.codeBtn}
                        onPress={handleCopyCode}
                    >
                        <Ionicons
                            name={copied ? 'checkmark' : 'copy'}
                            size={18}
                            color="#FFFFFF"
                        />
                        <Text style={styles.codeBtnText}>
                            {copied ? 'Kopyalandı!' : 'Kopyala'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.codeBtn}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.codeBtnText}>Paylaş</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Players List */}
            <View style={styles.playersList}>
                <Text style={styles.playersTitle}>
                    OYUNCULAR ({room?.players.length || 0}/{room?.maxPlayers || 4})
                </Text>
                {room?.players.map((player, index) => (
                    <View key={player.id} style={styles.playerRow}>
                        <View style={[
                            styles.playerAvatar,
                            { backgroundColor: ['#FF4B4B', '#4B7BFF', '#34C759', '#FFD60A'][index % 4] },
                        ]}>
                            <Text style={styles.playerAvatarText}>
                                {player.displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.playerName}>
                            {player.displayName}
                        </Text>
                        {player.id === room?.hostPlayerId && (
                            <View style={styles.hostBadge}>
                                <Text style={styles.hostBadgeText}>👑 Ev Sahibi</Text>
                            </View>
                        )}
                        {player.isReady && (
                            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                        )}
                    </View>
                ))}

                {/* Empty slots */}
                {room && Array.from(
                    { length: room.maxPlayers - room.players.length },
                    (_, i) => (
                        <View key={`empty-${i}`} style={[styles.playerRow, styles.emptySlot]}>
                            <View style={[styles.playerAvatar, styles.emptyAvatar]}>
                                <Ionicons name="person-add" size={16} color="#48484A" />
                            </View>
                            <Text style={styles.emptySlotText}>
                                Oyuncu bekleniyor...
                            </Text>
                        </View>
                    ),
                )}
            </View>

            {/* Info */}
            <Text style={styles.infoText}>
                {isHost
                    ? 'Eksik oyuncu slotları botlarla doldurulacak.'
                    : 'Ev sahibi oyunu başlatana kadar bekleyin.'}
            </Text>

            {/* Start Button (host only) */}
            {isHost && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity
                        style={[
                            styles.startBtn,
                            (room?.players.length || 0) < 2 && styles.startBtnDisabled,
                        ]}
                        onPress={handleStart}
                        disabled={isStarting || (room?.players.length || 0) < 2}
                    >
                        {isStarting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.startBtnText}>
                                Oyunu Başlat 🚀
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backBtn: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    codeContainer: {
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
    },
    codeLabel: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    codeText: {
        color: '#FFFFFF',
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 8,
    },
    codeActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    codeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2C2C2E',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 100,
    },
    codeBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    playersList: {
        marginHorizontal: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
    },
    playersTitle: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    playerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    playerAvatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    playerName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    hostBadge: {
        backgroundColor: '#FFD60A20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginRight: 8,
    },
    hostBadgeText: {
        color: '#FFD60A',
        fontSize: 11,
        fontWeight: '700',
    },
    emptySlot: {
        opacity: 0.5,
    },
    emptyAvatar: {
        backgroundColor: '#2C2C2E',
        borderWidth: 1,
        borderColor: '#48484A',
        borderStyle: 'dashed',
    },
    emptySlotText: {
        color: '#48484A',
        fontSize: 14,
        fontStyle: 'italic',
    },
    infoText: {
        color: '#48484A',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    bottomActions: {
        padding: 16,
        marginTop: 'auto',
    },
    startBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
    },
    startBtnDisabled: {
        backgroundColor: '#2C2C2E',
    },
    startBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
