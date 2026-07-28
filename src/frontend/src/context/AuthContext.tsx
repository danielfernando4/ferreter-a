import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut, AuthState, LoginRequest } from '../types/auth';
import * as api from '../services/api';

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  checkSetup: () => Promise<boolean>;
  setupRequired: boolean;
  isCheckingSetup: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
  });
  const [setupRequired, setSetupRequired] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Check setup status on mount
  useEffect(() => {
    async function init() {
      try {
        const setupStatus = await api.checkSetup();
        if (!setupStatus.setup_completed && !setupStatus.admin_exists) {
          setSetupRequired(true);
          setIsCheckingSetup(false);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      } catch {
        // If check fails, assume setup is done
      }
      setSetupRequired(false);
      setIsCheckingSetup(false);

      // If we have a token, try to authenticate
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await api.getMe();
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setState(prev => ({ ...prev, isLoading: false }));
    }
    init();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await api.login(data);
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_user', JSON.stringify(res.usuario));
    setState({
      user: res.usuario,
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((user: UserOut) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  }, []);

  const checkSetupStatus = useCallback(async () => {
    try {
      const setupStatus = await api.checkSetup();
      return setupStatus.setup_completed && setupStatus.admin_exists;
    } catch {
      return true;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        checkSetup: checkSetupStatus,
        setupRequired,
        isCheckingSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
