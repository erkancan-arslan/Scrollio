import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { UserRole } from '../../shared/types';
import { upgradeRoleThunk } from '../store/authSlice';

export const useRole = () => {
  const dispatch = useAppDispatch();
  const userRole = useAppSelector((s) => s.kidsAuth.userRole);

  const hasRole = useCallback(
    (role: UserRole) => userRole === role,
    [userRole],
  );

  const upgradeRole = useCallback(async (targetRole = 'parent') => {
    await dispatch(upgradeRoleThunk(targetRole)).unwrap();
  }, [dispatch]);

  return {
    role: userRole ?? UserRole.USER,
    hasRole,
    upgradeRole,
  };
};
