/**
 * useImageCapture — Manages image capture from camera or gallery
 */

const asyncNoop = async () => {};

interface UseImageCaptureReturn {
  capturedUri: string | null;
  capture: () => Promise<void>;
}

export const useImageCapture = (): UseImageCaptureReturn => {
  return {
    capturedUri: null,
    capture: asyncNoop,
  };
};
