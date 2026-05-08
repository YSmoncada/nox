import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '../types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  
  // Actions
  setAuth: (token: string, refreshToken: string, user: User) => void;
  updateToken: (newToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isLoading: false,

      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user, isLoading: false }),
      
      updateToken: (newToken) => set({ token: newToken }),
      
      clearAuth: () => set({ token: null, refreshToken: null, user: null, isLoading: false }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
