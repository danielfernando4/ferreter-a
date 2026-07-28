import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserOut, AuthState } from '../types/auth';
import * as api from '../services/api';

export interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<UserOut>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  setupRequired: boolean;
  setSetupRequired: (v: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [setupRequired, setSetupRequired] = useState(false);

  // On mount: check setup status and token
  useEffect(() => {
    (async () => {
      try {
        // First check setup status
        const setupStatus = await api.checkSetup();
        if (!setupStatus.admin_exists) {
          setSetupRequired(true);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
        setSetupRequired(false);

        // Check for existing token
        const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (savedToken) {
          try {
            const user = await api.getMe(savedToken);
            setState({
              user,
              token: savedToken,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }
        }
        setState(prev => ({ ...prev, isLoading: false }));
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const loginFn = useCallback(async (email: string, password: string, remember?: boolean): Promise<UserOut> => {
    const res = await api.login({ email, password, remember: remember ?? false });
    const token = res.token;
    if (remember) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
    setState({
      user: res.usuario,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
    return res.usuario;
  }, []);

  const logoutFn = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUserFn = useCallback((user: UserOut) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login: loginFn,
        logout: logoutFn,
        updateUser: updateUserFn,
        setupRequired,
        setSetupRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
