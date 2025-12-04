import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { BattleshipState, CellStatus, GRID_SIZE, Ship } from './types';
import { colors, spacing, typography } from '../../../../theme';
import { createPulseAnimation, ANIMATION_CONFIG, ANIMATION_DURATION } from '../../utils/animations';

interface BattleshipBoardProps {
    state: BattleshipState;
    onFire: (row: number, col: number) => void;
    onPlaceShip: (row: number, col: number) => void;
    onSelectShip: (id: string) => void;
    onToggleOrientation: () => void;
    onFinishSetup: () => void;
    onReset: () => void;
}

const AnimatedCell = ({
    row,
    col,
    status,
    onPress,
    disabled,
    isSmall = false
}: {
    row: number;
    col: number;
    status: CellStatus;
    onPress: () => void;
    disabled: boolean;
    isSmall?: boolean;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const prevStatus = useRef<CellStatus>(status);

    useEffect(() => {
        if (status !== prevStatus.current) {
            if (status === 'hit') {
                // Explosion effect
                scaleAnim.setValue(1.5);
                opacityAnim.setValue(0);
                Animated.parallel([
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        friction: 3,
                        ...ANIMATION_CONFIG,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: ANIMATION_DURATION.SHORT,
                        ...ANIMATION_CONFIG,
                    }),
                ]).start();
            } else if (status === 'miss') {
                // Splash effect
                scaleAnim.setValue(0.5);
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    ...ANIMATION_CONFIG,
                }).start();
            } else if (status === 'ship') {
                // Placement effect
                scaleAnim.setValue(0.8);
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    ...ANIMATION_CONFIG,
                }).start();
            }
            prevStatus.current = status;
        }
    }, [status]);

    let cellStyle: any = [styles.cell, isSmall && styles.cellSmall];
    let content = '';

    if (status === 'hit') {
        cellStyle.push(styles.cellHit);
        content = '💥';
    } else if (status === 'miss') {
        cellStyle.push(styles.cellMiss);
        content = '🌊';
    } else if (status === 'ship') {
        cellStyle.push(styles.cellShip);
        content = '';
    }

    return (
        <TouchableOpacity
            key={`${row}-${col}`}
            activeOpacity={0.8}
            onPress={onPress}
            disabled={disabled}
        >
            <Animated.View style={[cellStyle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                <Text style={[styles.cellText, isSmall && styles.cellTextSmall]}>{content}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export const BattleshipBoard: React.FC<BattleshipBoardProps> = ({
    state,
    onFire,
    onPlaceShip,
    onSelectShip,
    onToggleOrientation,
    onFinishSetup,
    onReset
}) => {
    const isSetup = state.phase === 'setup_p1' || state.phase === 'setup_p2';
    const isP1 = state.currentPlayer === 'P1';
    const currentPlayerState = isP1 ? state.p1 : state.p2;
    const opponentState = isP1 ? state.p2 : state.p1;

    // --- Setup Phase UI ---

    const renderSetup = () => (
        <View style={styles.setupContainer}>
            <Text style={styles.phaseTitle}>
                {state.phase === 'setup_p1' ? "Player 1 Setup" : "Player 2 Setup"}
            </Text>

            <View style={styles.gridContainer}>
                {currentPlayerState.grid.map((row, r) => (
                    <View key={r} style={styles.row}>
                        {row.map((cell, c) => (
                            <AnimatedCell
                                key={`${r}-${c}`}
                                row={r}
                                col={c}
                                status={cell}
                                onPress={() => onPlaceShip(r, c)}
                                disabled={false}
                            />
                        ))}
                    </View>
                ))}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton} onPress={onToggleOrientation}>
                    <Text style={styles.controlText}>
                        Orientation: {state.setup.orientation.toUpperCase()}
                    </Text>
                </TouchableOpacity>

                <ScrollView horizontal style={styles.shipList} contentContainerStyle={styles.shipListContent}>
                    {currentPlayerState.ships.map(ship => (
                        <TouchableOpacity
                            key={ship.id}
                            style={[
                                styles.shipItem,
                                state.setup.selectedShipId === ship.id && styles.shipItemSelected,
                                ship.placed && styles.shipItemPlaced
                            ]}
                            onPress={() => onSelectShip(ship.id)}
                        >
                            <Text style={[
                                styles.shipText,
                                state.setup.selectedShipId === ship.id && styles.shipTextSelected
                            ]}>
                                {ship.name} ({ship.size}) {ship.placed ? '✓' : ''}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={[styles.finishButton, currentPlayerState.ships.some(s => !s.placed) && styles.disabledButton]}
                    onPress={onFinishSetup}
                    disabled={currentPlayerState.ships.some(s => !s.placed)}
                >
                    <Text style={styles.finishButtonText}>Finish Setup</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // --- Game Phase UI ---

    const renderGame = () => (
        <View style={styles.gameContainer}>
            <View style={styles.header}>
                <Text style={styles.turnText}>
                    {state.phase === 'finished'
                        ? `Winner: ${state.winner === 'P1' ? 'Player 1' : 'Player 2'}! 🏆`
                        : `${state.currentPlayer}'s Turn`}
                </Text>
                {state.lastActionMessage && (
                    <View style={styles.messageBox}>
                        <Text style={styles.messageText}>{state.lastActionMessage}</Text>
                    </View>
                )}
            </View>

            <View style={styles.boardsRow}>
                {/* Opponent Board (Firing Target) */}
                <View style={styles.boardSection}>
                    <Text style={styles.boardLabel}>Opponent's Waters</Text>
                    <View style={styles.gridContainer}>
                        {currentPlayerState.shots.map((row, r) => (
                            <View key={r} style={styles.row}>
                                {row.map((cell, c) => (
                                    <AnimatedCell
                                        key={`${r}-${c}`}
                                        row={r}
                                        col={c}
                                        status={cell}
                                        onPress={() => onFire(r, c)}
                                        disabled={state.phase !== 'in_progress' || cell !== 'empty'}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Self Board (Small View) */}
            <View style={styles.miniBoardSection}>
                <Text style={styles.boardLabel}>Your Fleet</Text>
                <View style={styles.miniGrid}>
                    {currentPlayerState.grid.map((row, r) => (
                        <View key={r} style={styles.row}>
                            {row.map((cell, c) => (
                                <AnimatedCell
                                    key={`${r}-${c}`}
                                    row={r}
                                    col={c}
                                    status={cell}
                                    onPress={() => { }}
                                    disabled={true}
                                    isSmall={true}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </View>

            {state.phase === 'finished' && (
                <TouchableOpacity style={styles.resetButton} onPress={onReset}>
                    <Text style={styles.resetButtonText}>New Game</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {isSetup ? renderSetup() : renderGame()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        padding: spacing.sm,
    },
    setupContainer: {
        width: '100%',
        alignItems: 'center',
    },
    gameContainer: {
        width: '100%',
        alignItems: 'center',
    },
    phaseTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    gridContainer: {
        backgroundColor: colors.border,
        padding: 2,
        marginBottom: spacing.md,
    },
    miniGrid: {
        backgroundColor: colors.border,
        padding: 1,
        transform: [{ scale: 0.8 }],
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        width: 40,
        height: 40,
        backgroundColor: '#A0D2EB',
        margin: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellSmall: {
        width: 20,
        height: 20,
    },
    cellHit: {
        backgroundColor: '#FF4136',
    },
    cellMiss: {
        backgroundColor: '#0074D9',
    },
    cellShip: {
        backgroundColor: '#7FDBFF', // Visible ship color
        borderWidth: 2,
        borderColor: '#001f3f',
    },
    cellText: {
        fontSize: 20,
    },
    cellTextSmall: {
        fontSize: 10,
    },
    controls: {
        width: '100%',
        alignItems: 'center',
        gap: spacing.sm,
    },
    controlButton: {
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.sm,
        borderRadius: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    controlText: {
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    shipList: {
        maxHeight: 60,
        width: '100%',
    },
    shipListContent: {
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    shipItem: {
        padding: spacing.sm,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    shipItemSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    shipItemPlaced: {
        opacity: 0.5,
    },
    shipText: {
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    shipTextSelected: {
        color: colors.background,
    },
    finishButton: {
        backgroundColor: '#2ECC40',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: spacing.sm,
        marginTop: spacing.md,
    },
    disabledButton: {
        backgroundColor: colors.text.tertiary,
        opacity: 0.5,
    },
    finishButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: typography.fontSize.lg,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    turnText: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    messageBox: {
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.sm,
        borderRadius: spacing.xs,
        marginTop: spacing.xs,
        width: '90%',
        alignItems: 'center',
    },
    messageText: {
        color: colors.text.primary,
        textAlign: 'center',
        fontWeight: '500',
    },
    boardsRow: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    boardSection: {
        alignItems: 'center',
    },
    miniBoardSection: {
        alignItems: 'center',
        marginTop: spacing.sm,
        opacity: 0.8,
    },
    boardLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        fontWeight: 'bold',
    },
    resetButton: {
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.primary,
        borderRadius: spacing.sm,
    },
    resetButtonText: {
        color: colors.background,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});
