import { create } from 'zustand';
import { api } from '../lib/api-client';

interface User {
  id: number;
  username: string;
  avatar_url: string;
  permalink_url?: string;
  followers_count?: number;
  track_count?: number;
}

interface AuthStore {
  sessionId: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (sessionId: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  sessionId: localStorage.getItem('sc_session'),
  user: null,
  isAuthenticated: false,

  setSession: async (sessionId: string) => {
    localStorage.setItem('sc_session', sessionId);
    set({ sessionId });
  },

  fetchUser: async () => {
    try {
      const user = await api<User>('/me/cold');
      set({ user, isAuthenticated: true });
    } catch {
      set({ isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem('sc_session');
    set({ sessionId: null, user: null, isAuthenticated: false });
  },
}));