import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthState, UserOut } from '../types/auth';
import * as api from '../services/api';

export interface AuthContextType extends AuthState {
  login: (token: string, usuario: UserOut, remember: boolean) => void;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    setupRequired: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.getMe();
      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
        setupRequired: false,
      }));
    } catch {
      // Token invalid
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        setupRequired: false,
      });
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check if setup is required
        const setupStatus = await api.checkSetup();
        if (!setupStatus.setup_completed && !setupStatus.admin_exists) {
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            setupRequired: true,
          });
          return;
        }

        // Check for existing token
        const token =
          localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          setState((prev) => ({ ...prev, token, isLoading: true }));
          await refreshUser();
        } else {
          setState((prev) => ({ ...prev, isLoading: false, setupRequired: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, [refreshUser]);

  const login = useCallback((token: string, usuario: UserOut, remember: boolean) => {
    if (remember) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
    setState({
      user: usuario,
      token,
      isAuthenticated: true,
      isLoading: false,
      setupRequired: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if logout fails, clear local state
    }
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setupRequired: false,
    });
  }, []);

  const updateUser = useCallback((user: UserOut) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
