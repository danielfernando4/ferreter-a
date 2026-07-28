import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserOut } from '../types/auth';
import { getMe, checkSetupStatus } from '../services/api';

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean;
  isCheckingSetup: boolean;
  loginSuccess: (token: string, user: UserOut) => void;
  logout: () => void;
  updateUser: (user: UserOut) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setupRequired: false,
  isCheckingSetup: true,
  loginSuccess: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('auth_token')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await getMe();
      setUser(userData);
      return userData;
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsCheckingSetup(true);
      try {
        const status = await checkSetupStatus();
        if (!status.setup_completed && !status.admin_exists) {
          setSetupRequired(true);
          setIsCheckingSetup(false);
          setIsLoading(false);
          return;
        }
      } catch {
        // If status check fails, assume setup is done
      }
      setIsCheckingSetup(false);

      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        await fetchUser();
      }
      setIsLoading(false);
    };

    init();
  }, [fetchUser]);

  const loginSuccess = useCallback((newToken: string, newUser: UserOut) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: UserOut) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        setupRequired,
        isCheckingSetup,
        loginSuccess,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
