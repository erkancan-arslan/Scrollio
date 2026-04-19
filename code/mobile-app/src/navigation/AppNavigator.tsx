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
import { VideoPlayerScreen } from '../features/feed';
import { KidsNavigator } from './KidsNavigator';
import { PlaygroundGameShell } from '../features/playground/platform/PlaygroundGameShell';
import { GameId } from '../features/playground/platform/types';
import { DuelLobbyScreen } from '../features/playground/screens/DuelLobbyScreen';
import { DuelGameScreen } from '../features/playground/screens/DuelGameScreen';
import { DuelRequestModal } from '../features/playground/components/DuelRequestModal';
import { AdminNavigator } from './AdminNavigator';
import { TeacherNavigator } from './TeacherNavigator';
import { ClassroomLobbyScreen } from '../features/playground/games/bil-ve-fethet-classroom/ClassroomLobbyScreen';
import { ClassroomGameScreen } from '../features/playground/games/bil-ve-fethet-classroom/ClassroomGameScreen';

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
    VideoPlayer: { videoId: string };
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

    Admin: undefined;
    Teacher: undefined;
    ClassroomLobby: { roomCode: string; isHost: boolean };
    ClassroomGame: { matchId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

                {/* Standalone video player — used when tapping a shared post in chat */}
                <Stack.Screen
                    name="VideoPlayer"
                    component={VideoPlayerScreen}
                    options={{
                        headerShown: false,
                        animation: 'fade',
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

                {/* Admin Panel */}
                <Stack.Screen
                    name="Admin"
                    component={AdminNavigator}
                    options={{ headerShown: false }}
                />

                {/* Teacher Panel */}
                <Stack.Screen
                    name="Teacher"
                    component={TeacherNavigator}
                    options={{ headerShown: false }}
                />

                {/* Classroom Game Screens */}
                <Stack.Screen
                    name="ClassroomLobby"
                    component={ClassroomLobbyScreen}
                    options={{ headerShown: false, gestureEnabled: false }}
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
