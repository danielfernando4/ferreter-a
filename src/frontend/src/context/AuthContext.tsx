import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import { authApi } from '../services/api';

export interface AuthState {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkingSetup: boolean;
  setupRequired: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  // Effect 1: Check setup status
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const status = await authApi.checkSetup();
        if (cancelled) return;
        if (!status.setup_completed && !status.admin_exists) {
          setSetupRequired(true);
          setCheckingSetup(false);
          setIsLoading(false);
          return;
        }
        setSetupRequired(false);
      } catch {
        // Network error — keep setupRequired false, try loading user
        if (!cancelled) {
          setSetupRequired(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingSetup(false);
          setIsLoading(false);
        }
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  // Effect 2: Load user from stored token (runs after setup check)
  useEffect(() => {
    if (checkingSetup) return;
    if (setupRequired) return;

    const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadUser() {
      try {
        setToken(storedToken);
        const userData = await authApi.me();
        if (cancelled) return;
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        // Token invalid or expired
        if (!cancelled) {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, [checkingSetup, setupRequired]);

  const login = useCallback(async (email: string, password: string, remember?: boolean) => {
    const response = await authApi.login({ email, password, remember: remember ?? false });
    if (remember) {
      localStorage.setItem('auth_token', response.token);
    } else {
      sessionStorage.setItem('auth_token', response.token);
    }
    setToken(response.token);
    setUser(response.usuario);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
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
        checkingSetup,
        setupRequired,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
