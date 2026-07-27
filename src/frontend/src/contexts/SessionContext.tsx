import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { extendSession } from '../api/client';

interface SessionContextType {
  showWarning: boolean;
  sessionExpired: boolean;
  timeRemaining: number;
  extendSessionNow: () => Promise<void>;
}

const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 min
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 min before expiry
const CHECK_INTERVAL_MS = 30 * 1000; // check every 30s
const EXTEND_DEBOUNCE_MS = 60 * 1000; // extend at most once per minute

const SessionContext = createContext<SessionContextType>({
  showWarning: false,
  sessionExpired: false,
  timeRemaining: SESSION_DURATION_MS,
  extendSessionNow: async () => {},
});

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION_MS);
  const lastActivityRef = useRef<number>(Date.now());
  const lastExtendRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extendSessionNow = useCallback(async () => {
    const now = Date.now();
    if (now - lastExtendRef.current < EXTEND_DEBOUNCE_MS) return;

    try {
      await extendSession();
      lastExtendRef.current = now;
      lastActivityRef.current = now;
      setShowWarning(false);
      setSessionExpired(false);
    } catch {
      // If extending fails, let the session expire naturally
    }
  }, []);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
    // Auto-extend on activity when in warning zone
    const elapsed = Date.now() - lastExtendRef.current;
    if (elapsed >= SESSION_DURATION_MS - WARNING_THRESHOLD_MS) {
      extendSessionNow();
    }
  }, [showWarning, extendSessionNow]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setShowWarning(false);
      setSessionExpired(false);
      return;
    }

    const handleActivity = () => {
      resetActivity();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = SESSION_DURATION_MS - elapsed;
      setTimeRemaining(Math.max(0, remaining));

      if (elapsed >= SESSION_DURATION_MS) {
        setSessionExpired(true);
        setShowWarning(false);
        logout();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (elapsed >= SESSION_DURATION_MS - WARNING_THRESHOLD_MS) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, logout, resetActivity]);

  return (
    <SessionContext.Provider
      value={{
        showWarning,
        sessionExpired,
        timeRemaining,
        extendSessionNow,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  return useContext(SessionContext);
};

export default SessionContext;
