import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { fetchChildrenThunk, createChildThunk, switchChildThunk } from '../store/authSlice';
import type { ChildProfile } from '../../shared/types';

export const useChildProfiles = () => {
  const dispatch = useAppDispatch();
  const childProfiles = useAppSelector((s) => s.kidsAuth.childProfiles);
  const activeChildProfileId = useAppSelector((s) => s.kidsAuth.activeChildProfileId);
  const activeChild = childProfiles.find((c) => c.id === activeChildProfileId) ?? null;

  const fetchChildren = useCallback(async () => {
    await dispatch(fetchChildrenThunk()).unwrap();
  }, [dispatch]);

  const createChild = useCallback(
    async (data: { displayName: string; dateOfBirth?: string; avatarConfig?: Record<string, unknown> }) => {
      await dispatch(createChildThunk(data)).unwrap();
    },
    [dispatch],
  );

  const switchChild = useCallback(
    async (childId: string) => {
      await dispatch(switchChildThunk(childId)).unwrap();
    },
    [dispatch],
  );

  return {
    children: childProfiles,
    activeChild,
    activeChildId: activeChildProfileId,
    fetchChildren,
    createChild,
    switchChild,
  };
};
