import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

type PlaygroundScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Playground'>;
};

const CATEGORIES = [
    {
        id: 'infinite',
        name: 'Infinite Flow',
        description: 'Tinder-style rapid fire knowledge.',
        icon: 'infinite-outline',
        color: '#FF6B6B',
        route: 'InfiniteFlow',
    },
    {
        id: 'logic',
        name: 'Logic & Mind',
        description: 'Deep thinking puzzles.',
        icon: 'bulb-outline',
        color: '#4ECDC4',
        route: 'LogicCategory',
    },
    {
        id: 'visual',
        name: 'Visual Intelligence',
        description: 'Test your observation skills.',
        icon: 'eye-outline',
        color: '#FFE66D', //'#45B7D1',
        route: 'VisualCategory',
    },
    {
        id: 'challenges',
        name: 'Duel Arena',
        description: 'Challenge friends for coins.',
        icon: 'flash-outline',
        color: '#FF8C42',
        route: 'DuelCategory',
    },
];

export const PlaygroundScreen: React.FC<PlaygroundScreenProps> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Playground</Text>
                <Text style={styles.subtitle}>Train your brain, earn rewards.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.card, { borderColor: cat.color }]}
                        onPress={() => navigation.navigate(cat.route as any)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: cat.color }]}>
                            <Ionicons name={cat.icon as any} size={32} color="white" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{cat.name}</Text>
                            <Text style={styles.cardDesc}>{cat.description}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
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
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: 16,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    grid: {
        padding: spacing.md,
        gap: spacing.md,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: spacing.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: spacing.md
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: colors.text.secondary,
    },
});
