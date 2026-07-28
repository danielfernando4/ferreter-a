import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import * as api from '../services/api';

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  isSetupLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isSetupLoading, setIsSetupLoading] = useState(true);

  // Check setup status first
  useEffect(() => {
    async function checkSetupStatus() {
      try {
        const status = await api.checkSetup();
        if (!status.setup_completed && !status.admin_exists) {
          setSetupRequired(true);
        }
      } catch {
        setSetupRequired(true);
      } finally {
        setIsSetupLoading(false);
      }
    }
    checkSetupStatus();
  }, []);

  // If we have a token, load the user
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        setToken(null);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    }
    if (!isSetupLoading) {
      loadUser();
    }
  }, [token, isSetupLoading]);

  const loginFn = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const response = await api.login({ email, password, remember });
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.usuario);
    },
    []
  );

  const logoutFn = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: UserOut) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        setupRequired,
        isSetupLoading,
        login: loginFn,
        logout: logoutFn,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
