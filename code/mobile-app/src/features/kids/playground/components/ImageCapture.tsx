/**
 * ImageCapture — Button to capture/save the current canvas as an image
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { clearPaths } from '../store/canvasSlice';
import { uploadDrawing } from '../services/drawingApi';
import { fetchProgressThunk } from '../store/progressionSlice';
import { KidsThemedButton } from '../../shared/components/KidsThemedButton';

interface ImageCaptureProps {
  onCapture?: () => void;
}

export const ImageCapture: React.FC<ImageCaptureProps> = ({ onCapture }) => {
  const dispatch = useAppDispatch();
  const paths = useAppSelector((s) => s.kidsCanvas.paths);
  const [isSaving, setIsSaving] = useState(false);

  const handleCapture = async () => {
    if (paths.length === 0) {
      Alert.alert('Empty Canvas', 'Draw something first!');
      return;
    }

    setIsSaving(true);
    const drawingData = JSON.stringify(paths);
    const res = await uploadDrawing(drawingData, `Drawing ${Date.now()}`);
    setIsSaving(false);

    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      Alert.alert('Saved!', `Drawing saved! +${res.data?.xpEarned ?? 0} XP`);
      dispatch(clearPaths());
      dispatch(fetchProgressThunk());
      onCapture?.();
    }
  };

  return (
    <View style={styles.container}>
      <KidsThemedButton
        title="Save Drawing"
        onPress={handleCapture}
        loading={isSaving}
        disabled={isSaving || paths.length === 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
