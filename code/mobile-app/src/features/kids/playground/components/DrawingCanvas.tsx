/**
 * DrawingCanvas — Touch-based drawing surface
 * Uses React Native gesture responder for drawing paths.
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addPath } from '../store/canvasSlice';
import { kidsColors } from '../../shared/constants/colors';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width,
  height = 300,
}) => {
  const dispatch = useAppDispatch();
  const { selectedColor, brushSize } = useAppSelector((s) => s.kidsCanvas);
  const currentPath = useRef<{ x: number; y: number }[]>([]);

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      currentPath.current = [{ x: locationX, y: locationY }];
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      currentPath.current.push({ x: locationX, y: locationY });
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    if (currentPath.current.length > 0) {
      dispatch(
        addPath({
          id: `path_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          points: [...currentPath.current],
          color: selectedColor,
          brushSize,
          opacity: 1,
          createdAt: new Date().toISOString(),
        }),
      );
      currentPath.current = [];
    }
  }, [dispatch, selectedColor, brushSize]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouchStart,
      onPanResponderMove: handleTouchMove,
      onPanResponderRelease: handleTouchEnd,
    }),
  ).current;

  return (
    <View
      style={[styles.canvas, { height }, width ? { width } : {}]}
      {...panResponder.panHandlers}
    >
      {/* In a production app, this would render SVG/Canvas paths.
          For now, we capture touch data and store paths in Redux. */}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: kidsColors.border,
    overflow: 'hidden',
  },
});
