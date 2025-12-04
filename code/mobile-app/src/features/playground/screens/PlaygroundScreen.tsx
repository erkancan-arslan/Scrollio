import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../../theme';
import { GameMode } from '../types';

type PlaygroundScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Playground'>;
};

type GameItem = {
    id: string;
    name: string;
    description: string;
    route: keyof RootStackParamList;
    supportedModes: GameMode[];
};

const GAMES: GameItem[] = [
    {
        id: '1',
        name: 'Tic-Tac-Toe',
        description: 'Classic 3x3 strategy game',
        route: 'TicTacToe',
        supportedModes: ['multiplayer'],
    },
    {
        id: '2',
        name: '4-in-a-row',
        description: 'Connect 4 pieces to win',
        route: 'FourInARow',
        supportedModes: ['multiplayer'],
    },
    {
        id: '3',
        name: 'Rock-Paper-Scissors',
        description: 'Classic hand game',
        route: 'RockPaperScissors',
        supportedModes: ['singleplayer', 'multiplayer'],
    },
    {
        id: '4',
        name: 'Word Guess (TR)',
        description: 'Guess the Turkish word',
        route: 'WordGuess',
        supportedModes: ['singleplayer'],
    },
    {
        id: '5',
        name: 'Memory Match',
        description: 'Find matching pairs',
        route: 'MemoryMatch',
        supportedModes: ['singleplayer'],
    },
    {
        id: '6',
        name: 'Number Duel',
        description: 'Guess the secret number',
        route: 'NumberGuess',
        supportedModes: ['singleplayer', 'multiplayer'],
    },
    {
        id: '7',
        name: 'Battleship',
        description: 'Sink opponent ships',
        route: 'Battleship',
        supportedModes: ['multiplayer'],
    },
    {
        id: 'tiny-geoguess',
        name: 'Tiny GeoGuess',
        description: 'Guess the city from the image!',
        route: 'TinyGeoGuess',
        supportedModes: ['singleplayer'],
    },
    {
        id: 'turkish-wordle',
        name: 'Türkçe Wordle',
        description: '5 harfli Türkçe kelimeyi tahmin et!',
        route: 'TurkishWordle',
        supportedModes: ['singleplayer'],
    },
];

export const PlaygroundScreen: React.FC<PlaygroundScreenProps> = ({ navigation }) => {
    const [selectedMode, setSelectedMode] = useState<GameMode>('singleplayer');

    const filteredGames = GAMES.filter(game => game.supportedModes.includes(selectedMode));

    const renderGameItem = ({ item }: { item: GameItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate(item.route as any)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.tagsContainer}>
                    {item.supportedModes.map(mode => (
                        <View key={mode} style={[styles.tag, mode === 'singleplayer' ? styles.tagSingle : styles.tagMulti]}>
                            <Text style={styles.tagText}>{mode === 'singleplayer' ? '1P' : '2P'}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedMode === 'singleplayer' && styles.activeTab]}
                    onPress={() => setSelectedMode('singleplayer')}
                >
                    <Text style={[styles.tabText, selectedMode === 'singleplayer' && styles.activeTabText]}>Single Player</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedMode === 'multiplayer' && styles.activeTab]}
                    onPress={() => setSelectedMode('multiplayer')}
                >
                    <Text style={[styles.tabText, selectedMode === 'multiplayer' && styles.activeTabText]}>Multiplayer</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredGames}
                renderItem={renderGameItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: spacing.sm,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.secondary,
    },
    activeTabText: {
        color: colors.background,
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.lg,
        borderRadius: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    cardTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    tag: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagSingle: {
        backgroundColor: '#4A90E2',
    },
    tagMulti: {
        backgroundColor: '#50E3C2',
    },
    tagText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    cardDescription: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
});
