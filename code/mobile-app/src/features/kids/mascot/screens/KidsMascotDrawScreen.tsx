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
import { CommonActions, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import type { KidsStackParamList } from '../../../../navigation/KidsNavigator';
import { startCustomMascotGeneration } from '../store/mascotSlice';
import { startFromCanvasThunk } from '../../drawing-video/store/drawingVideoSlice';
import { MascotDrawingCanvas } from '../components/MascotDrawingCanvas';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

type Nav = StackNavigationProp<KidsStackParamList, 'KidsMascotDraw'>;
type DrawRoute = RouteProp<KidsStackParamList, 'KidsMascotDraw'>;

export const KidsMascotDrawScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DrawRoute>();
  const dispatch = useAppDispatch();
  const mascotStatus = useAppSelector((s) => s.kidsMascot.status);
  const mode = route.params?.mode ?? 'mascot';

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disable swipe-back gesture while a capture/upload is in progress; also
  // give each mode its own header title so the kid sees consistent copy.
  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isSubmitting,
      headerTitle: mode === 'drawingVideo' ? 'Draw your mentor' : 'Draw mascot',
    });
  }, [navigation, isSubmitting, mode]);

  // If the global state is already generating (another instance started this),
  // auto-navigate to the result screen to avoid duplicated submissions
  useEffect(() => {
    if (mode === 'mascot' && mascotStatus === 'generating') {
      navigation.navigate('KidsYourMascot');
    }
  }, [mascotStatus, navigation, mode]);

  const handleCapture = async (imageBase64DataUrl: string) => {
    if (isSubmitting) return; // guard double-tap
    setIsSubmitting(true);
    try {
      if (mode === 'drawingVideo') {
        // Drawing → 24h-pinned mentor video, with the 48h cycle resetting on
        // pipeline completion. After kicking off, send the kid back to Feed
        // so they see the overlay flip into "Creating…" state.
        const result = await dispatch(
          startFromCanvasThunk({ imageBase64DataUrl }),
        );
        if (startFromCanvasThunk.rejected.match(result)) {
          setIsSubmitting(false);
          Alert.alert(
            'Something went wrong',
            (result.payload as string | undefined) ??
              'Could not start the video. Please try again.',
          );
          return;
        }
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'KidsMainTabs' }] }),
        );
        return;
      }

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

  const subtitle =
    mode === 'drawingVideo'
      ? "Draw the mentor you'd like, then tap Create. We'll make a Pixar-style picture and a video where they say hi to you!"
      : "Draw your character below, then tap Create mascot. We'll turn it into a 3D-style mascot and a short video!";

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.card}>
          <MascotDrawingCanvas
            onCapture={handleCapture}
            disabled={isSubmitting}
            submitLabel={mode === 'drawingVideo' ? 'Create mentor video' : 'Create mascot'}
          />
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: kidsColors.border,
    flex: 1,
  },
});
