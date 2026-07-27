import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from '../types';
import { getMe, login as apiLogin, logout as apiLogout, checkSetupStatus, setToken, clearToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setupRequired: boolean | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser({
        id: me.id,
        full_name: me.full_name,
        username: me.username,
        email: me.email,
        role: me.role as User['role'],
        is_active: me.is_active,
        created_at: me.created_at,
      });
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const status = await checkSetupStatus();
        setSetupRequired(status.setup_required);
        if (status.setup_required) {
          setIsLoading(false);
          return;
        }
      } catch {
        setSetupRequired(true);
        setIsLoading(false);
        return;
      }

      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setTokenState(storedToken);
        try {
          const me = await getMe();
          setUser({
            id: me.id,
            full_name: me.full_name,
            username: me.username,
            email: me.email,
            role: me.role as User['role'],
            is_active: me.is_active,
            created_at: me.created_at,
          });
        } catch {
          clearToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiLogin({ username, password });
    setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore errors during logout
    }
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        setupRequired,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
