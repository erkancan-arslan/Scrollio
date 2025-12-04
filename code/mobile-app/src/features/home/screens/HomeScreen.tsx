import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../../theme';

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const handleSignOut = () => {
        // TODO: Implement Supabase sign out
        navigation.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
        });
    };

    return (
        <View style={styles.container}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Text style={styles.title}>Scrollio</Text>
                <Text style={styles.subtitle}>Micro-Learning & Fun</Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
                
                <TouchableOpacity 
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Playground')}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>🎮</Text>
                    </View>
                    <View style={styles.actionTextContainer}>
                        <Text style={styles.actionTitle}>Playground</Text>
                        <Text style={styles.actionDescription}>
                            Fun games to challenge your mind
                        </Text>
                    </View>
                    <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionCard, styles.actionCardDisabled]}
                    activeOpacity={0.5}
                >
                    <View style={[styles.actionIconContainer, styles.actionIconDisabled]}>
                        <Text style={styles.actionIcon}>📚</Text>
                    </View>
                    <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, styles.textDisabled]}>Learn</Text>
                        <Text style={[styles.actionDescription, styles.textDisabled]}>
                            Coming soon...
                        </Text>
                    </View>
                    <Text style={[styles.actionArrow, styles.textDisabled]}>→</Text>
                </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
            >
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
        padding: spacing.lg,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    welcomeText: {
        fontSize: typography.fontSize.md,
        color: colors.text.tertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 42,
        fontWeight: '700',
        color: colors.text.primary,
        letterSpacing: -1,
        marginTop: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.lg,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },
    actionsContainer: {
        flex: 1,
        paddingTop: spacing.lg,
    },
    sectionLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        color: colors.text.tertiary,
        letterSpacing: 1,
        marginBottom: spacing.md,
        paddingLeft: spacing.xs,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionCardDisabled: {
        opacity: 0.6,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    actionIconDisabled: {
        backgroundColor: '#F5F5F5',
    },
    actionIcon: {
        fontSize: 24,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    actionArrow: {
        fontSize: 20,
        color: colors.text.tertiary,
        marginLeft: spacing.sm,
    },
    textDisabled: {
        color: colors.text.disabled,
    },
    signOutButton: {
        alignSelf: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    signOutText: {
        fontSize: typography.fontSize.md,
        color: colors.error,
        fontWeight: '500',
    },
});
