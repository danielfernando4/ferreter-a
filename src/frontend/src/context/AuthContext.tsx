import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import { authApi } from '../services/api';

export interface AuthState {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  checkingSetup: boolean;
}

export interface AuthContextType extends AuthState {
  login: (token: string, user: UserOut, remember: boolean) => void;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Check setup status first
  useEffect(() => {
    async function checkSetup() {
      try {
        const status = await authApi.checkSetup();
        if (!status.setup_completed || !status.admin_exists) {
          setSetupRequired(true);
        }
      } catch {
        // If setup check fails, assume setup is needed
        setSetupRequired(true);
      } finally {
        setCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  // Validate token and load user
  useEffect(() => {
    if (setupRequired || checkingSetup) return;

    async function loadUser() {
      setIsLoading(true);
      const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      try {
        const userData = await authApi.me();
        setUser(userData);
        setToken(storedToken);
      } catch {
        // Token invalid
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [setupRequired, checkingSetup]);

  const login = useCallback((newToken: string, newUser: UserOut, remember: boolean) => {
    if (remember) {
      localStorage.setItem('auth_token', newToken);
    } else {
      sessionStorage.setItem('auth_token', newToken);
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: UserOut) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        setupRequired,
        checkingSetup,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
