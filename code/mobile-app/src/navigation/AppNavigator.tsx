import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { MainTabNavigator, MainTabParamList } from './MainTabNavigator';
import { ChatScreen } from '../features/chat';
import { PlaygroundScreen } from '../features/playground/screens/PlaygroundScreen';
import { LogicCategoryScreen } from '../features/playground/screens/LogicCategoryScreen';
import { VisualCategoryScreen } from '../features/playground/screens/VisualCategoryScreen';
import { DuelCategoryScreen } from '../features/playground/screens/DuelCategoryScreen';
import { TimelineMasterScreen } from '../features/playground/games/timelinemaster/TimelineMasterScreen';
import { MathSnakeScreen } from '../features/playground/games/mathsnake/MathSnakeScreen';
import { ZoomFocusScreen } from '../features/playground/games/zoomfocus/ZoomFocusScreen';
import { PerfectEyeScreen } from '../features/playground/games/perfecteye/PerfectEyeScreen';
import { InfiniteFlowScreen } from '../features/playground/screens/InfiniteFlowScreen';
import { KidsNavigator } from './KidsNavigator';

export type RootStackParamList = {
    SignIn: undefined;
    SignUp: undefined;
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
    LogicCategory: undefined;
    VisualCategory: undefined;
    DuelCategory: undefined;
    InfiniteFlow: undefined;
    TimelineMaster: undefined;
    MathSnake: undefined;
    ZoomFocus: undefined;
    PerfectEye: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="SignIn"
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Auth Screens */}
                <Stack.Screen
                    name="SignIn"
                    component={SignInScreen}
                />
                <Stack.Screen
                    name="SignUp"
                    component={SignUpScreen}
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
                <Stack.Screen
                    name="LogicCategory"
                    component={LogicCategoryScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="VisualCategory"
                    component={VisualCategoryScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DuelCategory"
                    component={DuelCategoryScreen}
                    options={{ headerShown: false }}
                />

                {/* Game Screens */}
                <Stack.Screen name="InfiniteFlow" component={InfiniteFlowScreen} options={{ headerShown: false, title: 'Infinite Flow' }} />
                <Stack.Screen name="TimelineMaster" component={TimelineMasterScreen} options={{ headerShown: true, title: 'Timeline Master' }} />
                <Stack.Screen name="MathSnake" component={MathSnakeScreen} options={{ headerShown: true, title: 'Math Snake' }} />
                <Stack.Screen name="ZoomFocus" component={ZoomFocusScreen} options={{ headerShown: true, title: 'Zoom & Focus' }} />
                <Stack.Screen name="PerfectEye" component={PerfectEyeScreen} options={{ headerShown: true, title: 'Perfect Eye' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
