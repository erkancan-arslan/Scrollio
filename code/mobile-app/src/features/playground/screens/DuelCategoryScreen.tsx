import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

type DuelCategoryScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'DuelCategory'>;
};

const GAMES = [
    {
        id: 'number_duel',
        name: 'Number Duel',
        description: 'Quickest calculation wins.',
        icon: 'calculator-outline',
        route: 'NumberDuel',
        isReady: false
    }
];

export const DuelCategoryScreen: React.FC<DuelCategoryScreenProps> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Duel Arena</Text>
            </View>
            <View style={styles.content}>
                {GAMES.map(game => (
                    <TouchableOpacity
                        key={game.id}
                        style={[styles.card, !game.isReady && styles.disabledCard]}
                        onPress={() => game.isReady ? navigation.navigate(game.route as any) : alert('Coming Soon!')}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={game.icon as any} size={28} color={game.isReady ? colors.primary : colors.text.secondary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.gameTitle}>{game.name}</Text>
                            <Text style={styles.gameDesc}>{game.description}</Text>
                        </View>
                        {!game.isReady && <View style={styles.badge}><Text style={styles.badgeText}>SOON</Text></View>}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
    },
    backButton: {
        padding: spacing.sm,
        marginRight: spacing.sm
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    content: {
        padding: spacing.md,
        gap: spacing.md
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.md,
        borderRadius: spacing.md,
        borderWidth: 1,
        borderColor: colors.border
    },
    disabledCard: {
        opacity: 0.6
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md
    },
    textContainer: {
        flex: 1
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary
    },
    gameDesc: {
        fontSize: 14,
        color: colors.text.secondary
    },
    badge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold'
    }
});
