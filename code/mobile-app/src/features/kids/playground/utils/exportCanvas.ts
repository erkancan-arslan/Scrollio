/**
 * Export drawing paths to PNG as base64 data URL.
 * Web: draw paths on an offscreen canvas.
 * Native: use ViewShot ref.capture() (no captureRef — avoids "not a react component" / reacttag errors).
 */

import { Platform } from 'react-native';
import type { CanvasPath } from '../types/playground.types';

export type ViewShotRef = { capture: (options?: { format?: string; result?: string; width?: number; height?: number }) => Promise<string> } | null;

const CANVAS_BG = '#FFFFFF';

function drawPathsOnCanvasContext(
  ctx: CanvasRenderingContext2D,
  paths: CanvasPath[],
  width: number,
  height: number,
): void {
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const path of paths) {
    if (path.points.length < 2) continue;
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.brushSize;
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
  }
}

/**
 * On web: render paths to an offscreen canvas and return data URL.
 */
export function exportCanvasToPngWeb(
  paths: CanvasPath[],
  width: number,
  height: number,
): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  drawPathsOnCanvasContext(ctx, paths, width, height);
  return canvas.toDataURL('image/png');
}

export interface ExportCanvasToPngOptions {
  paths: CanvasPath[];
  width: number;
  height: number;
  /** Web: not used. Native: ref to ViewShot instance — call ref.current.capture() to avoid captureRef(ref) errors. */
  viewShotRef?: React.RefObject<ViewShotRef>;
}

/**
 * Returns a Promise that resolves to data URL (data:image/png;base64,...).
 * Web: draws paths to offscreen canvas. Native: calls viewShotRef.current.capture().
 */
export async function exportCanvasToPng(options: {
  paths: CanvasPath[];
  width: number;
  height: number;
  viewShotRef?: React.RefObject<ViewShotRef>;
}): Promise<string> {
  const { paths, width, height, viewShotRef } = options;

  if (Platform.OS === 'web') {
    return exportCanvasToPngWeb(paths, width, height);
  }

  const shot = viewShotRef?.current;
  if (!shot?.capture) return '';

  const uri = await shot.capture({
    format: 'png',
    result: 'data-uri',
    width,
    height,
  });
  return typeof uri === 'string' ? uri : '';
}
