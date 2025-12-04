import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { PlaygroundScreen } from '../features/playground/screens/PlaygroundScreen';
import { TicTacToeScreen } from '../features/playground/games/tictactoe/TicTacToeScreen';
import { FourInARowScreen } from '../features/playground/games/fourinarow/FourInARowScreen';
import { RockPaperScissorsScreen } from '../features/playground/games/rockpaperscissors/RockPaperScissorsScreen';
import { WordGuessScreen } from '../features/playground/games/wordguess/WordGuessScreen';
import { MemoryMatchScreen } from '../features/playground/games/memorymatch/MemoryMatchScreen';
import { NumberGuessScreen } from '../features/playground/games/numberguess/NumberGuessScreen';
import { BattleshipScreen } from '../features/playground/games/battleship/BattleshipScreen';
import { TinyGeoGuessScreen } from '../features/playground/games/tinygeoguess/TinyGeoGuessScreen';
import { TurkishWordleScreen } from '../features/playground/games/turkishwordle/TurkishWordleScreen';

export type RootStackParamList = {
    SignIn: undefined;
    SignUp: undefined;
    Home: undefined;
    Playground: undefined;
    TicTacToe: undefined;
    FourInARow: undefined;
    RockPaperScissors: undefined;
    WordGuess: undefined;
    MemoryMatch: undefined;
    NumberGuess: undefined;
    Battleship: undefined;
    TinyGeoGuess: undefined;
    TurkishWordle: undefined;
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

                {/* Main App Screens */}
                <Stack.Screen 
                    name="Home" 
                    component={HomeScreen} 
                    options={{ 
                        headerShown: true,
                        title: 'Scrollio',
                        headerBackVisible: false,
                    }} 
                />
                <Stack.Screen 
                    name="Playground" 
                    component={PlaygroundScreen} 
                    options={{ 
                        headerShown: true,
                        title: 'Playground' 
                    }} 
                />
                
                {/* Game Screens */}
                <Stack.Screen name="TicTacToe" component={TicTacToeScreen} options={{ headerShown: true, title: 'Tic-Tac-Toe' }} />
                <Stack.Screen name="FourInARow" component={FourInARowScreen} options={{ headerShown: true, title: '4-in-a-row' }} />
                <Stack.Screen name="RockPaperScissors" component={RockPaperScissorsScreen} options={{ headerShown: true, title: 'Rock Paper Scissors' }} />
                <Stack.Screen name="WordGuess" component={WordGuessScreen} options={{ headerShown: true, title: 'Word Guess' }} />
                <Stack.Screen name="MemoryMatch" component={MemoryMatchScreen} options={{ headerShown: true, title: 'Memory Match' }} />
                <Stack.Screen name="NumberGuess" component={NumberGuessScreen} options={{ headerShown: true, title: 'Number Guess' }} />
                <Stack.Screen name="Battleship" component={BattleshipScreen} options={{ headerShown: true, title: 'Battleship' }} />
                <Stack.Screen name="TinyGeoGuess" component={TinyGeoGuessScreen} options={{ headerShown: true, title: 'Tiny GeoGuess' }} />
                <Stack.Screen name="TurkishWordle" component={TurkishWordleScreen} options={{ headerShown: true, title: 'Türkçe Wordle' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
