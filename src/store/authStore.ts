import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),

  login: async (username, password) => {
    const res = await api.auth.login(username, password);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isLoggedIn: true });
  },

  register: async (username, password, nickname) => {
    const res = await api.auth.register(username, password, nickname);
    localStorage.setItem('token', res.token);
    set({ user: res.user, token: res.token, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isLoggedIn: false });
  },

  fetchMe: async () => {
    try {
      const user = await api.auth.me();
      set({ user, isLoggedIn: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isLoggedIn: false });
    }
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isLoggedIn: true });
  },
}));
