import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut, AuthState, LoginRequest } from '../types/auth';
import { authApi, authProtectedApi } from '../services/api';

export interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  checkSetupStatus: () => Promise<{ setup_completed: boolean; admin_exists: boolean }>;
  setupRequired: boolean;
  setSetupRequired: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [setupRequired, setSetupRequired] = useState(false);

  const updateUser = useCallback((user: UserOut) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    const storage = data.remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', response.token);
    localStorage.setItem('user_data', JSON.stringify(response.usuario));
    setState({
      user: response.usuario,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authProtectedApi.logout();
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const checkSetupStatus = useCallback(async () => {
    const status = await authApi.checkSetup();
    return status;
  }, []);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const token =
        localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          const user = JSON.parse(userData) as UserOut;
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Verify token is still valid
          try {
            const freshUser = await authProtectedApi.me();
            localStorage.setItem('user_data', JSON.stringify(freshUser));
            setState({
              user: freshUser,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            // Token expired or invalid
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        checkSetupStatus,
        setupRequired,
        setSetupRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
