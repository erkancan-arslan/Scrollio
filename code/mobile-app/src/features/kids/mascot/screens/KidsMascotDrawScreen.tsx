/**
 * Draw a 2D mascot; on submit kicks off the async mascot pipeline.
 *
 * Guards:
 *  - gestureEnabled:false while submitting (prevents accidental back navigation mid-upload)
 *  - isSubmitting flag passed to canvas to lock the button during ViewShot capture
 */

import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';
import { startCustomMascotGeneration } from '../store/mascotSlice';
import { MascotDrawingCanvas } from '../components/MascotDrawingCanvas';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

type Nav = StackNavigationProp<KidsStackParamList, 'KidsMascotDraw'>;

export const KidsMascotDrawScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const mascotStatus = useAppSelector((s) => s.kidsMascot.status);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disable swipe-back gesture while a capture/upload is in progress
  useLayoutEffect(() => {
    navigation.setOptions({ gestureEnabled: !isSubmitting });
  }, [navigation, isSubmitting]);

  // If the global state is already generating (another instance started this),
  // auto-navigate to the result screen to avoid duplicated submissions
  useEffect(() => {
    if (mascotStatus === 'generating') {
      navigation.navigate('KidsYourMascot');
    }
  }, [mascotStatus, navigation]);

  const handleCapture = async (imageBase64DataUrl: string) => {
    if (isSubmitting) return; // guard double-tap
    setIsSubmitting(true);
    try {
      const result = await dispatch(
        startCustomMascotGeneration({ imageBase64DataUrl }),
      );
      // condition() in the thunk returns false if already generating — skip navigation
      if (startCustomMascotGeneration.rejected.match(result) && result.payload === 'aborted') {
        setIsSubmitting(false);
        return;
      }
      navigation.navigate('KidsYourMascot');
    } catch {
      setIsSubmitting(false);
      Alert.alert('Something went wrong', 'Could not start mascot creation. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Draw your character below, then tap <Text style={styles.highlight}>Create mascot</Text>.
          We'll turn it into a 3D-style mascot and a short video!
        </Text>
        <View style={styles.card}>
          <MascotDrawingCanvas onCapture={handleCapture} disabled={isSubmitting} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { flex: 1, padding: 16, paddingBottom: 24 },
  subtitle: {
    ...kidsTypography.bodySmall,
    color: kidsColors.text.muted,
    marginBottom: 14,
    lineHeight: 20,
  },
  highlight: { color: kidsColors.primary, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: kidsColors.border,
    flex: 1,
  },
});
