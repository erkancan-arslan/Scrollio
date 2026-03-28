/**
 * Kids HTTP client that auto-injects X-Child-Profile-Id header.
 * Reuses Core's base URL logic and auth token from secureStorage
 * but adds child-profile context on every request.
 *
 * NOTE: To avoid circular dependency (api → store → slices → api),
 * the store reference is injected lazily via setStoreRef() instead
 * of being imported directly.
 */

import { secureStorage } from '../../../../services/storage/secureStorage';
import { resolveExpoPublicApiBaseUrl } from '../../../../config/resolveApiBaseUrl';

// ── Lazy store reference (set once at app init to break import cycle) ──
let _getActiveChildId: (() => string | null) | null = null;

/**
 * Call this once from store.ts (or App.tsx) after the store is created
 * to wire up the child-profile header injection without a circular import.
 */
export function setStoreRef(getter: () => string | null): void {
  _getActiveChildId = getter;
}

// ── Base URL (same as Core apiClient — resolveApiBaseUrl) ────────────
const getBaseUrl = (): string => resolveExpoPublicApiBaseUrl();

const TIMEOUT_MS = 30_000;
/** Longer timeout for AI generation (e.g. generate-mentor). Exported for callers that need it. */
export const TIMEOUT_MS_LONG = 120_000;

// ── Response type (mirrors Core ApiResponse) ─────────────────────────
export interface KidsApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// ── Internals ────────────────────────────────────────────────────────

export interface RequestOptions {
  timeoutMs?: number;
}

async function request<T>(
  endpoint: string,
  init: RequestInit = {},
  includeAuth = true,
  options: RequestOptions = {},
): Promise<KidsApiResponse<T>> {
  const url = `${getBaseUrl()}${endpoint}`;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  // Auth token
  if (includeAuth) {
    const { accessToken } = await secureStorage.getSession();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  // Child profile context (via lazy getter — no direct store import)
  const childId = _getActiveChildId?.() ?? null;
  if (childId) {
    headers['X-Child-Profile-Id'] = childId;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data: T | null = null;
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const errBody = data as unknown as { message?: string };
      return {
        data: null,
        error: errBody?.message || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return { data, error: null, status: response.status };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { data: null, error: 'Request timeout', status: 408 };
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { data: null, error: message, status: 0 };
  }
}

// ── Public API ───────────────────────────────────────────────────────

export const kidsApi = {
  get<T>(endpoint: string, includeAuth = true): Promise<KidsApiResponse<T>> {
    return request<T>(endpoint, { method: 'GET' }, includeAuth);
  },

  post<T>(
    endpoint: string,
    body?: unknown,
    includeAuth = true,
    options: RequestOptions = {},
  ): Promise<KidsApiResponse<T>> {
    return request<T>(
      endpoint,
      { method: 'POST', body: body ? JSON.stringify(body) : undefined },
      includeAuth,
      options,
    );
  },

  patch<T>(endpoint: string, body?: unknown, includeAuth = true): Promise<KidsApiResponse<T>> {
    return request<T>(
      endpoint,
      { method: 'PATCH', body: body ? JSON.stringify(body) : undefined },
      includeAuth,
    );
  },

  put<T>(endpoint: string, body?: unknown, includeAuth = true): Promise<KidsApiResponse<T>> {
    return request<T>(
      endpoint,
      { method: 'PUT', body: body ? JSON.stringify(body) : undefined },
      includeAuth,
    );
  },

  delete<T>(endpoint: string, includeAuth = true): Promise<KidsApiResponse<T>> {
    return request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  },
};
