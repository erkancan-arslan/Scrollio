import React, { useEffect, useCallback, useLayoutEffect } from 'react';
import { BackHandler, TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import { useNavigation, CommonActions, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppDispatch } from '../../../store/hooks';
import { resetCurrentSession } from '../store/playgroundSlice';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { MainTabParamList } from '../../../navigation/MainTabNavigator';

/**
 * Hook to handle safe exit from games.
 * - Resets Redux game session state.
 * - Navigates back to 'Playground' (not Main Menu).
 * - Handles Android hardware back button.
 * - OVERRIDES default header back button to ensure cleanup runs.
 */
// Interface for hook options
interface GameExitOptions {
    onCleanup?: () => void;
    exitRoute?: string;
}

// Define combined navigation type
type GameExitNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList>,
    BottomTabNavigationProp<MainTabParamList>
>;

export const useGameExit = (options: GameExitOptions | (() => void) = {}) => {
    const navigation = useNavigation<GameExitNavigationProp>();
    const dispatch = useAppDispatch();

    // Handle both old signature (callback only) and new signature (object)
    const onCleanup = typeof options === 'function' ? options : options.onCleanup;
    const exitRoute = typeof options === 'object' ? options.exitRoute : undefined;

    const handleExit = useCallback(() => {
        console.log("Game Exit (Standard Pop)");

        if (onCleanup) {
            onCleanup();
        }

        dispatch(resetCurrentSession());

        // STANDARD NAVIGATION: goBack()
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // Safety fallback
            navigation.navigate('MainTabs', { screen: 'Playground' });
        }

        return true;
    }, [navigation, dispatch, onCleanup]);

    // Handle Android Hardware Back Button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            handleExit
        );

        return () => backHandler.remove();
    }, [handleExit]);

    // Override Navigation Header Left Button
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={handleExit}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? "chevron-back" : "arrow-back"}
                        size={24}
                        color={colors.primary || '#007AFF'}
                    />
                    {Platform.OS === 'ios' && <Text style={styles.backText} > Back </Text>}
                </TouchableOpacity>
            ),
            // Ensure gesture back also triggers cleanup if possible? 
            // Gesture back is harder to intercept without 'beforeRemove', 
            // but 'beforeRemove' prevents simple navigation.
            // Given the requirements, overriding the button is the primary fix for "unpressable/not working" UI.
        });
    }, [navigation, handleExit]);

    // Add beforeRemove listener to catch swipe back gestures too
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // If we are already going to Playground (navigated via handleExit), let it pass.
            // But if user swiped back, we need to run cleanup.

            // Check if this action serves to exit the game
            if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
                // Run cleanup
                if (onCleanup) onCleanup();
                dispatch(resetCurrentSession());
                // e.preventDefault(); // Do NOT prevent, let it happen, but we cleaned up first.
                // Actually, if we just let it happen, it mimics handleExit without the explicit navigate call.
            }
        });

        return unsubscribe;
    }, [navigation, dispatch, onCleanup]);

    return handleExit;
};

const styles = StyleSheet.create({
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: spacing.md,
        // Ensure it's not covered
        zIndex: 100,
    },
    backText: {
        marginLeft: -4, // Tighten up ios style
        fontSize: 17,
        color: colors.primary || '#007AFF'
    }
});
