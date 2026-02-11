/**
 * Kids Role API — get user role, upgrade role
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

/** POST /api/v1/kids/auth/upgrade-role */
export const upgradeRole = async (
  targetRole: string,
): Promise<KidsApiResponse<{ role: string; success: boolean }>> => {
  return kidsApi.post<{ role: string; success: boolean }>(
    '/kids/auth/upgrade-role',
    { targetRole },
  );
};
