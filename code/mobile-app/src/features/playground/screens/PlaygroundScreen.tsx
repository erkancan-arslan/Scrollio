import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PlaygroundGameShell } from '../platform/PlaygroundGameShell';
import { colors } from '../../../theme';

export const PlaygroundScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <PlaygroundGameShell gameId="infinite_flow" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
