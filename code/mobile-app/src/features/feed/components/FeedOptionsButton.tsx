/**
 * FeedOptionsButton Component
 * Floating options button with mute and auto-advance toggles
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

interface FeedOptionsButtonProps {
  isMuted: boolean;
  autoAdvance: boolean;
  onToggleMute: () => void;
  onToggleAutoAdvance: () => void;
}

const TOGGLE_WIDTH = 52;
const TOGGLE_DOT_SIZE = 24;
const TOGGLE_PADDING = 2;
const TOGGLE_DOT_TRAVEL = TOGGLE_WIDTH - TOGGLE_DOT_SIZE - TOGGLE_PADDING * 2;

const AnimatedToggle: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const translateX = useRef(new Animated.Value(isActive ? TOGGLE_DOT_TRAVEL : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isActive ? TOGGLE_DOT_TRAVEL : 0,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [isActive, translateX]);

  return (
    <View style={[styles.toggle, isActive && styles.toggleActive]}>
      <Animated.View style={[styles.toggleDot, { transform: [{ translateX }] }]} />
    </View>
  );
};

export const FeedOptionsButton: React.FC<FeedOptionsButtonProps> = ({
  isMuted,
  autoAdvance,
  onToggleMute,
  onToggleAutoAdvance,
}) => {
  const insets = useSafeAreaInsets();
  const [showOptions, setShowOptions] = useState(false);

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleMute();
  };

  const handleToggleAutoAdvance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleAutoAdvance();
  };

  return (
    <>
      {/* Floating Options Button */}
      <TouchableOpacity
        style={[styles.optionsButton, { top: insets.top + 12 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowOptions(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Quick Status Indicators */}
      <View style={[styles.statusIndicators, { top: insets.top + 12 }]}>
        {isMuted && (
          <View style={styles.statusBadge}>
            <Ionicons name="volume-mute" size={14} color="#FFFFFF" />
          </View>
        )}
        {autoAdvance && (
          <View style={styles.statusBadge}>
            <Ionicons name="play-forward" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Playback Options</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Mute Toggle */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleToggleMute}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text style={styles.optionLabel}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {isMuted ? 'Turn sound on' : 'Turn sound off'}
                  </Text>
                </View>
              </View>
              <AnimatedToggle isActive={isMuted} />
            </TouchableOpacity>

            {/* Auto-Advance Toggle */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleToggleAutoAdvance}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Ionicons
                    name={autoAdvance ? 'play-forward' : 'play-forward-outline'}
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text style={styles.optionLabel}>Auto-Advance</Text>
                  <Text style={styles.optionDescription}>
                    {autoAdvance
                      ? 'Auto-scroll to next video'
                      : 'Loop current video'}
                  </Text>
                </View>
              </View>
              <AnimatedToggle isActive={autoAdvance} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  optionsButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  statusIndicators: {
    position: 'absolute',
    right: 64,
    flexDirection: 'row',
    gap: 8,
    zIndex: 100,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 140, 66, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 48,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#FF8C42',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
});


