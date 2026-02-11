/**
 * Kids-specific storage helpers.
 * Uses localStorage on web, expo-secure-store on native — same approach as Core's secureStorage.
 * All keys are prefixed with @scrollio_kids: for namespace isolation.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PREFIX = '@scrollio_kids:';

const isWeb = Platform.OS === 'web';

export const getItem = async (key: string): Promise<string | null> => {
  const fullKey = `${PREFIX}${key}`;
  try {
    if (isWeb) {
      return localStorage.getItem(fullKey);
    }
    return await SecureStore.getItemAsync(fullKey);
  } catch (error) {
    console.warn(`kids/storage getItem error for ${key}:`, error);
    return null;
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  const fullKey = `${PREFIX}${key}`;
  try {
    if (isWeb) {
      localStorage.setItem(fullKey, value);
    } else {
      await SecureStore.setItemAsync(fullKey, value);
    }
  } catch (error) {
    console.warn(`kids/storage setItem error for ${key}:`, error);
  }
};

export const removeItem = async (key: string): Promise<void> => {
  const fullKey = `${PREFIX}${key}`;
  try {
    if (isWeb) {
      localStorage.removeItem(fullKey);
    } else {
      await SecureStore.deleteItemAsync(fullKey);
    }
  } catch (error) {
    console.warn(`kids/storage removeItem error for ${key}:`, error);
  }
};

export const clearAll = async (): Promise<void> => {
  const keys = [
    'pin_verified',
    'active_child_id',
    'screen_time_today',
    'mute_preference',
  ];
  await Promise.all(keys.map((k) => removeItem(k)));
};
