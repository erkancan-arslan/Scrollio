/**
 * useSwipe — Manages swipe gesture state and callbacks
 */

const noop = () => {};

interface UseSwipeReturn {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

export const useSwipe = (): UseSwipeReturn => {
  return {
    onSwipeLeft: noop,
    onSwipeRight: noop,
    onSwipeUp: noop,
  };
};
