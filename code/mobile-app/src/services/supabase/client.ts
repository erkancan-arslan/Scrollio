import { createClient } from '@supabase/supabase-js';
import { secureStorage } from '../storage/secureStorage';

// Constants would typically come from env, but we'll use placeholder or reuse existing config strategy
// Since existing .env.example shows vars, we should assume they are available via process.env or a config file.
// For now, I'll use the values available or placeholders that the user must fill.
// Reusing logic from apiClient.ts implies we might not have direct env access here?
// I will pattern match apiClient.ts usage but for Supabase.

// Debugging helper
const getEnvVar = (key: string) => {
    // @ts-ignore
    return process.env[key] || process.env[`EXPO_PUBLIC_${key}`];
};

const DEV_SUPABASE_URL = 'http://192.168.1.123:54321'; // LAN IP for device access
// const DEV_SUPABASE_URL = 'http://localhost:54321'; // Default local Supabase
const PROD_SUPABASE_URL = 'https://example.supabase.co'; // Placeholder

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || getEnvVar('SUPABASE_URL') || (__DEV__ ? DEV_SUPABASE_URL : PROD_SUPABASE_URL);
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || getEnvVar('SUPABASE_ANON_KEY') || 'your-anon-key';

console.log('Supabase Client Initializing:', {
    url: SUPABASE_URL,
    hasKey: !!SUPABASE_ANON_KEY,
    isDev: __DEV__
});

if (SUPABASE_URL.includes('example.supabase.co')) {
    console.warn('⚠️ WARNING: Using placeholder Supabase URL. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL is set.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: {
            getItem: async (key) => await secureStorage.getItem(key as any),
            setItem: async (key, value) => await secureStorage.setItem(key as any, value),
            removeItem: async (key) => await secureStorage.deleteItem(key as any),
        },
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
});

/**
 * Returns a Supabase client instance that is guaranteed to have the latest session
 * from secureStorage applied.
 */
export const getAuthenticatedSupabase = async () => {
    // We can rely on the built-in persistence if we hook it up correctly above.
    // However, since authService manages the session *externally* via direct API calls
    // and manual secureStorage updates, the supabase client might be out of sync
    // if it wasn't the one that established the session.

    // So we manually set the session from storage to be safe.
    const session = await secureStorage.getSession();

    if (session.accessToken && session.refreshToken) {
        await supabase.auth.setSession({
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
        });
    }

    return supabase;
};
