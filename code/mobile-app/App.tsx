/**
 * Scrollio - Main Application Entry Point
 * Architecture: brain/01-architecture/system-architecture.md
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { initializeGameRegistry } from './src/features/playground/registryInit';
import { syncSupabaseSessionFromStorage } from './src/services/supabase/client';

// Initialize game registry before app renders
initializeGameRegistry();

export default function App() {
  // Push any persisted session from secureStorage into the Supabase JS client
  // on cold start. The app signs in via the backend REST endpoint and only
  // writes tokens to secureStorage, so without this the Supabase client stays
  // unauthenticated on already-signed-in devices and realtime channels (used
  // by the social / chat features) silently get nothing because of RLS.
  useEffect(() => {
    void syncSupabaseSessionFromStorage();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </Provider>
  );
}
