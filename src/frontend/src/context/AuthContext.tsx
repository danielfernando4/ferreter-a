import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import { getMe, checkSetup } from '../services/api';

export interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  setupLoading: boolean;
  login: (token: string, user: UserOut) => void;
  logout: () => void;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Check setup status first
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const setupStatus = await checkSetup();
        if (cancelled) return;
        if (!setupStatus.admin_exists || !setupStatus.setup_completed) {
          setSetupRequired(true);
          setSetupLoading(false);
          setIsLoading(false);
          return;
        }
        setSetupRequired(false);
        setSetupLoading(false);

        // If we have a token, try to validate it
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          try {
            const userData = await getMe();
            if (cancelled) return;
            setUser(userData);
            setToken(savedToken);
          } catch {
            // Token invalid or expired
            if (!cancelled) {
              localStorage.removeItem('auth_token');
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch {
        // Error checking setup
        if (!cancelled) {
          setSetupLoading(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((newToken: string, newUser: UserOut) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
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
        isAuthenticated,
        isLoading,
        setupRequired,
        setupLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
