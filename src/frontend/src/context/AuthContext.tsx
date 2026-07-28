import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserOut, AuthState } from '../services/api';
import { getMe, loginApi, logoutApi, checkSetupStatus, LoginRequest } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserOut) => void;
  setupRequired: boolean;
  checkingSetup: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  const loadUser = useCallback(async (token: string) => {
    try {
      const user = await getMe();
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('persistent_token');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setCheckingSetup(true);
      try {
        const status = await checkSetupStatus();
        if (!status.setup_completed) {
          setSetupRequired(true);
          setCheckingSetup(false);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      } catch {
        // Si hay error al verificar setup, continuar con login normal
      }
      setSetupRequired(false);
      setCheckingSetup(false);

      const token = localStorage.getItem('auth_token') || localStorage.getItem('persistent_token');
      if (token) {
        await loadUser(token);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    init();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string, remember?: boolean) => {
    const data: LoginRequest = { email, password };
    if (remember) data.remember = true;
    const res = await loginApi(data);
    if (remember) {
      localStorage.setItem('persistent_token', res.token);
    } else {
      localStorage.setItem('auth_token', res.token);
    }
    setState({
      user: res.usuario,
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignorar error de logout
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('persistent_token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((user: UserOut) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        setupRequired,
        checkingSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return ctx;
}

export default AuthContext;
