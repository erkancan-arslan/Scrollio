/**
 * Scrollio - Main Application Entry Point
 * Architecture: brain/01-architecture/system-architecture.md
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { initializeGameRegistry } from './src/features/playground/registryInit';

// Initialize game registry before app renders
initializeGameRegistry();

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </Provider>
  );
}
