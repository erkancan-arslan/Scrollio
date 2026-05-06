/**
 * Drawing surface for custom mascot — same mechanics as scrollio-kids-demo-rn/ScrollioKidsDemo
 * (PanResponder + SVG paths + ViewShot capture). Demo folder left untouched; patterns only.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };

const COLORS = [
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
];

const ERASER = '#ffffff';
const CANVAS_W = 340;
const CANVAS_H = 280;

function strokeToPathD(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) d += ` L ${p.x} ${p.y}`;
  return d;
}

export type MascotDrawingCanvasProps = {
  /** Called with data:image/png;base64,... */
  onCapture: (dataUrl: string) => void;
  /** When true, locks the drawing surface and shows a loading indicator on the submit button. */
  disabled?: boolean;
  /** Optional override for the submit button label (e.g. "Create mentor"). */
  submitLabel?: string;
};

function exportStrokesToPngWeb(
  strokes: Stroke[],
  width: number,
  height: number,
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const s of strokes) {
    if (s.points.length === 0) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

export const MascotDrawingCanvas: React.FC<MascotDrawingCanvasProps> = ({
  onCapture,
  disabled = false,
  submitLabel,
}) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const viewShotRef = useRef<ViewShot | null>(null);

  const effectiveColor = isEraser ? ERASER : brushColor;
  const effectiveWidth = isEraser ? brushSize * 3 : brushSize;

  const appendPoint = useCallback(
    (x: number, y: number) => {
      setCurrent((prev) => {
        if (!prev) {
          return { points: [{ x, y }], color: effectiveColor, width: effectiveWidth };
        }
        return { ...prev, points: [...prev.points, { x, y }] };
      });
    },
    [effectiveColor, effectiveWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (e) => {
          const x = e.nativeEvent.locationX;
          const y = e.nativeEvent.locationY;
          setCurrent({
            points: [{ x, y }],
            color: effectiveColor,
            width: effectiveWidth,
          });
        },
        onPanResponderMove: (e) => {
          appendPoint(e.nativeEvent.locationX, e.nativeEvent.locationY);
        },
        onPanResponderRelease: () => {
          setCurrent((prev) => {
            if (prev && prev.points.length > 0) {
              setStrokes((s) => [...s, prev]);
            }
            return null;
          });
        },
      }),
    [appendPoint, effectiveColor, effectiveWidth],
  );

  const handleUndo = () => setStrokes((s) => s.slice(0, -1));
  const clearCanvas = () => {
    setStrokes([]);
    setCurrent(null);
  };

  const captureDataUrl = async (): Promise<string> => {
    // react-native-view-shot's captureRef doesn't run on web — render the
    // strokes onto an offscreen HTMLCanvas instead so the web build can
    // submit a real PNG data URL.
    if (Platform.OS === 'web') {
      return exportStrokesToPngWeb(strokes, CANVAS_W, CANVAS_H);
    }
    if (!viewShotRef.current) throw new Error('Canvas not ready');
    const base64 = await captureRef(viewShotRef, {
      format: 'png',
      quality: 1,
      result: 'base64',
    });
    return `data:image/png;base64,${base64}`;
  };

  const handleCreateMascot = async () => {
    if (disabled) return;
    try {
      const dataUrl = await captureDataUrl();
      if (!dataUrl) {
        // eslint-disable-next-line no-console
        console.warn('MascotDrawingCanvas: capture returned empty data URL');
        return;
      }
      onCapture(dataUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('MascotDrawingCanvas capture failed', err);
    }
  };

  const allPaths = [...strokes, ...(current ? [current] : [])];
  const canSubmit = !disabled && (strokes.length > 0 || (current !== null && (current?.points.length ?? 0) > 0));

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarLabel}>Colors</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                setBrushColor(c);
                setIsEraser(false);
              }}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                brushColor === c && !isEraser && styles.colorDotActive,
              ]}
            />
          ))}
          <Pressable
            onPress={() => setIsEraser(!isEraser)}
            style={[styles.colorDot, styles.eraserDot, isEraser && styles.colorDotActive]}
          >
            <Text style={styles.eraserIcon}>⌫</Text>
          </Pressable>
        </View>
        <Text style={styles.muted}>{isEraser ? 'Eraser size' : 'Brush'}: {brushSize}</Text>
        <View style={styles.sizeRow}>
          {[1, 4, 8, 12, 16, 20].map((n) => (
            <Pressable key={n} onPress={() => setBrushSize(n)} style={styles.tick}>
              <View style={[styles.tickInner, brushSize === n && styles.tickActive]} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.rowBetween}>
        <Pressable onPress={handleUndo} disabled={strokes.length === 0 || disabled} style={styles.smallBtn}>
          <Text style={[styles.smallBtnText, (strokes.length === 0 || disabled) && styles.disabled]}>Undo</Text>
        </Pressable>
        <Pressable onPress={clearCanvas} disabled={disabled} style={styles.smallBtn}>
          <Text style={[styles.smallBtnText, disabled && styles.disabled]}>Clear</Text>
        </Pressable>
      </View>

      <View
        style={[styles.canvasOuter, { width: CANVAS_W, height: CANVAS_H }]}
        {...panResponder.panHandlers}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'base64' }}
          style={{ width: CANVAS_W, height: CANVAS_H, backgroundColor: '#ffffff' }}
        >
          <Svg width={CANVAS_W} height={CANVAS_H}>
            {allPaths.map((s, i) => (
              <Path
                key={`${i}-${s.points.length}`}
                d={strokeToPathD(s.points)}
                stroke={s.color}
                strokeWidth={s.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        </ViewShot>
      </View>

      <Text style={styles.hint}>Draw your mascot, then tap the button below.</Text>

      <Pressable
        onPress={handleCreateMascot}
        disabled={!canSubmit}
        style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
      >
        <Text style={styles.primaryBtnText}>
          {disabled ? 'Uploading…' : submitLabel ?? 'Create mascot'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  toolbar: { marginBottom: 8 },
  toolbarLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorDotActive: { borderColor: '#FF6B35', transform: [{ scale: 1.08 }] },
  eraserDot: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  eraserIcon: { fontSize: 12, color: '#4b5563' },
  muted: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tick: { padding: 4 },
  tickInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5e7eb' },
  tickActive: { backgroundColor: '#FF6B35' },
  rowBetween: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  smallBtnText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  disabled: { opacity: 0.35 },
  canvasOuter: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hint: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 10, marginBottom: 12 },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
