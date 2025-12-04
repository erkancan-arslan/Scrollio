import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../../../theme';

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'text';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' && styles.primaryButton,
                variant === 'secondary' && styles.secondaryButton,
                variant === 'text' && styles.textButton,
                isDisabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? colors.text.inverse : colors.primary}
                    size="small"
                />
            ) : (
                <Text
                    style={[
                        styles.buttonText,
                        variant === 'primary' && styles.primaryText,
                        variant === 'secondary' && styles.secondaryText,
                        variant === 'text' && styles.textButtonText,
                        isDisabled && styles.disabledText,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.md + 2,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    primaryButton: {
        backgroundColor: colors.text.primary,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.text.primary,
    },
    textButton: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.sm,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    primaryText: {
        color: colors.text.inverse,
    },
    secondaryText: {
        color: colors.text.primary,
    },
    textButtonText: {
        color: colors.primary,
    },
    disabledText: {
        color: colors.text.tertiary,
    },
});

