/**
 * useVideoPlayback — Controls video playback state
 */

const noop = () => {};

interface UseVideoPlaybackReturn {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
}

export const useVideoPlayback = (): UseVideoPlaybackReturn => {
  return {
    isPlaying: false,
    play: noop,
    pause: noop,
    seek: noop,
  };
};
