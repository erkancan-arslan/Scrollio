/**
 * UndoRedoControls — Undo/Redo buttons for drawing canvas
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { undoPath, redoPath } from '../store/canvasSlice';
import { kidsColors } from '../../shared/constants/colors';
import { kidsTypography } from '../../shared/constants/typography';

export const UndoRedoControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const { paths, undonePathsCount } = useAppSelector((s) => ({
    paths: s.kidsCanvas.paths,
    undonePathsCount: s.kidsCanvas.undonePaths?.length ?? 0,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, paths.length === 0 && styles.buttonDisabled]}
        onPress={() => dispatch(undoPath())}
        disabled={paths.length === 0}
        accessibilityRole="button"
        accessibilityLabel="Undo"
      >
        <Text style={[styles.buttonText, paths.length === 0 && styles.textDisabled]}>↩ Undo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, undonePathsCount === 0 && styles.buttonDisabled]}
        onPress={() => dispatch(redoPath())}
        disabled={undonePathsCount === 0}
        accessibilityRole="button"
        accessibilityLabel="Redo"
      >
        <Text style={[styles.buttonText, undonePathsCount === 0 && styles.textDisabled]}>Redo ↪</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: kidsColors.border,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { ...kidsTypography.bodySmall, color: kidsColors.text.primary, fontWeight: '600' },
  textDisabled: { color: kidsColors.text.muted },
});
