import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { PlaygroundGameShell } from '../platform/PlaygroundGameShell';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listGames } from '../platform/gameRegistry';
import { initializeGameRegistry } from '../registryInit';
import { colors } from '../../../theme';
import { GameId } from '../platform/types';
import { BilVeFethetMenuScreen } from '../games/bil_ve_fethet/BilVeFethetMenuScreen';
import { BilVeFethetKidsScreen } from '../games/bil-ve-fethet-kids/BilVeFethetKidsScreen';
import { SpaceRepairLobbyScreen } from '../games/space-repair-kids/SpaceRepairLobbyScreen';
import { ClassroomMenuScreen } from '../games/bil-ve-fethet-classroom/ClassroomMenuScreen';

// Ensure games are registered
initializeGameRegistry();

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type PlaygroundRouteProp = RouteProp<Record<string, { category?: string }>, string>;

// Games that have their own dedicated screens (bypassing PlaygroundGameShell)
const STANDALONE_GAMES: Record<string, boolean> = {
    'bil_ve_fethet': true,
    'bil_ve_fethet_kids': true,
    'bil_ve_fethet_classroom': true,
    'space_repair_kids': true,
};

export const PlaygroundScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const route = useRoute<PlaygroundRouteProp>();
    const [selectedGameId, setSelectedGameId] = React.useState<GameId | null>(null);
    const insets = useSafeAreaInsets();
    
    // Default to 'core' if no category is provided
    const category = route.params?.category || 'core';
    const games = listGames(category);

    // Hide the bottom tab bar when any game is active
    useEffect(() => {
        if (selectedGameId) {
            (navigation as any).setOptions({
                tabBarStyle: { display: 'none' },
            });
        } else {
            (navigation as any).setOptions({
                tabBarStyle: [
                    {
                        backgroundColor: '#FF8C42',
                        borderTopWidth: 0,
                        position: 'absolute',
                        elevation: 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                    },
                    {
                        height: 60 + (Platform.OS === 'ios' ? insets.bottom : 10),
                        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
                    },
                ],
            });
        }
    }, [selectedGameId, navigation, insets.bottom]);

    const handleGameSelect = (gameId: GameId) => {
        setSelectedGameId(gameId);
    };

    // If a non-standalone game is selected, show it in the GameShell
    if (selectedGameId && !STANDALONE_GAMES[selectedGameId]) {
        return (
            <View style={styles.container}>
                <PlaygroundGameShell 
                    gameId={selectedGameId} 
                    onExit={() => setSelectedGameId(null)}
                />
            </View>
        );
    }

    // Standalone: Bil ve Fethet
    if (selectedGameId === 'bil_ve_fethet') {
        return (
            <BilVeFethetMenuScreen
                onSinglePlayer={() => {}}
                onExit={() => setSelectedGameId(null)}
            />
        );
    }

    // Standalone: Sınıfı Fethet (Kids)
    if (selectedGameId === 'bil_ve_fethet_kids') {
        return (
            <BilVeFethetKidsScreen
                onExit={() => setSelectedGameId(null)}
            />
        );
    }

    // Standalone: Bil ve Fethet: Sınıf (Classroom)
    if (selectedGameId === 'bil_ve_fethet_classroom') {
        return (
            <ClassroomMenuScreen
                onExit={() => setSelectedGameId(null)}
            />
        );
    }

    // Standalone: Uzay Gemisi Tamiri (Space Repair Kids)
    if (selectedGameId === 'space_repair_kids') {
        return (
            <SpaceRepairLobbyScreen
                onExit={() => setSelectedGameId(null)}
            />
        );
    }

    // Game selector view
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Playground</Text>
                    <View style={styles.liveBadgeBadge}>
                        <View style={styles.dot} />
                        <Text style={styles.liveBadgeText}>ONLINE</Text>
                    </View>
                </View>
                <Text style={styles.subtitle}>Eğlenerek öğrenmeye hazır mısın? Sana özel oyunları keşfet ve fethetmeye başla.</Text>

                <View style={styles.gamesGrid}>
                    {games.map((game, index) => {
                        const isMultiplayer = game.modes.includes('multiplayer');
                        return (
                            <TouchableOpacity
                                key={game.id}
                                style={styles.gameCard}
                                onPress={() => handleGameSelect(game.id)}
                                activeOpacity={0.8}
                                accessibilityLabel={game.title}
                            >
                                <View style={styles.cardGlow} />
                                <View style={styles.cardContent}>
                                    <View style={styles.iconWrapper}>
                                        <Text style={styles.gameIcon}>
                                            {(game as any).icon || '🎮'}
                                        </Text>
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.gameTitle}>{game.title}</Text>
                                        <Text style={styles.gameDesc} numberOfLines={2}>
                                            {game.description}
                                        </Text>
                                        <View style={styles.cardBottomRow}>
                                            <View style={[styles.gameModeBadge, isMultiplayer ? styles.badgeMulti : styles.badgeSingle]}>
                                                <Ionicons 
                                                    name={isMultiplayer ? 'people' : 'person'} 
                                                    size={12} 
                                                    color={isMultiplayer ? '#A584FF' : '#4DA2FF'} 
                                                />
                                                <Text style={[styles.gameModeText, isMultiplayer ? styles.textMulti : styles.textSingle]}>
                                                    {isMultiplayer ? 'Çok Oyunculu' : 'Tek Oyunculu'}
                                                </Text>
                                            </View>
                                            <View style={styles.playActionInfo}>
                                                <Text style={styles.playActionText}>Oyna</Text>
                                                <Ionicons name="chevron-forward" size={16} color="#FF8C42" />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090E', // Deep premium dark background
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100, // accommodate tab bar
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    liveBadgeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.3)',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34C759',
        marginRight: 6,
    },
    liveBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#34C759',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 15,
        color: '#8E8E93',
        marginBottom: 32,
        lineHeight: 22,
        maxWidth: '90%',
    },
    gamesGrid: {
        gap: 20,
    },
    gameCard: {
        borderRadius: 24,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        backgroundColor: '#15151A',
        borderWidth: 1,
        borderColor: '#242433',
        overflow: 'hidden',
    },
    cardGlow: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 140, 66, 0.05)', // Subtle orange glow
    },
    cardContent: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#1E1E26',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    gameIcon: {
        fontSize: 34,
    },
    textContainer: {
        flex: 1,
    },
    gameTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    gameDesc: {
        fontSize: 13,
        color: '#A0A0A5',
        lineHeight: 18,
        marginBottom: 14,
    },
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gameModeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
    },
    badgeSingle: {
        backgroundColor: 'rgba(77, 162, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(77, 162, 255, 0.2)',
    },
    badgeMulti: {
        backgroundColor: 'rgba(165, 132, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(165, 132, 255, 0.2)',
    },
    gameModeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    textSingle: {
        color: '#4DA2FF',
    },
    textMulti: {
        color: '#A584FF',
    },
    playActionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    playActionText: {
        color: '#FF8C42',
        fontSize: 14,
        fontWeight: '700',
    },
});
