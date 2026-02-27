/**
 * Bil ve Fethet: Classroom — Menu Screen
 *
 * Pre-game menu offering three entry points:
 * A) Rastgele Oyna (Random 4-player)
 * B) Oda Oluştur (Create Room)
 * C) Odaya Katıl (Join Room)
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/AppNavigator';
import { classroomService } from './services/classroomService';
import { colors, spacing } from '../../../../theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ClassroomMenuScreenProps {
    onExit: () => void;
}

export const ClassroomMenuScreen: React.FC<ClassroomMenuScreenProps> = ({ onExit }) => {
    const navigation = useNavigation<NavProp>();
    const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'queuing'>('menu');
    const [roomCode, setRoomCode] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [isLoading, setIsLoading] = useState(false);
    const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);

    // Listen for match_found while in queue
    useEffect(() => {
        return () => {
            classroomService.leaveQueue().catch(() => { });
            classroomService.unsubscribeFromPlayerNotifications().catch(() => { });
        };
    }, []);

    // =====================================================
    // Handlers
    // =====================================================

    const handleJoinQueue = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setMode('queuing');

            // Instant match with 3 medium bots
            const result = await classroomService.quickPlay();
            navigation.navigate('ClassroomGame', { matchId: result.matchId });
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Oyun başlatılırken bir hata oluştu');
            setMode('menu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelQueue = async (): Promise<void> => {
        await classroomService.leaveQueue();
        await classroomService.unsubscribeFromPlayerNotifications();
        setMode('menu');
    };

    const handleCreateRoom = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const { roomCode: code } = await classroomService.createRoom(maxPlayers);
            setCreatedRoomCode(code);
            navigation.navigate('ClassroomLobby', { roomCode: code, isHost: true });
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Oda oluşturulurken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRoom = async (): Promise<void> => {
        if (!roomCode.trim()) {
            Alert.alert('Hata', 'Lütfen bir oda kodu girin');
            return;
        }
        try {
            setIsLoading(true);
            await classroomService.joinRoom(roomCode.trim().toUpperCase());
            navigation.navigate('ClassroomLobby', { roomCode: roomCode.trim().toUpperCase(), isHost: false });
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Odaya katılırken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    // =====================================================
    // Render
    // =====================================================

    if (mode === 'queuing') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.queueTitle}>Oyuncu Aranıyor...</Text>
                    <Text style={styles.queueSubtitle}>
                        4 oyuncu tamamlanana kadar bekleniyor.{'\n'}
                        Bulunamazsa botlar eklenecek.
                    </Text>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelQueue}
                    >
                        <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onExit} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Bil ve Fethet</Text>
                    <Text style={styles.subtitle}>Sınıf</Text>
                </View>

                {/* Grid Preview */}
                <View style={styles.previewContainer}>
                    <View style={styles.gridPreview}>
                        {Array.from({ length: 24 }, (_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.previewSeat,
                                    { backgroundColor: ['#FF4B4B', '#4B7BFF', '#34C759', '#FFD60A'][i % 4] + '40' },
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.previewText}>3 × 8 Sınıf Düzeni • 24 Koltuk</Text>
                </View>

                {/* Menu Buttons */}
                <View style={styles.menuContainer}>
                    {mode === 'menu' && (
                        <>
                            <TouchableOpacity
                                style={[styles.menuBtn, styles.randomBtn]}
                                onPress={handleJoinQueue}
                                disabled={isLoading}
                                accessibilityLabel="Rastgele oyna"
                            >
                                <Ionicons name="shuffle" size={24} color="#FFFFFF" />
                                <View style={styles.menuBtnTextContainer}>
                                    <Text style={styles.menuBtnTitle}>Rastgele Oyna</Text>
                                    <Text style={styles.menuBtnDesc}>4 oyunculu rastgele eşleşme</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuBtn, styles.createBtn]}
                                onPress={() => setMode('create')}
                                accessibilityLabel="Oda oluştur"
                            >
                                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                                <View style={styles.menuBtnTextContainer}>
                                    <Text style={styles.menuBtnTitle}>Oda Oluştur</Text>
                                    <Text style={styles.menuBtnDesc}>Arkadaşlarınla özel oda</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuBtn, styles.joinBtn]}
                                onPress={() => setMode('join')}
                                accessibilityLabel="Odaya katıl"
                            >
                                <Ionicons name="enter" size={24} color="#FFFFFF" />
                                <View style={styles.menuBtnTextContainer}>
                                    <Text style={styles.menuBtnTitle}>Odaya Katıl</Text>
                                    <Text style={styles.menuBtnDesc}>Oda kodu ile katıl</Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                    {mode === 'create' && (
                        <View style={styles.formContainer}>
                            <Text style={styles.formTitle}>Oda Oluştur</Text>

                            <Text style={styles.formLabel}>Oyuncu Sayısı</Text>
                            <View style={styles.playerCountRow}>
                                {[2, 3, 4].map(count => (
                                    <TouchableOpacity
                                        key={count}
                                        style={[
                                            styles.playerCountBtn,
                                            maxPlayers === count && styles.playerCountBtnActive,
                                        ]}
                                        onPress={() => setMaxPlayers(count)}
                                    >
                                        <Text style={[
                                            styles.playerCountText,
                                            maxPlayers === count && styles.playerCountTextActive,
                                        ]}>
                                            {count}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleCreateRoom}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Oda Oluştur</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backMenuBtn}
                                onPress={() => setMode('menu')}
                            >
                                <Text style={styles.backMenuBtnText}>← Geri</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {mode === 'join' && (
                        <View style={styles.formContainer}>
                            <Text style={styles.formTitle}>Odaya Katıl</Text>

                            <Text style={styles.formLabel}>Oda Kodu</Text>
                            <TextInput
                                style={styles.input}
                                value={roomCode}
                                onChangeText={text => setRoomCode(text.toUpperCase())}
                                placeholder="Örn: A1B2C3"
                                placeholderTextColor="#48484A"
                                autoCapitalize="characters"
                                maxLength={6}
                            />

                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleJoinRoom}
                                disabled={isLoading || !roomCode.trim()}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Katıl</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backMenuBtn}
                                onPress={() => setMode('menu')}
                            >
                                <Text style={styles.backMenuBtnText}>← Geri</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Rules summary */}
                <View style={styles.rulesContainer}>
                    <Text style={styles.rulesTitle}>KURALLAR</Text>
                    <Text style={styles.rulesText}>
                        • Draft fazında koltukları sırayla seçin{'\n'}
                        • Komşu koltuklara saldırın (yukarı/aşağı/sol/sağ){'\n'}
                        • Soruyu doğru cevaplayarak fethet{'\n'}
                        • Art arda 2 doğru cevap = koltuk fethi{'\n'}
                        • 24 koltuğun hepsini fethedin ve kazanın! 🏆
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    flex: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    header: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 8,
    },
    backBtn: {
        position: 'absolute',
        left: 16,
        top: 16,
        padding: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 2,
    },
    previewContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    gridPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 200,
        justifyContent: 'center',
        gap: 3,
    },
    previewSeat: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    previewText: {
        color: '#48484A',
        fontSize: 12,
        marginTop: 8,
    },
    menuContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    menuBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 14,
    },
    randomBtn: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    createBtn: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#34C759',
    },
    joinBtn: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#FFD60A',
    },
    menuBtnTextContainer: {
        flex: 1,
    },
    menuBtnTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    menuBtnDesc: {
        color: '#8E8E93',
        fontSize: 13,
        marginTop: 2,
    },
    formContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
    },
    formTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    formLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    playerCountRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    playerCountBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
    },
    playerCountBtnActive: {
        backgroundColor: colors.primary,
    },
    playerCountText: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '700',
    },
    playerCountTextActive: {
        color: '#FFFFFF',
    },
    input: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 20,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 100,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    backMenuBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    backMenuBtnText: {
        color: '#8E8E93',
        fontSize: 14,
    },
    queueTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginTop: 20,
    },
    queueSubtitle: {
        color: '#8E8E93',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    cancelBtn: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#48484A',
    },
    cancelBtnText: {
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '600',
    },
    rulesContainer: {
        marginTop: 'auto',
        padding: 20,
    },
    rulesTitle: {
        color: '#48484A',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 6,
    },
    rulesText: {
        color: '#48484A',
        fontSize: 12,
        lineHeight: 18,
    },
});
