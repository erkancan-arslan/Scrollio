/**
 * useActivityMonitor — Manages activity log data and refresh
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { fetchActivityThunk } from '../store/parentalSlice';

interface ActivityEntry {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseActivityMonitorReturn {
  activities: ActivityEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useActivityMonitor = (): UseActivityMonitorReturn => {
  const dispatch = useAppDispatch();
  const activities = useAppSelector((s) => s.kidsParental.activities);
  const isLoading = useAppSelector((s) => s.kidsParental.isLoading);

  const refresh = useCallback(async () => {
    await dispatch(fetchActivityThunk()).unwrap();
  }, [dispatch]);

  return {
    activities,
    isLoading,
    refresh,
  };
};
