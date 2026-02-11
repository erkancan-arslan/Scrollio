/**
 * PinSetupForm — PIN input with entry + confirmation steps
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PinPad } from './PinPad';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

interface PinSetupFormProps {
  onPinSet: (pin: string) => void;
  pinLength?: number;
  isLoading?: boolean;
}

export const PinSetupForm: React.FC<PinSetupFormProps> = ({
  onPinSet,
  pinLength = 4,
  isLoading = false,
}) => {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (pin: string) => {
    if (step === 'enter') {
      setFirstPin(pin);
      setStep('confirm');
      setError('');
    } else {
      if (pin === firstPin) {
        onPinSet(pin);
      } else {
        setError('PINs do not match. Try again.');
        setStep('enter');
        setFirstPin('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {step === 'enter' ? 'Enter a New PIN' : 'Confirm Your PIN'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 'enter'
          ? `Choose a ${pinLength}-digit PIN for parental access`
          : 'Enter the same PIN again to confirm'}
      </Text>
      <PinPad
        title={step === 'enter' ? 'Enter PIN' : 'Confirm PIN'}
        onComplete={handleSubmit}
        error={error || null}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  title: { ...kidsTypography.heading2, color: kidsColors.text.primary, textAlign: 'center' },
  subtitle: { ...kidsTypography.body, color: kidsColors.text.secondary, textAlign: 'center', marginBottom: 8 },
});
