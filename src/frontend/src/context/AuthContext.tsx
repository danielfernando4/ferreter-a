import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut, AuthState } from '../types/auth';
import * as api from '../services/api';

export interface AuthContextValue extends AuthState {
  login: (token: string, user: UserOut) => void;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  setupRequired: boolean;
  setSetupRequired: (v: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [setupRequired, setSetupRequired] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const setupStatus = await api.checkSetup();
      if (!setupStatus.setup_completed || !setupStatus.admin_exists) {
        setSetupRequired(true);
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      setSetupRequired(false);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await api.getMe();
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback((token: string, user: UserOut) => {
    localStorage.setItem('auth_token', token);
    setState({ user, token, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const updateUser = useCallback((user: UserOut) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, updateUser, setupRequired, setSetupRequired }}
    >
      {children}
    </AuthContext.Provider>
  );
}
