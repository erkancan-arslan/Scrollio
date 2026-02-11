/**
 * useCanvas — Manages drawing canvas paths and undo/redo state
 */

import { CanvasPath } from '../types/playground.types';

const noop = () => {};

interface UseCanvasReturn {
  paths: CanvasPath[];
  addPath: (path: CanvasPath) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useCanvas = (): UseCanvasReturn => {
  return {
    paths: [],
    addPath: noop,
    undo: noop,
    redo: noop,
    clear: noop,
  };
};
