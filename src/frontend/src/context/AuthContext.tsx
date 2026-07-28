import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut } from '../types/auth';
import * as api from '../services/api';

interface AuthState {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  checkingSetup: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
    setupRequired: false,
    checkingSetup: true,
  });

  // Check setup status first, then validate token
  useEffect(() => {
    async function init() {
      try {
        const setupStatus = await api.checkSetup();
        if (!setupStatus.setup_completed || !setupStatus.admin_exists) {
          setState((prev) => ({
            ...prev,
            setupRequired: true,
            checkingSetup: false,
            isLoading: false,
          }));
          return;
        }
      } catch {
        // If check fails, assume setup is done
      }

      // Setup is done, check token
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setState((prev) => ({
          ...prev,
          checkingSetup: false,
          isLoading: false,
        }));
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
          checkingSetup: false,
        });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_remember');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          setupRequired: false,
          checkingSetup: false,
        });
      }
    }
    init();
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const res = await api.login({ email, password, remember });
    localStorage.setItem('auth_token', res.token);
    if (remember) {
      localStorage.setItem('auth_remember', 'true');
    }
    setState({
      user: res.usuario,
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
      setupRequired: false,
      checkingSetup: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_remember');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setupRequired: false,
      checkingSetup: false,
    });
  }, []);

  const updateUser = useCallback((user: UserOut) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.getMe();
      setState((prev) => ({ ...prev, user }));
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
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

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
