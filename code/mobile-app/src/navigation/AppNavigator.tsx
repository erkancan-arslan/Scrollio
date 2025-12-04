import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../features/home/screens/HomeScreen';
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
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Scrollio' }} />
                <Stack.Screen name="Playground" component={PlaygroundScreen} options={{ title: 'Playground' }} />
                <Stack.Screen name="TicTacToe" component={TicTacToeScreen} options={{ title: 'Tic-Tac-Toe' }} />
                <Stack.Screen name="FourInARow" component={FourInARowScreen} options={{ title: '4-in-a-row' }} />
                {/* Placeholders for new games - will be replaced with actual components as they are implemented */}
                <Stack.Screen name="RockPaperScissors" component={RockPaperScissorsScreen} options={{ title: 'Rock Paper Scissors' }} />
                <Stack.Screen name="WordGuess" component={WordGuessScreen} options={{ title: 'Word Guess' }} />
                <Stack.Screen name="MemoryMatch" component={MemoryMatchScreen} options={{ title: 'Memory Match' }} />
                <Stack.Screen name="NumberGuess" component={NumberGuessScreen} options={{ title: 'Number Guess' }} />
                <Stack.Screen name="Battleship" component={BattleshipScreen} options={{ title: 'Battleship' }} />
                <Stack.Screen name="TinyGeoGuess" component={TinyGeoGuessScreen} options={{ title: 'Tiny GeoGuess' }} />
                <Stack.Screen name="TurkishWordle" component={TurkishWordleScreen} options={{ title: 'Türkçe Wordle' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
