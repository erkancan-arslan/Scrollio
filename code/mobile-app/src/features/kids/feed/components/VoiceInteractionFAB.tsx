/**
 * VoiceInteractionFAB — Floating action button for voice interaction
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { kidsApi } from '../../shared/utils/api';
import { kidsColors } from '../../shared/constants/colors';

interface VoiceInteractionFABProps {
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

export const VoiceInteractionFAB: React.FC<VoiceInteractionFABProps> = ({
  onAction,
}) => {
  const [isListening, setIsListening] = useState(false);
  const scale = useState(new Animated.Value(1))[0];

  const handlePress = () => {
    if (isListening) {
      // Stop listening (in a real app this would stop speech recognition)
      setIsListening(false);
      return;
    }

    // Animate press
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // In a production app, this would use Speech-to-Text.
    // For now, simulate with a prompt or demonstration:
    Alert.prompt
      ? Alert.prompt(
          'Voice Command',
          'Type a command (e.g. "next", "bookmark", "quiz")',
          async (text) => {
            if (!text) return;
            setIsListening(true);
            try {
              const res = await kidsApi.post<{ action: string; response: string; payload?: Record<string, unknown> }>(
                '/kids/voice/command',
                { command: text },
              );
              if (res.data) {
                onAction?.(res.data.action, res.data.payload);
                Alert.alert('Voice', res.data.response);
              }
            } catch {
              Alert.alert('Error', 'Could not process voice command.');
            }
            setIsListening(false);
          },
        )
      : Alert.alert(
          'Voice Commands',
          'Say: "next", "bookmark", "quiz", "missions", "profile", "draw", or "search [topic]"',
        );
  };

  return (
    <Animated.View style={[styles.fabWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.fab, isListening && styles.fabActive]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Voice command"
      >
        <Text style={styles.fabIcon}>{isListening ? '⏹' : '🎤'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: kidsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabActive: {
    backgroundColor: kidsColors.error,
  },
  fabIcon: { fontSize: 24 },
});
