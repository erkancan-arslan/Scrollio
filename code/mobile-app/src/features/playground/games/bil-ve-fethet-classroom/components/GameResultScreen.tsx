/**
 * Bil ve Fethet: Classroom — Game Result Screen
 *
 * End-of-game screen showing winner, final seat distribution,
 * and rematch option.
 */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { ClassroomMatchState, ClassroomPlayer, PLAYER_COLOR_HEX } from '../types';
import { SeatGrid } from './SeatGrid';
import { colors, spacing } from '../../../../../theme';

interface GameResultScreenProps {
    matchState: ClassroomMatchState;
    myPlayerId: string;
    onRematch: () => void;
    onExit: () => void;
}

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
    matchState,
    myPlayerId,
    onRematch,
    onExit,
}) => {
    const { result, players, grid } = matchState;
    const winner = players.find(p => p.id === result?.winnerId);
    const isWinner = result?.winnerId === myPlayerId;

    const sortedPlayers = [...players].sort((a, b) => b.seatCount - a.seatCount);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Winner Banner */}
            <View style={styles.bannerContainer}>
                <Text style={styles.title}>
                    {isWinner ? '🏆 TEBRİKLER!' : '🎮 OYUN BİTTİ'}
                </Text>
                {winner && (
                    <View style={styles.winnerRow}>
                        <View style={[
                            styles.winnerDot,
                            { backgroundColor: PLAYER_COLOR_HEX[winner.color] },
                        ]} />
                        <Text style={styles.winnerName}>
                            {winner.displayName}
                            {winner.isBot ? ' 🤖' : ''}
                        </Text>
                        <Text style={styles.winnerLabel}> kazandı!</Text>
                    </View>
                )}
                {result?.reason === 'max_turns' && (
                    <Text style={styles.reasonText}>
                        Maksimum tur sayısına ulaşıldı
                    </Text>
                )}
            </View>

            {/* Final Grid */}
            <SeatGrid
                grid={grid}
                players={players}
                disabled
            />

            {/* Scoreboard */}
            <View style={styles.scoreboard}>
                <Text style={styles.scoreboardTitle}>SKOR TABLOSU</Text>
                {sortedPlayers.map((player, index) => (
                    <View key={player.id} style={styles.scoreRow}>
                        <Text style={styles.scoreRank}>#{index + 1}</Text>
                        <View style={[
                            styles.scoreColorDot,
                            { backgroundColor: PLAYER_COLOR_HEX[player.color] },
                        ]} />
                        <Text style={[
                            styles.scoreName,
                            player.id === myPlayerId && styles.scoreNameSelf,
                        ]}>
                            {player.displayName}
                            {player.isBot ? ' 🤖' : ''}
                            {player.id === myPlayerId ? ' (Sen)' : ''}
                        </Text>
                        <Text style={styles.scoreSeatCount}>
                            {player.seatCount} koltuk
                        </Text>
                    </View>
                ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.rematchBtn}
                    onPress={onRematch}
                    accessibilityLabel="Tekrar oyna"
                >
                    <Text style={styles.rematchBtnText}>🔄 Tekrar Oyna</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.exitBtn}
                    onPress={onExit}
                    accessibilityLabel="Çıkış"
                >
                    <Text style={styles.exitBtnText}>Çıkış</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    bannerContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    winnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    winnerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    winnerName: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    winnerLabel: {
        color: '#8E8E93',
        fontSize: 20,
    },
    reasonText: {
        color: '#8E8E93',
        fontSize: 13,
        marginTop: 4,
    },
    scoreboard: {
        marginHorizontal: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    scoreboardTitle: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        textAlign: 'center',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    scoreRank: {
        color: '#48484A',
        fontSize: 14,
        fontWeight: '700',
        width: 28,
    },
    scoreColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    scoreName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    scoreNameSelf: {
        fontWeight: '700',
        color: '#FFD60A',
    },
    scoreSeatCount: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    actions: {
        padding: 16,
        gap: 12,
        marginTop: 'auto',
    },
    rematchBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
    },
    rematchBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    exitBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    exitBtnText: {
        color: '#666666',
        fontSize: 15,
        fontWeight: '600',
    },
});
