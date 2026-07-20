const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Fetch wrapper that automatically adds JWT token to requests
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
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
