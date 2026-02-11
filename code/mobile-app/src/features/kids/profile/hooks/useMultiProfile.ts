/**
 * useMultiProfile — Manages multiple child profiles and switching
 */

import { KidsProfile } from '../types/profile.types';

const asyncNoop = async () => {};

interface UseMultiProfileReturn {
  profiles: KidsProfile[];
  activeProfile: KidsProfile | null;
  switchProfile: (profileId: string) => Promise<void>;
}

export const useMultiProfile = (): UseMultiProfileReturn => {
  return {
    profiles: [],
    activeProfile: null,
    switchProfile: asyncNoop,
  };
};
