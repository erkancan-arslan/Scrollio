/**
 * Single source of truth for EXPO_PUBLIC_API_BASE_URL in dev/prod.
 * Trims whitespace, strips quotes, removes accidental line breaks in .env
 * (which can produce broken hosts like http://1/2.x.x.x).
 *
 * Dev + physical device: `.env` often uses `localhost` (works on simulator/web).
 * On a real phone, `localhost` is the phone itself → "Network request failed".
 * We rewrite `localhost` / `127.0.0.1` to the LAN host Expo reports (same as QR flow).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

function normalizeEnvUrl(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  let u = String(raw).trim();
  if (!u) return null;
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }
  u = u.replace(/\s+/g, '');
  if (!/^https?:\/\//i.test(u)) return null;
  return u.replace(/\/$/, '');
}

/** Expo Go / dev client host, e.g. `192.168.1.5:8081` → `192.168.1.5` */
function devLanHostFromExpo(): string | null {
  try {
    const uri =
      Constants.expoConfig?.hostUri ??
      (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost;
    if (typeof uri !== 'string' || !uri.trim()) return null;
    const host = uri.split(':')[0]?.trim();
    if (!host || host === 'localhost' || host === '127.0.0.1') return null;
    return host;
  } catch {
    return null;
  }
}

/** On native dev builds, point API at the same machine Metro uses (LAN IP). */
function rewriteLocalhostForPhysicalDevice(url: string): string {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return url;
  if (Platform.OS === 'web') return url;
  if (!/localhost|127\.0\.0\.1/i.test(url)) return url;
  const lan = devLanHostFromExpo();
  if (!lan) return url;
  return url.replace(/127\.0\.0\.1/g, lan).replace(/localhost/gi, lan);
}

export function resolveExpoPublicApiBaseUrl(): string {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    // Production build — use the Railway / hosted backend URL set at build time
    const prodUrl = normalizeEnvUrl(process.env.EXPO_PUBLIC_API_PROD_URL);
    if (prodUrl) {
      return /\/api\/v\d+/i.test(prodUrl) ? prodUrl : `${prodUrl}/api/v1`;
    }
    // Fallback to legacy hardcoded value (update EXPO_PUBLIC_API_PROD_URL to override)
    return 'https://api.scrollio.app/api/v1';
  }

  const fromEnv = normalizeEnvUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (fromEnv) {
    const trimmed = fromEnv.replace(/\/$/, '');
    // Common mistake: host:port without /api/v1 — would call /kids/feed on the wrong path.
    const withApi = !/\/api\/v\d+/i.test(trimmed) ? `${trimmed}/api/v1` : trimmed;
    return rewriteLocalhostForPhysicalDevice(withApi);
  }

  const isWeb =
    typeof window !== 'undefined' && typeof window.location?.hostname === 'string';
  if (
    isWeb &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:3001/api/v1';
  }
  return rewriteLocalhostForPhysicalDevice('http://localhost:3001/api/v1');
}
