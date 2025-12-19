import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing } from '../../../theme';
import { useAppDispatch } from '../../../store/hooks';
import { setWager } from '../store/playgroundSlice';

interface WagerModalProps {
    visible: boolean;
    onClose: () => void;
    score: number;
}

export const WagerModal: React.FC<WagerModalProps> = ({ visible, onClose, score }) => {
    const dispatch = useAppDispatch();
    const [amount, setAmount] = useState('50');

    const handleCreateChallenge = () => {
        // In a real app, this would call an API to create the challenge
        const challengeId = 'mock_challenge_' + Math.random().toString(36).substr(2, 9);

        dispatch(setWager({
            amount: parseInt(amount) || 0,
            challengeId: challengeId
        }));

        // Close modal
        onClose();
        alert(`Challenge Created! Share code: ${challengeId}`);
    };

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Challenge a Friend</Text>
                    <Text style={styles.subtitle}>Your Score: {score}</Text>

                    <Text style={styles.label}>Wager Coins:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
                            <Text style={styles.btnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handleCreateChallenge}>
                            <Text style={styles.btnText}>Challenge!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '80%',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.md,
        padding: spacing.lg,
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.xs
    },
    subtitle: {
        fontSize: 18,
        color: colors.text.secondary,
        marginBottom: spacing.lg
    },
    label: {
        color: colors.text.primary,
        marginBottom: spacing.xs,
        alignSelf: 'flex-start'
    },
    input: {
        width: '100%',
        backgroundColor: colors.background,
        color: colors.text.primary,
        padding: spacing.md,
        borderRadius: spacing.sm,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border
    },
    buttons: {
        flexDirection: 'row',
        gap: spacing.md
    },
    btn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: spacing.sm,
    },
    cancelBtn: {
        backgroundColor: colors.error
    },
    confirmBtn: {
        backgroundColor: colors.primary
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold'
    }
});
