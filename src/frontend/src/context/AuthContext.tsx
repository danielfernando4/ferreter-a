import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut, AuthState } from '../types/auth';
import { getMe, login as apiLogin, logout as apiLogout, checkSetupStatus } from '../services/api';
import type { LoginRequest } from '../types/auth';

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  checkAuth: () => Promise<void>;
  checkSetup: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await getMe();
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const checkSetup = useCallback(async (): Promise<boolean> => {
    try {
      const status = await checkSetupStatus();
      return !status.setup_completed && !status.admin_exists;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data);
    localStorage.setItem('auth_token', response.token);
    setState({
      user: response.usuario,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore errors on logout
    }
    localStorage.removeItem('auth_token');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  const updateUser = useCallback((user: UserOut) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        checkAuth,
        checkSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
