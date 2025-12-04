import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    Pressable,
} from 'react-native';
import { colors, spacing, typography } from '../../../theme';

interface AuthInputProps extends TextInputProps {
    label: string;
    error?: string;
    isPassword?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
    label,
    error,
    isPassword = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
                {label}
            </Text>
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputContainerFocused,
                error && styles.inputContainerError,
            ]}>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.text.tertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
                    {...props}
                />
                {isPassword && (
                    <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.eyeText}>
                            {showPassword ? '◉' : '◎'}
                        </Text>
                    </Pressable>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    labelFocused: {
        color: colors.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.background,
    },
    inputContainerError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md + 2,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
    },
    eyeButton: {
        paddingHorizontal: spacing.md,
    },
    eyeText: {
        fontSize: 20,
        color: colors.text.tertiary,
    },
    errorText: {
        fontSize: typography.fontSize.sm,
        color: colors.error,
        marginTop: spacing.xs,
    },
});

