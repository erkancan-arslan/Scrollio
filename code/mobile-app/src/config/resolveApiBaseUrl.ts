/**
 * Single source of truth for EXPO_PUBLIC_API_BASE_URL in dev/prod.
 * Trims whitespace, strips quotes, removes accidental line breaks in .env
 * (which can produce broken hosts like http://1/2.x.x.x).
 */

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

export function resolveExpoPublicApiBaseUrl(): string {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return 'https://api.scrollio.app/api/v1';
  }
  const fromEnv = normalizeEnvUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (fromEnv) return fromEnv;

  const isWeb =
    typeof window !== 'undefined' && typeof window.location?.hostname === 'string';
  if (
    isWeb &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
}
