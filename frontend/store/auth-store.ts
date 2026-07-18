import { create } from 'zustand';
import { apiClient, setTokens, clearTokens, getAccessToken } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  verificationStatus: string;
  loyaltyPoints: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await apiClient.post<AuthResult>(
        '/auth/login',
        { email, password },
        { skipAuth: true }
      );
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({ user: result.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (input) => {
    set({ isLoading: true });
    try {
      const result = await apiClient.post<AuthResult>('/auth/register', input, { skipAuth: true });
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({ user: result.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken =
      typeof window !== 'undefined' ? window.localStorage.getItem('heroy_refresh_token') : null;

    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken }, { skipAuth: true });
      }
    } catch {
      // Even if the server call fails, clear local state so the
      // user is logged out client-side regardless.
    }

    clearTokens();
    set({ user: null });
  },

  fetchCurrentUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isInitialized: true });
      return;
    }

    try {
      const user = await apiClient.get<AuthUser>('/auth/me');
      set({ user, isInitialized: true });
    } catch {
      clearTokens();
      set({ user: null, isInitialized: true });
    }
  },

  initialize: async () => {
    if (get().isInitialized) return;
    await get().fetchCurrentUser();
  },
}));
