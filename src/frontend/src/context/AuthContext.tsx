import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import * as api from '../services/api';

export interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  isCheckingSetup: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<UserOut>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Check setup status first
  useEffect(() => {
    async function checkSetup() {
      try {
        const status = await api.checkSetup();
        if (!status.setup_completed || !status.admin_exists) {
          setSetupRequired(true);
          setIsLoading(false);
          setIsCheckingSetup(false);
          return;
        }
        setSetupRequired(false);
      } catch {
        setSetupRequired(true);
        setIsLoading(false);
        setIsCheckingSetup(false);
        return;
      }
      setIsCheckingSetup(false);
    }
    checkSetup();
  }, []);

  // Then if setup is done and we have a token, fetch user
  useEffect(() => {
    if (isCheckingSetup) return;
    if (setupRequired) return;

    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setToken(null);
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token, isCheckingSetup, setupRequired]);

  const login = useCallback(async (email: string, password: string, remember: boolean): Promise<UserOut> => {
    const res = await api.login({ email, password, remember });
    if (remember) {
      localStorage.setItem('token', res.token);
    } else {
      sessionStorage.setItem('token', res.token);
    }
    setToken(res.token);
    setUser(res.usuario);
    return res.usuario;
  }, []);

  const updateUser = useCallback((updatedUser: UserOut) => {
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    setupRequired,
    isCheckingSetup,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
