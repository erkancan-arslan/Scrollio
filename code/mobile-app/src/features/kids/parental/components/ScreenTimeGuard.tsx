import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../../../../store/hooks';
import { verifyPinThunk } from '../../auth/store/authSlice';
import { PinPad } from '../../auth/components/PinPad';
import { useScreenTime } from '../hooks/useScreenTime';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

export const ScreenTimeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { screenTime, refresh } = useScreenTime();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Poll screen time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60000);
    // Initial fetch
    refresh();
    return () => clearInterval(interval);
  }, [refresh]);

  const handlePinComplete = async (pin: string) => {
    try {
      const result = await dispatch(verifyPinThunk(pin)).unwrap();
      if (result.valid) {
        setShowPin(false);
        navigation.navigate('KidsParentalDashboard' as never);
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } catch {
      setPinError('Failed to verify PIN.');
    }
  };

  if (screenTime?.isLimitReached) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.title}>Time's Up!</Text>
          <Text style={styles.subtitle}>You've reached your screen time limit for today.</Text>
          
          <TouchableOpacity style={styles.button} onPress={() => { setShowPin(true); setPinError(null); }}>
            <Text style={styles.buttonText}>🔒 Parent Access</Text>
          </TouchableOpacity>

          <Modal visible={showPin} animationType="slide" transparent={false} onRequestClose={() => setShowPin(false)}>
            <SafeAreaView style={{ flex: 1, backgroundColor: kidsColors.background }}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPin(false)}>
                 <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
              <PinPad
                title="Parent Access"
                subtitle="Enter PIN to manage screen time"
                onComplete={handlePinComplete}
                error={pinError}
              />
            </SafeAreaView>
          </Modal>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: kidsColors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: kidsColors.background,
  },
  icon: { fontSize: 80, marginBottom: 24 },
  title: { ...kidsTypography.heading1, color: kidsColors.primary, marginBottom: 12, textAlign: 'center' },
  subtitle: { ...kidsTypography.heading3, color: kidsColors.text.secondary, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: kidsColors.secondary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 },
  buttonText: { ...kidsTypography.body, color: '#FFF', fontWeight: 'bold' },
  closeBtn: { padding: 16, alignSelf: 'flex-start' },
  closeBtnText: { ...kidsTypography.heading3, color: kidsColors.primary },
});
