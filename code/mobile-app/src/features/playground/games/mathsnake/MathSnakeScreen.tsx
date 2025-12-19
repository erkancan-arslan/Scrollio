import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { colors, spacing, typography } from '../../../../theme';
import { useAppDispatch } from '../../../../store/hooks';
import { incrementScore } from '../../store/playgroundSlice';
import { useGameExit } from '../../hooks/useGameExit';

const { width } = Dimensions.get('window');

// Logic Types
type OperationType = 'START' | '+' | '-' | '*' | '/';

interface GameState {
    currentValue: number; // The running total (hidden from user during step, user must remember it)
    displayString: string; // What to show (e.g. "+ 5" or "Start: 3")
    answer: number; // The correct result of applying operation to currentValue
    step: number; // 0 = Start, 1+ = Operations
}

const generateNextStep = (currentVal: number, step: number): GameState => {
    // Step 0: Initial Value
    if (step === 0) {
        const start = Math.floor(Math.random() * 20) + 1; // 1 to 20
        return {
            currentValue: 0, // Not used for calc
            displayString: `Start with ${start}`,
            answer: start,
            step: 0
        };
    }

    // Next Steps: Apply Operation
    const operators: OperationType[] = ['+', '-', '*'];
    // Only add division if compatible? Let's stick to simple first.
    // Actually, simple division is nice.

    // Weighted random? + and - are most common.
    const rand = Math.random();
    let op: OperationType = '+';
    if (rand < 0.4) op = '+';
    else if (rand < 0.7) op = '-';
    else op = '*';

    let operand = 0;
    let answer = 0;

    // Generate Operand based on Operation and Logic Limits
    if (op === '+') {
        operand = Math.floor(Math.random() * 20) + 1;
        answer = currentVal + operand;
    }
    else if (op === '-') {
        // Ensure positive result (optional, but good for flow)
        // Let's allow simple negatives? Maybe stick to positives for MVP comfort.
        const maxSub = currentVal + 5; // Allow going slightly negative? No, let's keep it > 0
        operand = Math.floor(Math.random() * currentVal); // 0 to currentVal-1
        if (operand === 0) operand = 1;
        answer = currentVal - operand;
    }
    else if (op === '*') {
        // Keep numbers manageable. If currentVal is big, multiply by small.
        if (currentVal > 20) operand = 2;
        else if (currentVal > 10) operand = Math.floor(Math.random() * 3) + 2; // 2 or 3
        else operand = Math.floor(Math.random() * 4) + 2; // 2 to 5
        answer = currentVal * operand;
    }

    return {
        currentValue: currentVal,
        displayString: `${op} ${operand}`,
        answer: answer,
        step: step
    };
};

export const MathSnakeScreen = () => {
    const dispatch = useAppDispatch();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial State
    // We start with a "Pre-Game" state that generates step 0 instantly
    const [gameState, setGameState] = useState<GameState>(() => generateNextStep(0, 0));

    const [timeLeft, setTimeLeft] = useState(10);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    // Custom Exit
    const handleExit = useGameExit(); // Cleanup managed by hook + useEffect below

    // Cleanup Timer
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!gameOver) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 0.1) {
                        handleGameOver();
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameOver]);

    const checkAnswer = (userAnswer: number) => {
        if (userAnswer === gameState.answer) {
            // Correct!
            const points = Math.ceil(timeLeft) * 10 + (gameState.step * 5); // Bonus for streak
            dispatch(incrementScore(points));
            setScore(s => s + points);

            // Advance
            setGameState(prev => generateNextStep(prev.answer, prev.step + 1));

            // Time Bonus (capped)
            setTimeLeft(prev => Math.min(prev + 3, 12));
        } else {
            handleGameOver();
        }
    };

    const handleGameOver = () => {
        setGameOver(true);
    };

    const resetGame = () => {
        setGameOver(false);
        setScore(0);
        setTimeLeft(10);
        setGameState(generateNextStep(0, 0));
    };

    // Memoized Options Generation (Prevent Flicker)
    const options = useMemo(() => {
        const correct = gameState.answer;
        const opts = new Set<number>([correct]);

        while (opts.size < 4) {
            // Generate near neighbors for difficulty
            const offset = Math.floor(Math.random() * 11) - 5; // -5 to +5
            const wrong = correct + offset;

            // Avoid duplicates and obvious errors (like negative if we stick to positive logic)
            // But if we allow negatives, this check is simple.
            // Just ensure uniqueness.
            if (wrong !== correct) opts.add(wrong);
        }
        return Array.from(opts).sort(() => Math.random() - 0.5);
    }, [gameState]);

    return (
        <View style={styles.container}>
            {/* Header: Score & "Snake Length" (Step) */}
            <View style={styles.header}>
                <View style={styles.statBox}>
                    <Text style={styles.label}>SCORE</Text>
                    <Text style={styles.value}>{score}</Text>
                </View>
                <View style={[styles.statBox, { alignItems: 'flex-end' }]}>
                    <Text style={styles.label}>LENGTH</Text>
                    <Text style={styles.value}>{gameState.step}</Text>
                </View>
            </View>

            {/* Back Button (Custom) */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleExit}>
                <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            {/* Timer */}
            <View style={styles.timerBar}>
                <View style={[styles.timerFill, { width: `${Math.min((timeLeft / 10) * 100, 100)}%`, backgroundColor: timeLeft < 3 ? colors.error : colors.primary }]} />
            </View>

            {/* Main Display */}
            <View style={styles.problemContainer}>
                <Text style={styles.stepText}>
                    {gameState.step === 0 ? "START" : `STEP ${gameState.step}`}
                </Text>
                <Text style={styles.problemText}>{gameOver ? 'GAME OVER' : gameState.displayString}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
                {!gameOver ? (
                    options.map((opt, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionBtn}
                            onPress={() => checkAnswer(opt)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <TouchableOpacity style={styles.retryBtn} onPress={resetGame}>
                        <Text style={styles.retryText}>Play Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.md,
        paddingTop: 60 // Safe area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.sm
    },
    statBox: {
        justifyContent: 'center'
    },
    label: {
        color: '#666', // Subtle
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    value: {
        color: colors.text.primary, // White
        fontSize: 24,
        fontWeight: 'bold'
    },
    closeBtn: {
        position: 'absolute',
        top: 20, // Inside Safe Area
        right: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    closeText: {
        color: '#666',
        fontSize: 20,
        fontWeight: 'bold'
    },
    timerBar: {
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        marginBottom: spacing.xxl,
        overflow: 'hidden'
    },
    timerFill: {
        height: '100%',
        backgroundColor: colors.primary
    },
    problemContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xxl
    },
    stepText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: spacing.sm,
        textTransform: 'uppercase'
    },
    problemText: {
        fontSize: 56,
        color: colors.text.primary,
        fontWeight: '900',
        textAlign: 'center'
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
        paddingBottom: spacing.xxl * 2
    },
    optionBtn: {
        width: '44%', // 2 per row
        aspectRatio: 1.4,
        backgroundColor: '#1A1A1A', // Dark surface
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    optionText: {
        fontSize: 36,
        color: 'white',
        fontWeight: 'bold'
    },
    retryBtn: {
        width: '100%',
        paddingVertical: 20,
        backgroundColor: colors.primary,
        borderRadius: 100,
        alignItems: 'center',
        marginTop: spacing.xl
    },
    retryText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold'
    }
});
