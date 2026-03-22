import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { PlaygroundGameShell } from '../platform/PlaygroundGameShell';
import { listGames } from '../platform/gameRegistry';
import { initializeGameRegistry } from '../registryInit';
import { colors } from '../../../theme';
import { GameId } from '../platform/types';
import { BilVeFethetMenuScreen } from '../games/bil_ve_fethet/BilVeFethetMenuScreen';

// Ensure games are registered
initializeGameRegistry();

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Games that have their own dedicated screens (bypassing PlaygroundGameShell)
const STANDALONE_GAMES: Record<string, boolean> = {
    'bil_ve_fethet': true,
};

export const PlaygroundScreen: React.FC = () => {
    const navigation = useNavigation<NavProp>();
    const [selectedGameId, setSelectedGameId] = React.useState<GameId | null>(null);
    const games = listGames();

    const handleGameSelect = (gameId: GameId) => {
        setSelectedGameId(gameId);
    };

    // If a non-standalone game is selected, show it in the GameShell
    if (selectedGameId && !STANDALONE_GAMES[selectedGameId]) {
        return (
            <View style={styles.container}>
                <PlaygroundGameShell gameId={selectedGameId} />
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

    // Game selector view
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Playground</Text>
                <Text style={styles.subtitle}>Bir oyun seç ve oynamaya başla!</Text>

                <View style={styles.gamesGrid}>
                    {games.map((game) => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.gameCard}
                            onPress={() => handleGameSelect(game.id)}
                            activeOpacity={0.8}
                            accessibilityLabel={game.title}
                        >
                            <Text style={styles.gameIcon}>
                                {(game as any).icon || '🎮'}
                            </Text>
                            <Text style={styles.gameTitle}>{game.title}</Text>
                            <Text style={styles.gameDesc} numberOfLines={2}>
                                {game.description}
                            </Text>
                            <View style={styles.gameModeBadge}>
                                <Text style={styles.gameModeText}>
                                    {game.modes.includes('multiplayer') ? '👥 Çok Oyunculu' : '👤 Tek Oyunculu'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
        marginBottom: 24,
    },
    gamesGrid: {
        gap: 16,
    },
    gameCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    gameIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    gameTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    gameDesc: {
        fontSize: 13,
        color: '#8E8E93',
        lineHeight: 18,
        marginBottom: 12,
    },
    gameModeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    gameModeText: {
        color: '#AEAEB2',
        fontSize: 12,
        fontWeight: '600',
    },
});
