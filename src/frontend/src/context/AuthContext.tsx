import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import * as api from '../services/api';

interface AuthContextValue {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  setupLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  const checkSetupStatus = useCallback(async () => {
    try {
      setSetupLoading(true);
      const status = await api.checkSetup();
      if (!status.setup_completed || !status.admin_exists) {
        setSetupRequired(true);
      } else {
        setSetupRequired(false);
      }
    } catch {
      setSetupRequired(true);
    } finally {
      setSetupLoading(false);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    try {
      setToken(storedToken);
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSetupStatus().then(() => restoreSession());
  }, [checkSetupStatus, restoreSession]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const response = await api.login({ email, password, remember });
    if (remember) {
      localStorage.setItem('token', response.token);
    } else {
      sessionStorage.setItem('token', response.token);
    }
    setToken(response.token);
    setUser(response.usuario);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: UserOut) => {
    setUser(updatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        setupRequired,
        setupLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
