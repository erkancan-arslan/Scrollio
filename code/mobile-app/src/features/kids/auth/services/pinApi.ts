/**
 * Kids PIN API — set and verify parent PIN
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

/** POST /api/v1/kids/auth/pin/set */
export const setPin = async (
  pin: string,
): Promise<KidsApiResponse<{ success: boolean }>> => {
  return kidsApi.post<{ success: boolean }>('/kids/auth/pin/set', { pin });
};

/** POST /api/v1/kids/auth/pin/verify */
export const verifyPin = async (
  pin: string,
): Promise<KidsApiResponse<{ valid: boolean }>> => {
  return kidsApi.post<{ valid: boolean }>('/kids/auth/pin/verify', { pin });
};
