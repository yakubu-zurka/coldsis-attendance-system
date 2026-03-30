import { useEffect, useState, useCallback } from 'react';

export function useSessionTimeout(onTimeout: () => void, timeoutMs: number = 300000, warningMs: number = 240000) {
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
  }, []);

  useEffect(() => {
    let warningTimer: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;

    const startTimers = () => {
      warningTimer = setTimeout(() => setShowWarning(true), warningMs);
      logoutTimer = setTimeout(onTimeout, timeoutMs);
    };

    const handleActivity = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      resetTimer();
      startTimers();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    startTimers();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
    };
  }, [onTimeout, timeoutMs, warningMs, resetTimer]);

  return { showWarning };
}
