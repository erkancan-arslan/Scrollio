/**
 * Bil ve Fethet: Classroom — SeatGrid Component
 *
 * Renders the 3×8 classroom seat grid. Each seat shows ownership color,
 * highlights valid targets, and supports tap interactions.
 */
import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { ClassroomSeat, ClassroomPlayer, GRID_ROWS, GRID_COLS, PLAYER_COLOR_HEX } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const SEAT_GAP = 6;
const SEAT_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - SEAT_GAP * (GRID_COLS - 1)) / GRID_COLS);

interface SeatGridProps {
    grid: ClassroomSeat[];
    players: ClassroomPlayer[];
    validTargets?: number[];
    selectedSeat?: number | null;
    onSeatPress?: (seatIndex: number) => void;
    disabled?: boolean;
    currentTurnPlayerId?: string;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
    grid,
    players,
    validTargets = [],
    selectedSeat = null,
    onSeatPress,
    disabled = false,
    currentTurnPlayerId,
}) => {
    const getPlayerColor = (playerId: string | null): string => {
        if (!playerId) return '#2C2C2E';
        const player = players.find(p => p.id === playerId);
        return player ? PLAYER_COLOR_HEX[player.color] : '#2C2C2E';
    };

    const getPlayerInitial = (playerId: string | null): string => {
        if (!playerId) return '';
        const player = players.find(p => p.id === playerId);
        if (!player) return '';
        return player.displayName.charAt(0).toUpperCase();
    };

    const isValidTarget = (index: number): boolean => validTargets.includes(index);
    const isSelected = (index: number): boolean => selectedSeat === index;

    const renderSeat = (seat: ClassroomSeat) => {
        const isOwned = seat.ownerPlayerId !== null;
        const isTarget = isValidTarget(seat.index);
        const isSel = isSelected(seat.index);
        const bgColor = getPlayerColor(seat.ownerPlayerId);

        return (
            <TouchableOpacity
                key={seat.index}
                style={[
                    styles.seat,
                    { backgroundColor: bgColor },
                    isTarget && styles.seatTarget,
                    isSel && styles.seatSelected,
                    !isOwned && !isTarget && styles.seatEmpty,
                ]}
                onPress={() => onSeatPress?.(seat.index)}
                disabled={disabled || (!isTarget && isOwned)}
                activeOpacity={0.7}
                accessibilityLabel={`Seat ${seat.row + 1}-${seat.col + 1}${isOwned ? `, owned by ${getPlayerInitial(seat.ownerPlayerId)}` : ', empty'}`}
            >
                {isOwned && (
                    <Text style={styles.seatInitial}>
                        {getPlayerInitial(seat.ownerPlayerId)}
                    </Text>
                )}
                {!isOwned && isTarget && (
                    <View style={styles.targetIndicator} />
                )}
                {!isOwned && !isTarget && (
                    <Text style={styles.seatNumber}>{seat.index + 1}</Text>
                )}
            </TouchableOpacity>
        );
    };

    const rows: ClassroomSeat[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
        rows.push(grid.slice(r * GRID_COLS, (r + 1) * GRID_COLS));
    }

    return (
        <View style={styles.container}>
            {/* Column headers (desk numbers) */}
            <View style={styles.headerRow}>
                {Array.from({ length: GRID_COLS }, (_, i) => (
                    <View key={i} style={styles.headerCell}>
                        <Text style={styles.headerText}>{i + 1}</Text>
                    </View>
                ))}
            </View>

            {/* Grid rows */}
            {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    <View style={styles.rowLabel}>
                        <Text style={styles.rowLabelText}>
                            {String.fromCharCode(65 + rowIndex)}
                        </Text>
                    </View>
                    {row.map(seat => renderSeat(seat))}
                </View>
            ))}

            {/* Player legend */}
            <View style={styles.legend}>
                {players.map(player => (
                    <View key={player.id} style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendColor,
                                { backgroundColor: PLAYER_COLOR_HEX[player.color] },
                                player.id === currentTurnPlayerId && styles.legendColorActive,
                            ]}
                        />
                        <Text style={[
                            styles.legendText,
                            player.id === currentTurnPlayerId && styles.legendTextActive,
                        ]}>
                            {player.displayName}
                            {player.isBot ? ' 🤖' : ''}
                            {` (${player.seatCount})`}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: GRID_PADDING,
    },
    headerRow: {
        flexDirection: 'row',
        marginLeft: 28,
        marginBottom: 4,
    },
    headerCell: {
        width: SEAT_SIZE,
        marginRight: SEAT_GAP,
        alignItems: 'center',
    },
    headerText: {
        color: '#8E8E93',
        fontSize: 11,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SEAT_GAP,
    },
    rowLabel: {
        width: 22,
        marginRight: 6,
        alignItems: 'center',
    },
    rowLabelText: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '700',
    },
    seat: {
        width: SEAT_SIZE,
        height: SEAT_SIZE,
        borderRadius: 8,
        marginRight: SEAT_GAP,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    seatEmpty: {
        backgroundColor: '#1C1C1E',
        borderColor: '#3A3A3C',
    },
    seatTarget: {
        borderColor: '#FFD60A',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    seatSelected: {
        borderColor: '#FFFFFF',
        borderWidth: 3,
        transform: [{ scale: 1.05 }],
    },
    seatInitial: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    seatNumber: {
        color: '#48484A',
        fontSize: 10,
        fontWeight: '600',
    },
    targetIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFD60A',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendColorActive: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    legendText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '500',
    },
    legendTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
