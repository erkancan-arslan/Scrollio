import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { loginThunk, registerThunk, logoutThunk } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { session, isLoading, error } = useAppSelector((s) => s.kidsAuth);

  const login = useCallback(
    async (email: string, password: string) => {
      await dispatch(loginThunk({ email, password })).unwrap();
    },
    [dispatch],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await dispatch(registerThunk({ email, password, displayName })).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk()).unwrap();
  }, [dispatch]);

  return {
    user: session,
    isAuthenticated: !!session,
    isLoading,
    error,
    login,
    register,
    logout,
  };
};
