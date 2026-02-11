/**
 * useBookmark — Manages bookmark toggle state
 */

const asyncNoop = async () => {};

interface UseBookmarkReturn {
  isBookmarked: boolean;
  toggleBookmark: () => Promise<void>;
}

export const useBookmark = (): UseBookmarkReturn => {
  return {
    isBookmarked: false,
    toggleBookmark: asyncNoop,
  };
};
