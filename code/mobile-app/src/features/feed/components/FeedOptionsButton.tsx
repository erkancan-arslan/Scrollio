/**
 * FeedOptionsButton Component
 * Floating options button with mute and auto-advance toggles
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface FeedOptionsButtonProps {
  isMuted: boolean;
  autoAdvance: boolean;
  onToggleMute: () => void;
  onToggleAutoAdvance: () => void;
}

export const FeedOptionsButton: React.FC<FeedOptionsButtonProps> = ({
  isMuted,
  autoAdvance,
  onToggleMute,
  onToggleAutoAdvance,
}) => {
  const insets = useSafeAreaInsets();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      {/* Floating Options Button */}
      <TouchableOpacity
        style={[styles.optionsButton, { top: insets.top + 12 }]}
        onPress={() => setShowOptions(true)}
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
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Playback Options</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Mute Toggle */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                onToggleMute();
              }}
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
              <View style={[styles.toggle, isMuted && styles.toggleActive]}>
                <View
                  style={[styles.toggleDot, isMuted && styles.toggleDotActive]}
                />
              </View>
            </TouchableOpacity>

            {/* Auto-Advance Toggle */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                onToggleAutoAdvance();
              }}
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
              <View style={[styles.toggle, autoAdvance && styles.toggleActive]}>
                <View
                  style={[
                    styles.toggleDot,
                    autoAdvance && styles.toggleDotActive,
                  ]}
                />
              </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
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
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
});

