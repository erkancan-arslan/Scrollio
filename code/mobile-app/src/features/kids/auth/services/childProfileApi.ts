/**
 * Kids Child Profile API — CRUD + switch child profile
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';
import type { ChildProfile } from '../../shared/types';

/** GET /api/v1/kids/auth/children */
export const getChildren = async (): Promise<KidsApiResponse<ChildProfile[]>> => {
  return kidsApi.get<ChildProfile[]>('/kids/auth/children');
};

/** POST /api/v1/kids/auth/children */
export const createChild = async (data: {
  displayName: string;
  dateOfBirth?: string;
  avatarConfig?: Record<string, unknown>;
}): Promise<KidsApiResponse<ChildProfile>> => {
  return kidsApi.post<ChildProfile>('/kids/auth/children', data);
};

/** PATCH /api/v1/kids/auth/children/:childId */
export const updateChild = async (
  childId: string,
  data: Partial<{ displayName: string; dateOfBirth: string; avatarConfig: Record<string, unknown> }>,
): Promise<KidsApiResponse<ChildProfile>> => {
  return kidsApi.patch<ChildProfile>(`/kids/auth/children/${childId}`, data);
};

/** DELETE /api/v1/kids/auth/children/:childId */
export const deleteChild = async (
  childId: string,
): Promise<KidsApiResponse<void>> => {
  return kidsApi.delete<void>(`/kids/auth/children/${childId}`);
};

/** POST /api/v1/kids/auth/children/switch */
export const switchChild = async (
  childId: string,
): Promise<KidsApiResponse<{ childId: string; displayName: string; avatarConfig: Record<string, unknown> }>> => {
  return kidsApi.post<{ childId: string; displayName: string; avatarConfig: Record<string, unknown> }>(
    '/kids/auth/children/switch',
    { childId },
  );
};
