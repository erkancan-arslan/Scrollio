import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, spacing } from '../../../theme';
import { leaderboardService, LeaderboardEntry } from '../services/leaderboardService';
import { Ionicons } from '@expo/vector-icons';

interface LeaderboardProps {
    gameId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ gameId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLeaderboard();
    }, [gameId]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await leaderboardService.fetchWeeklyLeaderboard(gameId);
            setEntries(data);
        } catch (error) {
            console.error('Failed to load leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await leaderboardService.fetchWeeklyLeaderboard(gameId);
            setEntries(data);
        } catch (error) {
            console.error('Failed to refresh leaderboard', error);
        } finally {
            setRefreshing(false);
        }
    }, [gameId]);

    const renderItem = ({ item }: { item: LeaderboardEntry }) => (
        <View style={styles.row}>
            <View style={styles.rankContainer}>
                <Text style={[
                    styles.rank,
                    item.rank === 1 && styles.gold,
                    item.rank === 2 && styles.silver,
                    item.rank === 3 && styles.bronze
                ]}>
                    {item.rank}
                </Text>
            </View>

            <View style={styles.userContainer}>
                {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={16} color="#666" />
                    </View>
                )}
                <Text style={styles.name} numberOfLines={1}>{item.display_name}</Text>
            </View>

            <Text style={styles.score}>{item.score}</Text>
        </View>
    );

    if (loading && !refreshing) {
        return <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />;
    }

    if (entries.length === 0 && !refreshing) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No scores yet this week.</Text>
                <Text style={styles.emptySubtext}>Be the first to claim the throne!</Text>
                <Text style={[styles.emptySubtext, { marginTop: 10, fontSize: 10 }]}>Pull to refresh</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Weekly Top 100</Text>
            <FlatList
                data={entries}
                renderItem={renderItem}
                keyExtractor={(item) => `${item.user_id}-${item.created_at}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        title="Refreshing..."
                        titleColor="white"
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: spacing.md,
        marginTop: spacing.md
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.md,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    listContent: {
        paddingBottom: spacing.md
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    rankContainer: {
        width: 30,
        alignItems: 'center'
    },
    rank: {
        color: '#888',
        fontWeight: 'bold',
        fontSize: 16
    },
    gold: { color: '#FFD700' },
    silver: { color: '#C0C0C0' },
    bronze: { color: '#CD7F32' },
    userContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing.sm
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
        backgroundColor: '#333'
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center'
    },
    name: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600'
    },
    score: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: spacing.md
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        opacity: 0.7
    },
    emptyText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 8
    },
    emptySubtext: {
        color: '#999',
        fontSize: 12
    }
});
