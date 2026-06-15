import { create } from "zustand";

interface User {
  id: number;
  username: string;
  avatar: string;
}

interface AuthStore {
  sessionId: string | null;
  user: User | null;
  setSession: (sessionId: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  sessionId: localStorage.getItem("sc_session"),
  user: null,
  setSession: (sessionId) => {
    localStorage.setItem("sc_session", sessionId);
    set({ sessionId });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem("sc_session");
    set({ sessionId: null, user: null });
  },
}));