import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, spacing, typography } from '../../../theme';

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Scrollio</Text>
            <Text style={styles.subtitle}>Micro-Learning & Fun</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Go to Playground"
                    onPress={() => navigation.navigate('Playground')}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    title: {
        fontSize: typography.fontSize.display,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.fontSize.xl,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
    },
    buttonContainer: {
        marginTop: spacing.xl,
        width: '100%',
    },
});
