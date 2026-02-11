import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { kidsConfig } from '../../shared/constants/config';

interface PinPadProps {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  error?: string | null;
  isLoading?: boolean;
}

const PIN_LENGTH = kidsConfig.limits.pinLength;

export const PinPad: React.FC<PinPadProps> = ({
  title,
  subtitle,
  onComplete,
  error,
  isLoading = false,
}) => {
  const [pin, setPin] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Shake on error change
  React.useEffect(() => {
    if (error) {
      shake();
      setPin('');
    }
  }, [error, shake]);

  const handlePress = (digit: string) => {
    if (isLoading) return;
    if (pin.length >= PIN_LENGTH) return;

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      onComplete(newPin);
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setPin(pin.slice(0, -1));
  };

  const renderDots = () => (
    <Animated.View
      style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
    >
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < pin.length ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderKey = (value: string, onPressKey: () => void) => (
    <TouchableOpacity
      key={value}
      style={styles.key}
      onPress={onPressKey}
      activeOpacity={0.6}
      disabled={isLoading}
      accessibilityLabel={`Digit ${value}`}
      accessibilityRole="button"
    >
      <Text style={styles.keyText}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {renderDots()}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.keypad}>
        {/* Row 1-3 */}
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((d) => renderKey(d, () => handlePress(d)))}
          </View>
        ))}
        {/* Bottom row */}
        <View style={styles.keyRow}>
          <View style={styles.keyPlaceholder} />
          {renderKey('0', () => handlePress('0'))}
          <TouchableOpacity
            style={styles.key}
            onPress={handleBackspace}
            disabled={isLoading || pin.length === 0}
            accessibilityLabel="Backspace"
            accessibilityRole="button"
          >
            <Text style={styles.keyText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: kidsColors.background,
    padding: 24,
  },
  title: {
    ...kidsTypography.heading2,
    color: kidsColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dotFilled: {
    backgroundColor: kidsColors.primary,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: kidsColors.border,
  },
  error: {
    ...kidsTypography.bodySmall,
    color: kidsColors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  keypad: {
    marginTop: 24,
    width: '100%',
    maxWidth: 300,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: kidsColors.text.primary,
  },
  keyPlaceholder: {
    width: 72,
    height: 72,
    marginHorizontal: 12,
  },
});
