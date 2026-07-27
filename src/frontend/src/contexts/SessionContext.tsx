import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { checkSession, extendSession as apiExtendSession } from '../api/client';
import { useAuth } from './AuthContext';

interface SessionContextType {
  timeLeft: number;
  showWarning: boolean;
  extend: () => void;
}

const SessionContext = createContext<SessionContextType>({
  timeLeft: 15 * 60,
  showWarning: false,
  extend: () => {},
});

const SESSION_DURATION = 15 * 60; // 15 minutes in seconds
const WARNING_THRESHOLD = 2 * 60; // 2 minutes before expiry

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTimeLeft(SESSION_DURATION);
    setShowWarning(false);
  }, []);

  const extend = useCallback(async () => {
    try {
      await apiExtendSession();
      resetTimer();
    } catch {
      // ignore
    }
  }, [resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, SESSION_DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining <= WARNING_THRESHOLD && remaining > 0) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        // Session expired - logout
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }, 1000);

    // Check session from server
    checkSession().catch(() => {});

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated]);

  return (
    <SessionContext.Provider value={{ timeLeft, showWarning, extend }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export default SessionContext;
