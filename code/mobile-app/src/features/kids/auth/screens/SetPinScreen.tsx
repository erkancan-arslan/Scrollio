import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setPinThunk } from '../store/authSlice';
import { PinPad } from '../components/PinPad';
import { kidsColors } from '../../shared/constants/colors';
import { store } from '../../../../store/store';

export const KidsSetPinScreen: React.FC = () => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.kidsAuth);

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setLocalError(null);
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== firstPin) {
      setLocalError('PINs do not match. Try again.');
      setStep('enter');
      setFirstPin('');
      return;
    }

    try {
      await dispatch(setPinThunk(pin)).unwrap();
      // Navigate to child creation or selector
      const st = store.getState().kidsAuth;
      const next = st.childProfiles.length === 0 ? 'KidsCreateChild' : 'KidsChildSelector';
      nav.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: next }] }),
      );
    } catch {
      setLocalError('Failed to set PIN. Please try again.');
      setStep('enter');
      setFirstPin('');
    }
  };

  return (
    <View style={styles.container}>
      {step === 'enter' ? (
        <PinPad
          key="enter"
          title="Set a Parent PIN"
          subtitle="This PIN keeps your parental controls secure"
          onComplete={handleFirstPin}
          error={localError || error}
          isLoading={isLoading}
        />
      ) : (
        <PinPad
          key="confirm"
          title="Confirm your PIN"
          subtitle="Enter the same PIN again"
          onComplete={handleConfirmPin}
          error={localError || error}
          isLoading={isLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kidsColors.background,
  },
});
