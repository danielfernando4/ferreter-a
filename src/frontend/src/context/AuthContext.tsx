import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import * as api from '../services/api';

export interface AuthState {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
    setupRequired: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      const setupStatus = await api.checkSetup();
      if (!setupStatus.admin_exists) {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          setupRequired: true,
        });
        return;
      }
    } catch {
      // if check-setup fails, assume setup not needed
    }

    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const user = await api.getMe();
      setState({
        user,
        token: storedToken,
        isAuthenticated: true,
        isLoading: false,
        setupRequired: false,
      });
    } catch {
      localStorage.removeItem('auth_token');
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
    checkAuth();
  }, [checkAuth]);

  const loginFn = useCallback(async (email: string, password: string, remember?: boolean) => {
    const res = await api.login({ email, password, remember: remember ?? false });
    localStorage.setItem('auth_token', res.token);
    setState({
      user: res.usuario,
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
      setupRequired: false,
    });
  }, []);

  const logoutFn = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login: loginFn,
        logout: logoutFn,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
