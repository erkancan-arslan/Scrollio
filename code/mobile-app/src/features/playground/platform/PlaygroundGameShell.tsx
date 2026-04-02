
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { colors, spacing } from '../../../theme';
import { GameId, GameResult } from './types';
import { getGameDefinition } from './gameRegistry';
import { endGame, resetCurrentSession, selectActiveSession, startGame, updateGameState } from '../store/playgroundSlice';
import { leaderboardService } from '../services/leaderboardService';
import { Leaderboard } from '../components/Leaderboard';

import { RouteProp } from '@react-navigation/native';

type GameShellParams = {
    GameShell: {
        gameId: GameId;
        config?: any;
    };
};

interface PlaygroundGameShellProps {
    route?: RouteProp<GameShellParams, 'GameShell'>;
    gameId?: GameId;
    config?: any;
    onExit?: () => void;
}

export const PlaygroundGameShell: React.FC<PlaygroundGameShellProps> = (props) => {
    // Determine gameId and config from direct props OR route params
    const gameId = props.gameId || props.route?.params?.gameId;
    const config = props.config || props.route?.params?.config;

    if (!gameId) {
        // Should not happen if used correctly
        return null;
    }

    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const activeSession = useAppSelector(selectActiveSession);
    const [definition, setDefinition] = useState<any>(null);

    // Load Definition
    useEffect(() => {
        console.log('[GameShell] Loading definition for:', gameId);
        try {
            const def = getGameDefinition(gameId);
            console.log('[GameShell] Definition found:', !!def);
            setDefinition(def);
        } catch (e) {
            console.error('[GameShell] Error loading definition:', e);
            // Fallback: exit if game not found
            navigation.goBack();
        }
    }, [gameId, navigation]);

    // Start Session (Pre-game -> In-game)
    // Start Session (Pre-game -> In-game)
    useEffect(() => {
        if (definition) {
            console.log('[GameShell] Checking session. Active:', activeSession?.gameId, 'Target:', gameId);
            // Only start if we don't have a session or session doesn't match this game
            if (!activeSession || activeSession.gameId !== gameId) {
                console.log('[GameShell] Dispatching startGame');
                dispatch(startGame({ gameId, config }));
            }
        }
        return () => {
            // Cleanup on unmount handled by UI action or distinct "exit" call
            // We might want to keep session if user navigates away? 
            // For now, let's enforce cleanup on exit.
            // dispatch(resetCurrentSession()); 
        };
    }, [definition, activeSession, gameId, config, dispatch]);

    const handleExit = () => {
        dispatch(resetCurrentSession());
        if (props.onExit) {
            props.onExit();
        } else {
            navigation.goBack();
        }
    };

    const handleGameOver = (result: GameResult) => {
        dispatch(endGame(result));

        // Auto-submit to leaderboard if configured
        if (definition?.leaderboard) {
            const boardId = definition.leaderboard.boardId;
            const score = result.score; // Or normalized score
            if (score > 0) {
                leaderboardService.submitScore(boardId, score)
                    .catch(e => console.error('Leaderboard submit failed', e));
            }
        }
    };

    const handlePlayAgain = () => {
        // Reset and restart
        dispatch(resetCurrentSession());
        setTimeout(() => {
            dispatch(startGame({ gameId, config }));
        }, 50);
    };

    if (!definition || !activeSession || activeSession.gameId !== gameId) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading Game...</Text>
            </View>
        );
    }

    const { UI } = definition;
    const { isGameOver, result } = activeSession;

    // POST-GAME: Result View
    if (isGameOver) {
        if (UI.Results) {
            return (
                <UI.Results
                    result={result!}
                    onPlayAgain={handlePlayAgain}
                    onExit={handleExit}
                />
            );
        }

        // Default Results View
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.resultContainer}>
                    <Text style={styles.gameOverTitle}>GAME OVER</Text>

                    <View style={styles.statRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>SCORE</Text>
                            <Text style={styles.statValue}>{result?.score || 0}</Text>
                        </View>
                        {/* Only show outcome if relevant */}
                        {result?.outcome && (
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>RESULT</Text>
                                <Text style={styles.statValue}>{result.outcome.toUpperCase()}</Text>
                            </View>
                        )}
                    </View>

                    {definition.leaderboard && (
                        <View style={{ flex: 1, width: '100%', marginBottom: spacing.md }}>
                            <Leaderboard gameId={definition.leaderboard.boardId} />
                        </View>
                    )}

                    <TouchableOpacity style={styles.primaryBtn} onPress={handlePlayAgain}>
                        <Text style={styles.btnText}>Play Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleExit}>
                        <Text style={styles.secondaryBtnText}>Exit</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // IN-GAME: Game View
    return (
        <View style={styles.container}>
            <UI.Screen
                session={activeSession}
                state={activeSession.state as any}
                dispatchGameAction={(action: any) => dispatch(updateGameState(action))} // This is a bit simplistic, we might need a richer update path
                // Actually, UI.Screen might need to run its own local reducers and just sync state up
                // OR we pass a specific "updateState" callback. 
                // For now, let's assume the game purely manages state via the updateGameState action.
                onGameOver={handleGameOver}
                onExit={handleExit}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.text.secondary,
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: '#000'
    },
    gameOverTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: 'white',
        marginBottom: spacing.xxl,
        letterSpacing: 2
    },
    statRow: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginBottom: spacing.xxl
    },
    statBox: {
        alignItems: 'center'
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4
    },
    statValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold'
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        marginBottom: spacing.md
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    secondaryBtn: {
        paddingVertical: 12
    },
    secondaryBtnText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600'
    }
});
