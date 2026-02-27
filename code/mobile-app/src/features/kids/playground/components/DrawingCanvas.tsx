/**
 * DrawingCanvas — Touch-based drawing surface with SVG rendering
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addPath } from '../store/canvasSlice';
import { kidsColors } from '../../shared/constants/colors';
import type { CanvasPath } from '../types/playground.types';

const CANVAS_BG = '#FFFFFF';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  canvasRef?: React.RefObject<View | null>;
}

function pointsToSvgD(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width = 400,
  height = 300,
  canvasRef: externalRef,
}) => {
  const dispatch = useAppDispatch();
  const { selectedColor, brushSize, isEraser, paths } = useAppSelector((s) => s.kidsCanvas);
  const currentPath = useRef<{ x: number; y: number }[]>([]);
  const [livePoints, setLivePoints] = useState<Array<{ x: number; y: number }>>([]);
  const internalRef = useRef<View>(null);
  const ref = externalRef ?? internalRef;

  const toolRef = useRef({ selectedColor, brushSize, isEraser });
  toolRef.current = { selectedColor, brushSize, isEraser };

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    currentPath.current = [{ x: locationX, y: locationY }];
    setLivePoints([{ x: locationX, y: locationY }]);
  }, []);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    currentPath.current.push({ x: locationX, y: locationY });
    setLivePoints([...currentPath.current]);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentPath.current.length > 0) {
      const { selectedColor: c, brushSize: s, isEraser: eraser } = toolRef.current;
      dispatch(
        addPath({
          id: `path_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          points: [...currentPath.current],
          color: eraser ? CANVAS_BG : c,
          brushSize: s,
          opacity: 1,
          createdAt: new Date().toISOString(),
        }),
      );
      currentPath.current = [];
      setLivePoints([]);
    }
  }, [dispatch]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouchStart,
      onPanResponderMove: handleTouchMove,
      onPanResponderRelease: handleTouchEnd,
    }),
  ).current;

  const currentPathD = livePoints.length < 2 ? null : pointsToSvgD(livePoints);

  return (
    <View
      ref={ref}
      style={[styles.canvas, { width, height }]}
      {...panResponder.panHandlers}
      accessibilityLabel="Drawing canvas"
      accessibilityRole="none"
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {paths.map((path: CanvasPath) => (
          <Path
            key={path.id}
            d={pointsToSvgD(path.points)}
            stroke={path.color}
            strokeWidth={path.brushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
        {currentPathD && (
          <Path
            d={currentPathD}
            stroke={isEraser ? CANVAS_BG : selectedColor}
            strokeWidth={brushSize}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: CANVAS_BG,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: kidsColors.border,
    overflow: 'hidden',
  },
});
