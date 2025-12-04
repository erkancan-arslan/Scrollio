/**
 * Secure Storage Service
 * Uses Keychain (iOS) / Keystore (Android) for secure token storage
 * 
 * NEVER store auth tokens in AsyncStorage - it's not encrypted!
 * This service uses expo-secure-store for encrypted storage.
 */

import * as SecureStore from 'expo-secure-store';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'scrollio_access_token',
  REFRESH_TOKEN: 'scrollio_refresh_token',
  USER_ID: 'scrollio_user_id',
  SESSION_EXPIRES_AT: 'scrollio_session_expires_at',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data using device Keychain/Keystore
 */
export const secureStorage = {
  /**
   * Store a value securely
   */
  async setItem(key: StorageKey, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error(`SecureStorage.setItem error for ${key}:`, error);
      throw new Error(`Failed to store ${key}`);
    }
  },

  /**
   * Retrieve a value
   */
  async getItem(key: StorageKey): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage.getItem error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a value
   */
  async deleteItem(key: StorageKey): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage.deleteItem error for ${key}:`, error);
    }
  },

  /**
   * Store auth session tokens
   */
  async setSession(session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
  }): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken),
      this.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, session.expiresAt.toString()),
      this.setItem(STORAGE_KEYS.USER_ID, session.userId),
    ]);
  },

  /**
   * Get stored session
   */
  async getSession(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    userId: string | null;
  }> {
    const [accessToken, refreshToken, expiresAtStr, userId] = await Promise.all([
      this.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT),
      this.getItem(STORAGE_KEYS.USER_ID),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
      userId,
    };
  },

  /**
   * Clear all auth session data
   */
  async clearSession(): Promise<void> {
    await Promise.all([
      this.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.deleteItem(STORAGE_KEYS.SESSION_EXPIRES_AT),
      this.deleteItem(STORAGE_KEYS.USER_ID),
    ]);
  },

  /**
   * Check if session exists
   */
  async hasSession(): Promise<boolean> {
    const accessToken = await this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return accessToken !== null;
  },

  /**
   * Check if session is expired
   */
  async isSessionExpired(): Promise<boolean> {
    const expiresAtStr = await this.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
    if (!expiresAtStr) return true;

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Math.floor(Date.now() / 1000);
    
    // Consider expired if less than 60 seconds remaining
    return expiresAt - now < 60;
  },
};

export { STORAGE_KEYS };

