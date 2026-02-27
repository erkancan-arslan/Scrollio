/**
 * API Client Service
 * Handles all HTTP requests to the backend
 */

import { secureStorage } from '../storage/secureStorage';

// API Configuration
// Prefer EXPO_PUBLIC_API_BASE_URL so web and device use same backend (e.g. 3001).
const getBaseUrl = () => {
  if (!__DEV__) return 'https://api.scrollio.app/api/v1';
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const isWeb = typeof window !== 'undefined' && window.location?.hostname;
  if (isWeb && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000,
};

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

/**
 * API Client for making HTTP requests
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Set the base URL (useful for switching environments)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { accessToken } = await secureStorage.getSession();

    if (accessToken) {
      return { Authorization: `Bearer ${accessToken}` };
    }

    return {};
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = true,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (includeAuth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
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
        const errorData = data as unknown as ApiError;
        return {
          data: null,
          error: errorData?.message || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      return {
        data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            data: null,
            error: 'Request timeout',
            status: 408,
          };
        }
        return {
          data: null,
          error: error.message,
          status: 0,
        };
      }
      return {
        data: null,
        error: 'Unknown error occurred',
        status: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, includeAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    includeAuth = true,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth,
    );
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    includeAuth = true,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth,
    );
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    includeAuth = true,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      includeAuth,
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, includeAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }
}

export const apiClient = new ApiClient();

