import { useAppSelector } from '../../../../store/hooks';
import type { ChildProfile } from '../types';

/**
 * Hook that provides the currently active child profile from Redux.
 * Use this in any Kids screen/component that needs child context.
 */
export const useActiveChild = (): {
  childId: string | null;
  childProfile: ChildProfile | null;
  childProfiles: ChildProfile[];
} => {
  const activeChildProfileId = useAppSelector(
    (state) => state.kidsAuth.activeChildProfileId,
  );
  const childProfiles = useAppSelector(
    (state) => state.kidsAuth.childProfiles,
  );

  const childProfile =
    childProfiles.find((c) => c.id === activeChildProfileId) ?? null;

  return {
    childId: activeChildProfileId,
    childProfile,
    childProfiles,
  };
};
