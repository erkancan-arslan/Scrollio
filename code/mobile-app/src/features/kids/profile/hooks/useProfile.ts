/**
 * useProfile — Manages child profile data and updates
 */

import { KidsProfile } from '../types/profile.types';

const asyncNoop = async () => {};

interface UseProfileReturn {
  profile: KidsProfile | null;
  updateProfile: (data: Partial<KidsProfile>) => Promise<void>;
  updateAvatar: (config: Record<string, unknown>) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  return {
    profile: null,
    updateProfile: asyncNoop,
    updateAvatar: asyncNoop,
  };
};
