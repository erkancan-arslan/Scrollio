/**
 * usePinAuth — Manages parental PIN verification state from Redux
 */

import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { verifyPinThunk } from '../../auth/store/authSlice';

interface UsePinAuthReturn {
  isPinVerified: boolean;
  verifyPin: (pin: string) => Promise<void>;
}

export const usePinAuth = (): UsePinAuthReturn => {
  const dispatch = useAppDispatch();
  const isPinVerified = useAppSelector((s) => s.kidsAuth.isPinVerified);

  const verifyPin = useCallback(
    async (pin: string) => {
      await dispatch(verifyPinThunk(pin)).unwrap();
    },
    [dispatch],
  );

  return {
    isPinVerified,
    verifyPin,
  };
};
