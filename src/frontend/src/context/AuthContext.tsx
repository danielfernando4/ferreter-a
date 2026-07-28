import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthContextType, UserOut } from '../types/auth';
import { checkSetupStatus, getMe } from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('auth_token')
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      // First check if setup is required
      const setupStatus = await checkSetupStatus();
      if (setupStatus.setup_completed === false && setupStatus.admin_exists === false) {
        // Setup is required - don't check auth
        localStorage.removeItem('auth_token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = await getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('auth_token');
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = useCallback((newToken: string, usuario: UserOut) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(usuario);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((usuario: UserOut) => {
    setUser(usuario);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
