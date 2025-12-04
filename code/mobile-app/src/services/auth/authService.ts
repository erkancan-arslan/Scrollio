/**
 * Authentication Service
 * Handles all auth operations with secure token storage in Keychain
 */

import { apiClient, ApiResponse } from '../api/apiClient';
import { secureStorage } from '../storage/secureStorage';

// Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface SignUpParams {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Authentication Service
 */
class AuthService {
  private currentUser: User | null = null;

  /**
   * Sign up a new user
   */
  async signUp(params: SignUpParams): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', params, false);

    if (response.error || !response.data) {
      return { success: false, error: response.error || 'Sign up failed' };
    }

    // Store session securely in Keychain
    await secureStorage.setSession({
      accessToken: response.data.session.accessToken,
      refreshToken: response.data.session.refreshToken,
      expiresAt: response.data.session.expiresAt,
      userId: response.data.user.id,
    });

    this.currentUser = response.data.user;

    return { success: true };
  }

  /**
   * Sign in existing user
   */
  async signIn(params: SignInParams): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post<AuthResponse>('/auth/signin', params, false);

    if (response.error || !response.data) {
      return { success: false, error: response.error || 'Sign in failed' };
    }

    // Store session securely in Keychain
    await secureStorage.setSession({
      accessToken: response.data.session.accessToken,
      refreshToken: response.data.session.refreshToken,
      expiresAt: response.data.session.expiresAt,
      userId: response.data.user.id,
    });

    this.currentUser = response.data.user;

    return { success: true };
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      // Call backend to invalidate session
      await apiClient.post('/auth/signout', undefined, true);
    } catch (error) {
      // Continue with local sign out even if backend call fails
      console.warn('Backend signout failed:', error);
    }

    // Clear local session from Keychain
    await secureStorage.clearSession();
    this.currentUser = null;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    const { refreshToken } = await secureStorage.getSession();

    if (!refreshToken) {
      return false;
    }

    const response = await apiClient.post<AuthResponse>(
      '/auth/refresh',
      { refreshToken },
      false,
    );

    if (response.error || !response.data) {
      // Refresh failed, clear session
      await secureStorage.clearSession();
      this.currentUser = null;
      return false;
    }

    // Update stored session
    await secureStorage.setSession({
      accessToken: response.data.session.accessToken,
      refreshToken: response.data.session.refreshToken,
      expiresAt: response.data.session.expiresAt,
      userId: response.data.user.id,
    });

    this.currentUser = response.data.user;

    return true;
  }

  /**
   * Get current user (from memory or API)
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const hasSession = await secureStorage.hasSession();
    if (!hasSession) {
      return null;
    }

    // Check if session is expired
    const isExpired = await secureStorage.isSessionExpired();
    if (isExpired) {
      // Try to refresh
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        return null;
      }
    }

    // Fetch user from API
    const response = await apiClient.get<User>('/auth/me', true);

    if (response.error || !response.data) {
      // Token might be invalid, try refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryResponse = await apiClient.get<User>('/auth/me', true);
        if (retryResponse.data) {
          this.currentUser = retryResponse.data;
          return this.currentUser;
        }
      }
      return null;
    }

    this.currentUser = response.data;
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const hasSession = await secureStorage.hasSession();
    if (!hasSession) return false;

    const isExpired = await secureStorage.isSessionExpired();
    if (isExpired) {
      // Try to refresh token
      return await this.refreshToken();
    }

    return true;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post<{ message: string }>(
      '/auth/password-reset',
      { email },
      false,
    );

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  /**
   * Initialize auth state (call on app start)
   */
  async initialize(): Promise<AuthState> {
    const isAuth = await this.isAuthenticated();
    
    if (isAuth) {
      const user = await this.getCurrentUser();
      return {
        user,
        isAuthenticated: user !== null,
        isLoading: false,
      };
    }

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
}

export const authService = new AuthService();

