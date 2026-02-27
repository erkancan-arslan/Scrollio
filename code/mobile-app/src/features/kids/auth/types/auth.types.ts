import { UserRole } from '../../shared/types';
import type { ChildProfile } from '../../shared/types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
}

export interface AuthState {
  session: AuthSession | null;
  userRole: UserRole;
  activeChildProfileId: string | null;
  /** Set right before navigating to CharacterSelect; used as fallback when route params are missing */
  characterSelectChildId: string | null;
  childProfiles: ChildProfile[];
  isPinSet: boolean;
  isPinVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PinState {
  isPinSet: boolean;
  isPinVerified: boolean;
  attemptsRemaining: number;
  lockedUntil: string | null;
}
