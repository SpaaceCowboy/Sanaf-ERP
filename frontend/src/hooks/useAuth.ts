'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi, setAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        setAccessToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      },

      register: async (email: string, password: string, name: string) => {
        const response = await authApi.register(email, password, name);
        setAccessToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Continue with logout even if API call fails
        }
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          setAccessToken(accessToken);
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          setAccessToken(null);
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Custom hook for easier access
export function useAuth() {
  const { user, isLoading, isAuthenticated, login, register, logout, checkAuth } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['*'],
      MANAGER: [
        'orders:read', 'orders:write', 'orders:delete',
        'projects:read', 'projects:write', 'projects:delete',
        'inventory:read', 'inventory:write',
        'documents:read', 'documents:write',
        'reports:read',
        'users:read',
      ],
      WAREHOUSE: [
        'inventory:read', 'inventory:write',
        'orders:read',
        'projects:read',
      ],
      PRODUCTION: [
        'projects:read', 'projects:write',
        'orders:read',
        'inventory:read',
      ],
      SALES: [
        'orders:read', 'orders:write',
        'customers:read', 'customers:write',
        'documents:read', 'documents:write',
        'inventory:read',
      ],
      VIEWER: [
        'orders:read',
        'projects:read',
        'inventory:read',
        'reports:read',
      ],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    hasPermission,
    hasRole,
  };
}
