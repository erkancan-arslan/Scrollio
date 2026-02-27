import React, { useEffect } from 'react';
import { NavigationContainer, NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppLandingScreen } from '../features/auth/screens/AppLandingScreen';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { OnboardingUsernameScreen } from '../features/auth/screens/OnboardingUsernameScreen';
import { OnboardingInterestsScreen } from '../features/auth/screens/OnboardingInterestsScreen';
import { OnboardingDifficultyScreen } from '../features/auth/screens/OnboardingDifficultyScreen';
import { MainTabNavigator, MainTabParamList } from './MainTabNavigator';
import { ChatScreen } from '../features/chat';
import { KidsNavigator } from './KidsNavigator';
import { PlaygroundGameShell } from '../features/playground/platform/PlaygroundGameShell';
import { GameId } from '../features/playground/platform/types';
import { DuelLobbyScreen } from '../features/playground/screens/DuelLobbyScreen';
import { DuelGameScreen } from '../features/playground/screens/DuelGameScreen';
import { DuelRequestModal } from '../features/playground/components/DuelRequestModal';
import { ClassroomLobbyScreen } from '../features/playground/games/bil-ve-fethet-classroom/ClassroomLobbyScreen';
import { ClassroomGameScreen } from '../features/playground/games/bil-ve-fethet-classroom/ClassroomGameScreen';
import { ClassroomMenuScreen } from '../features/playground/games/bil-ve-fethet-classroom/ClassroomMenuScreen';

export type RootStackParamList = {
    AppLanding: undefined;
    SignIn: undefined;
    SignUp: undefined;
    OnboardingUsername: undefined;
    OnboardingInterests: undefined;
    OnboardingDifficulty: { topics: string[] };
    Kids: undefined; // Scrollio Kids (7–12) — separate auth flow
    MainTabs: NavigatorScreenParams<MainTabParamList>;
    Home: undefined; // Keep for backwards compatibility
    Chat: {
        conversationId: string;
        otherUserId: string;
        otherUserName: string;
        otherUserAvatar?: string;
    };
    Playground: undefined;

    // Generic Game Shell Route
    GameShell: {
        gameId: GameId;
        config?: any;
    };

    // Duel Routes
    DuelLobby: {
        requestId: string;
        opponentName: string;
    };
    DuelGame: {
        matchId: string;
        opponentName: string;
        opponentAvatar: string | null;
        role: 'A' | 'B';
        seed: number;
        questionSetId: string;
        bankVersion: string;
        playerAId: string;
        playerBId: string;
    };

    ClassroomMenu: undefined;
    ClassroomLobby: {
        roomCode: string;
        isHost: boolean;
    };
    ClassroomGame: {
        matchId: string;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Standalone wrapper for ClassroomMenuScreen to work as a navigation target */
const ClassroomMenuWrapper: React.FC = () => {
    const navigation = useNavigation();
    return <ClassroomMenuScreen onExit={() => navigation.goBack()} />;
};

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="AppLanding"
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Landing — choose Core vs Kids */}
                <Stack.Screen
                    name="AppLanding"
                    component={AppLandingScreen}
                />

                {/* Auth Screens */}
                <Stack.Screen
                    name="SignIn"
                    component={SignInScreen}
                />
                <Stack.Screen
                    name="SignUp"
                    component={SignUpScreen}
                />

                {/* Onboarding Screens (new users only) */}
                <Stack.Screen
                    name="OnboardingUsername"
                    component={OnboardingUsernameScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                    name="OnboardingInterests"
                    component={OnboardingInterestsScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                    name="OnboardingDifficulty"
                    component={OnboardingDifficultyScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                />

                <Stack.Screen
                    name="Kids"
                    component={KidsNavigator}
                    options={{ headerShown: false, gestureEnabled: false }}
                />

                {/* Main App with Bottom Tabs */}
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabNavigator}
                    options={{
                        headerShown: false,
                        gestureEnabled: false, // Prevent swipe back to auth screens
                    }}
                />

                {/* Additional Screens (accessible from anywhere) */}
                <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{
                        headerShown: true,
                        headerTitle: 'Chat',
                        headerBackTitle: 'Back',
                    }}
                />

                {/* Game Screens */}
                <Stack.Screen
                    name="GameShell"
                    component={PlaygroundGameShell}
                    options={{ headerShown: false }}
                />

                {/* Duel Screens */}
                <Stack.Screen
                    name="DuelLobby"
                    component={DuelLobbyScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DuelGame"
                    component={DuelGameScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                />

                {/* Classroom Game Screens */}
                <Stack.Screen
                    name="ClassroomMenu"
                    component={ClassroomMenuWrapper}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ClassroomLobby"
                    component={ClassroomLobbyScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ClassroomGame"
                    component={ClassroomGameScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
                />
            </Stack.Navigator>

            {/* Global overlay for incoming duel requests */}
            <DuelRequestModal />
        </NavigationContainer>
    );
};
