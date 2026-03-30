/**
 * Draw a 2D mascot; on submit kicks off async mascot pipeline (placeholder or future API).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch } from '../../../../store/hooks';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';
import { startCustomMascotGeneration } from '../store/mascotSlice';
import { MascotDrawingCanvas } from '../components/MascotDrawingCanvas';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

type Nav = StackNavigationProp<KidsStackParamList, 'KidsMascotDraw'>;

export const KidsMascotDrawScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  const handleCapture = (imageBase64DataUrl: string) => {
    dispatch(startCustomMascotGeneration({ imageBase64DataUrl: imageBase64DataUrl }));
    navigation.navigate('KidsYourMascot');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Draw your mascot</Text>
        <Text style={styles.subtitle}>
          Use your finger to draw a character. We&apos;ll turn it into a 3D-style mascot and a short
          video.
        </Text>
        <View style={styles.card}>
          <MascotDrawingCanvas onCapture={handleCapture} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kidsColors.background },
  content: { flex: 1, padding: 20, paddingBottom: 24 },
  title: { ...kidsTypography.heading2, color: kidsColors.text.primary, marginBottom: 8 },
  subtitle: { ...kidsTypography.bodySmall, color: kidsColors.text.muted, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
});
