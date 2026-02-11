import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Simple network status hook.
 * On web, uses the navigator.onLine API.
 * On native, defaults to true (react-native's NetInfo would need a separate package).
 */
export const useNetworkStatus = (): { isConnected: boolean } => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);

      setIsConnected(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    // On native, we assume connected. A full implementation would use @react-native-community/netinfo.
    return undefined;
  }, []);

  return { isConnected };
};
