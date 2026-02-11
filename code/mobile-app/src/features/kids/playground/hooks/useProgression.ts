/**
 * useProgression — Manages level, XP, and daily missions
 */

import { KidsDailyMission } from '../types/playground.types';

const asyncNoop = async () => {};

interface UseProgressionReturn {
  level: number;
  xp: number;
  missions: KidsDailyMission[];
  completeMission: (missionId: string) => Promise<void>;
}

export const useProgression = (): UseProgressionReturn => {
  return {
    level: 1,
    xp: 0,
    missions: [],
    completeMission: asyncNoop,
  };
};
