/**
 * Scrollio - Main Application Entry Point
 * Architecture: brain/01-architecture/system-architecture.md
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { colors, spacing, typography } from './src/theme';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scrollio</Text>
        <Text style={styles.subtitle}>Micro-Learning Mobile App</Text>
        <Text style={styles.description}>
          Transform passive scrolling into measurable learning progress
        </Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>✅ React Native + Expo</Text>
          <Text style={styles.statusText}>✅ TypeScript</Text>
          <Text style={styles.statusText}>✅ Theme System</Text>
          <Text style={styles.statusText}>⏳ Redux Toolkit (installing...)</Text>
          <Text style={styles.statusText}>⏳ Supabase Client (installing...)</Text>
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statusBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.lg,
    borderRadius: spacing.sm,
    width: '100%',
    marginTop: spacing.lg,
  },
  statusText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
});
