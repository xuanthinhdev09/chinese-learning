const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Exchange the refresh-token cookie for a fresh access-token cookie.
 * Concurrent 401s share one in-flight refresh so a burst of expired
 * requests fires a single POST instead of a storm.
 */
let refreshInflight: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  refreshInflight ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST' });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

async function rawFetch(url: string, options: RequestInit): Promise<Response> {
  // Get token from localStorage (or any storage you use)
  const token = localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for POST/PUT/PATCH if not already set
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
}

/**
 * Fetch wrapper that automatically adds JWT token to requests.
 * A 401 on an app endpoint triggers one silent refresh-and-retry before the
 * error surfaces — auth endpoints themselves are excluded so a failed login
 * or an expired refresh token never loops.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await rawFetch(url, options);
  if (
    response.status === 401 &&
    !url.startsWith('/auth/') &&
    (await tryRefresh())
  ) {
    return rawFetch(url, options);
  }
  return response;
}

/**
 * Helper methods for common HTTP methods
 */
export const apiClient = {
  get: (url: string, options?: RequestInit) =>
    apiFetch(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: any, options?: RequestInit) =>
    apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestInit) =>
    apiFetch(url, { ...options, method: 'DELETE' }),
};
