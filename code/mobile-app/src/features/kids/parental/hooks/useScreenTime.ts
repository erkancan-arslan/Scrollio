/**
 * useScreenTime — Manages screen time rules and usage
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { fetchScreenTimeThunk, updateScreenTimeThunk } from '../store/parentalSlice';

interface ScreenTimeData {
  dailyLimitMinutes: number;
  usedMinutesToday: number;
  remainingMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  isLimitReached: boolean;
}

interface UseScreenTimeReturn {
  screenTime: ScreenTimeData | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateRules: (data: { dailyLimitMinutes: number; allowedStartTime?: string; allowedEndTime?: string }) => Promise<void>;
}

export const useScreenTime = (): UseScreenTimeReturn => {
  const dispatch = useAppDispatch();
  const screenTime = useAppSelector((s) => s.kidsParental.screenTime);
  const isLoading = useAppSelector((s) => s.kidsParental.isLoading);

  const refresh = useCallback(async () => {
    await dispatch(fetchScreenTimeThunk()).unwrap();
  }, [dispatch]);

  const updateRules = useCallback(
    async (data: { dailyLimitMinutes: number; allowedStartTime?: string; allowedEndTime?: string }) => {
      await dispatch(updateScreenTimeThunk(data)).unwrap();
    },
    [dispatch],
  );

  return {
    screenTime,
    isLoading,
    refresh,
    updateRules,
  };
};
