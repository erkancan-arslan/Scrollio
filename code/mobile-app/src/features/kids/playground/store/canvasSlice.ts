/**
 * Kids Canvas Redux Slice
 * Manages drawing canvas state including paths, color, brush size, and undo/redo
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasPath } from '../types/playground.types';

interface CanvasState {
  paths: CanvasPath[];
  undonePaths: CanvasPath[];
  selectedColor: string;
  brushSize: number;
  isEraser: boolean;
}

const initialState: CanvasState = {
  paths: [],
  undonePaths: [],
  selectedColor: '#000',
  brushSize: 5,
  isEraser: false,
};

const canvasSlice = createSlice({
  name: 'kidsCanvas',
  initialState,
  reducers: {
    addPath(state, action: PayloadAction<CanvasPath>) {
      state.paths.push(action.payload);
      state.undonePaths = []; // clear redo stack on new path
    },
    removePath(state) {
      state.paths.pop();
    },
    undoPath(state) {
      const last = state.paths.pop();
      if (last) {
        state.undonePaths.push(last);
      }
    },
    redoPath(state) {
      const last = state.undonePaths.pop();
      if (last) {
        state.paths.push(last);
      }
    },
    clearPaths(state) {
      state.paths = [];
      state.undonePaths = [];
    },
    setSelectedColor(state, action: PayloadAction<string>) {
      state.selectedColor = action.payload;
    },
    setBrushSize(state, action: PayloadAction<number>) {
      state.brushSize = action.payload;
    },
    setEraser(state, action: PayloadAction<boolean>) {
      state.isEraser = action.payload;
    },
    resetCanvas(state) {
      state.paths = [];
      state.undonePaths = [];
      state.selectedColor = '#000';
      state.brushSize = 5;
      state.isEraser = false;
    },
  },
});

export const {
  addPath,
  removePath,
  undoPath,
  redoPath,
  clearPaths,
  setSelectedColor,
  setBrushSize,
  setEraser,
  resetCanvas,
} = canvasSlice.actions;

export default canvasSlice.reducer;
