import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { colors, spacing, typography } from '../../../../theme';
import { useAppDispatch } from '../../../../store/hooks';
import { incrementScore } from '../../store/playgroundSlice';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const MOCK_EVENTS = [
    { id: '1', year: 1969, event: 'Moon Landing' },
    { id: '2', year: 1989, event: 'Fall of Berlin Wall' },
    { id: '3', year: 2007, event: 'iPhone Released' },
    { id: '4', year: 1453, event: 'Fall of Constantinople' },
];

import { useGameExit } from '../../hooks/useGameExit';

export const TimelineMasterScreen = () => {
    const dispatch = useAppDispatch();
    useGameExit();

    const [events, setEvents] = useState(MOCK_EVENTS.sort(() => Math.random() - 0.5));
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const moveItem = (fromIndex: number, toIndex: number) => {
        const updatedEvents = [...events];
        const [movedItem] = updatedEvents.splice(fromIndex, 1);
        updatedEvents.splice(toIndex, 0, movedItem);

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setEvents(updatedEvents);
        setIsChecked(false);
    };

    const handleCheck = () => {
        const sorted = [...events].sort((a, b) => a.year - b.year);
        const correct = events.every((event, index) => event.id === sorted[index].id);

        setIsChecked(true);
        setIsCorrect(correct);

        if (correct) {
            dispatch(incrementScore(50));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.instruction}>Sort events from oldest (top) to newest (bottom)</Text>

            <View style={styles.list}>
                {events.map((item, index) => (
                    <View key={item.id} style={styles.itemContainer}>
                        <View style={styles.controls}>
                            <TouchableOpacity
                                disabled={index === 0}
                                onPress={() => moveItem(index, index - 1)}
                            >
                                <Text style={[styles.arrow, index === 0 && styles.disabled]}>▲</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                disabled={index === events.length - 1}
                                onPress={() => moveItem(index, index + 1)}
                            >
                                <Text style={[styles.arrow, index === events.length - 1 && styles.disabled]}>▼</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[
                            styles.card,
                            isChecked && isCorrect && styles.cardCorrect,
                            isChecked && !isCorrect && styles.cardWrong
                        ]}>
                            <Text style={styles.eventText}>{item.event}</Text>
                            {isChecked && <Text style={styles.yearText}>{item.year}</Text>}
                        </View>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.checkBtn, isChecked && isCorrect && styles.successBtn]}
                onPress={handleCheck}
                disabled={isChecked && isCorrect}
            >
                <Text style={styles.btnText}>
                    {isChecked ? (isCorrect ? 'Correct! (+50)' : 'Try Again') : 'Check Order'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.md,
        alignItems: 'center'
    },
    instruction: {
        color: colors.text.secondary,
        marginBottom: spacing.md,
        fontSize: 16
    },
    list: {
        width: '100%',
        gap: spacing.sm
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm
    },
    controls: {
        alignItems: 'center',
        width: 30
    },
    arrow: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: 'bold'
    },
    disabled: {
        color: colors.text.disabled,
        opacity: 0.3
    },
    card: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.md,
        borderRadius: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardCorrect: {
        borderColor: colors.success || '#4CAF50',
        backgroundColor: '#1E3E2F'
    },
    cardWrong: {
        borderColor: colors.error || '#F44336',
    },
    eventText: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: 'bold'
    },
    yearText: {
        color: colors.text.secondary,
        fontSize: 16
    },
    checkBtn: {
        marginTop: spacing.xl,
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: spacing.md,
        width: '100%',
        alignItems: 'center'
    },
    successBtn: {
        backgroundColor: colors.success || 'green'
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
