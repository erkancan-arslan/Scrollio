import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { verifyPinThunk, fetchChildrenThunk } from '../store/authSlice';
import { PinPad } from '../components/PinPad';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';
import { store } from '../../../../store/store';

const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 30;

export const KidsPinEntryScreen: React.FC = () => {
  const nav = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error, isPinVerified } = useAppSelector((s) => s.kidsAuth);

  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setAttempts(0);
          setLocalError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (cooldown > 0) return;

      try {
        const result = await dispatch(verifyPinThunk(pin)).unwrap();
        if (result.valid) {
          // Fetch children and navigate — always show child selector (Netflix-style)
          await dispatch(fetchChildrenThunk()).catch(() => {});
          const st = store.getState().kidsAuth;
          const next = st.childProfiles.length === 0 ? 'KidsCreateChild' : 'KidsChildSelector';
          nav.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: next }] }),
          );
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);

          if (newAttempts >= MAX_ATTEMPTS) {
            setCooldown(COOLDOWN_SECONDS);
            setLocalError(`Too many attempts. Try again in ${COOLDOWN_SECONDS} seconds.`);
          } else {
            setLocalError(
              `Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
            );
          }
        }
      } catch {
        setLocalError('Failed to verify PIN. Please try again.');
      }
    },
    [dispatch, attempts, cooldown, nav],
  );

  if (isPinVerified) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {cooldown > 0 ? (
        <View style={styles.cooldownContainer}>
          <Text style={styles.cooldownEmoji}>⏳</Text>
          <Text style={styles.cooldownTitle}>Too many attempts</Text>
          <Text style={styles.cooldownText}>
            Please wait {cooldown} seconds before trying again
          </Text>
        </View>
      ) : (
        <PinPad
          title="Enter Parent PIN"
          subtitle="Enter your 4-digit PIN to continue"
          onComplete={handlePinComplete}
          error={localError || error}
          isLoading={isLoading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kidsColors.background,
  },
  cooldownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cooldownEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  cooldownTitle: {
    ...kidsTypography.heading2,
    color: kidsColors.text.primary,
    marginBottom: 8,
  },
  cooldownText: {
    ...kidsTypography.body,
    color: kidsColors.text.secondary,
    textAlign: 'center',
  },
});
