/**
 * Kids Auth API — login, register, getMe, signOut
 * All calls go through the kidsApi client which handles auth headers.
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

export interface KidsAuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export interface KidsAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface LoginResponse {
  user: KidsAuthUser;
  session: KidsAuthSession;
  role: string;
  isPinSet: boolean;
}

export interface RegisterResponse {
  user: KidsAuthUser;
  session: KidsAuthSession;
  role: string;
}

export interface MeResponse {
  profile: Record<string, unknown> | null;
  roles: string[];
  primaryRole: string;
  isPinSet: boolean;
}

/** POST /api/v1/kids/auth/login */
export const signIn = async (
  email: string,
  password: string,
): Promise<KidsApiResponse<LoginResponse>> => {
  return kidsApi.post<LoginResponse>('/kids/auth/login', { email, password }, false);
};

/** POST /api/v1/kids/auth/register */
export const signUp = async (
  email: string,
  password: string,
  displayName: string,
): Promise<KidsApiResponse<RegisterResponse>> => {
  return kidsApi.post<RegisterResponse>(
    '/kids/auth/register',
    { email, password, displayName },
    false,
  );
};

/** Sign out — clears local session only (Core's backend handles Supabase signOut) */
export const signOut = async (): Promise<void> => {
  // Session cleanup is handled by the thunk/store, no backend call needed
  // because the JWT is stateless and Supabase handles token invalidation.
};

/** GET /api/v1/kids/auth/me */
export const getMe = async (): Promise<KidsApiResponse<MeResponse>> => {
  return kidsApi.get<MeResponse>('/kids/auth/me');
};
