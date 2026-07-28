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
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Check setup status first
  useEffect(() => {
    async function checkSetup() {
      try {
        const status = await api.checkSetup();
        if (!status.setup_completed || !status.admin_exists) {
          setSetupRequired(true);
        }
      } catch {
        setSetupRequired(true);
      } finally {
        setIsCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  // Then check auth token
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('remember');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (!isCheckingSetup) {
      loadUser();
    }
  }, [isCheckingSetup]);

  const loginFn = useCallback(
    async (email: string, password: string, remember: boolean = false) => {
      const response = await api.login({ email, password, remember });
      localStorage.setItem('token', response.token);
      if (remember) {
        localStorage.setItem('remember', 'true');
      }
      setToken(response.token);
      setUser(response.usuario);
    },
    []
  );

  const logoutFn = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('remember');
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
        isAuthenticated: !!user,
        isLoading,
        setupRequired,
        isCheckingSetup,
        login: loginFn,
        logout: logoutFn,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
