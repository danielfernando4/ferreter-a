import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AuthContextType, UserOut } from '../types/auth';
import { checkSetupStatus, loginUser as apiLogin, getMe, logoutUser } from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  // Check setup status on mount
  useEffect(() => {
    const init = async () => {
      try {
        const status = await checkSetupStatus();
        if (!status.setup_completed && !status.admin_exists) {
          setSetupRequired(true);
          setIsLoading(false);
          return;
        }
      } catch {
        // If check fails, proceed to auth check
      }

      // Check if we have a token
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await getMe();
          setUser(userData);
          setToken(storedToken);
        } catch {
          // Token invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('remember');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      const response = await apiLogin({ email, password, remember });
      localStorage.setItem('token', response.token);
      if (remember) {
        localStorage.setItem('remember', 'true');
      }
      setToken(response.token);
      setUser(response.usuario);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('remember');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((userData: UserOut) => {
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateUser,
        setupRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
