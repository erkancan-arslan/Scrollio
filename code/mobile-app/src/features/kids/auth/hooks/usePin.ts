import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { setPinThunk, verifyPinThunk } from '../store/authSlice';

export const usePin = () => {
  const dispatch = useAppDispatch();
  const { isPinSet, isPinVerified } = useAppSelector((s) => s.kidsAuth);

  const setPin = useCallback(
    async (pin: string) => {
      await dispatch(setPinThunk(pin)).unwrap();
    },
    [dispatch],
  );

  const verifyPin = useCallback(
    async (pin: string) => {
      await dispatch(verifyPinThunk(pin)).unwrap();
    },
    [dispatch],
  );

  return {
    isPinSet,
    isPinVerified,
    setPin,
    verifyPin,
  };
};
