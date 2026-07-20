import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  setToken: (token) => {
    set({ accessToken: token });
    // Sync with localStorage for apiClient
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    set({
      user: data.user,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isLoading: false
    });
    // Save to localStorage
    localStorage.setItem('accessToken', data.accessToken);
  },

  register: async (email, username, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    // Auto-login after registration
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      // Save to localStorage
      localStorage.setItem('accessToken', data.accessToken);
    }
  },

  logout: async () => {
    try {
      const { accessToken } = get();
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: accessToken ? {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        } : {},
      });
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      // Clear from localStorage
      localStorage.removeItem('accessToken');
    }
  },

  checkAuth: async () => {
    try {
      // Get token from localStorage first
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const { accessToken } = get();
      const token = accessToken || storedToken;

      const response = await fetch(`${API_URL}/users/me`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      if (response.ok) {
        const user = await response.json();
        set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
      } else {
        // Token invalid, clear everything
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        localStorage.removeItem('accessToken');
      }
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem('accessToken');
    }
  },
}));
