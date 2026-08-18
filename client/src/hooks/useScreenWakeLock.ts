import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockSentinelLike = {
  released: boolean;
  addEventListener?: (type: 'release', listener: () => void) => void;
  release: () => Promise<void>;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
};

const STORAGE_KEY = 'maintenance_keep_screen_awake';

export function useScreenWakeLock() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  });
  const [isLocked, setIsLocked] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    if (sentinel && !sentinel.released) {
      try { await sentinel.release(); } catch (error) { console.warn('Wake Lock release failed:', error); }
    }
    setIsLocked(false);
  }, []);

  const acquire = useCallback(async () => {
    if (!enabled || !supported || document.visibilityState !== 'visible') return false;
    const current = sentinelRef.current;
    if (current && !current.released) {
      setIsLocked(true);
      return true;
    }
    try {
      const sentinel = await (navigator as WakeLockNavigator).wakeLock!.request('screen');
      sentinelRef.current = sentinel;
      sentinel.addEventListener?.('release', () => {
        sentinelRef.current = null;
        setIsLocked(false);
      });
      setIsLocked(true);
      return true;
    } catch (error) {
      console.warn('Wake Lock request failed:', error);
      setIsLocked(false);
      return false;
    }
  }, [enabled, supported]);

  useEffect(() => {
    if (!enabled) {
      void release();
      return;
    }

    void acquire();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void acquire();
      else setIsLocked(false);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void release();
    };
  }, [acquire, enabled, release]);

  const toggle = useCallback(() => {
    setEnabled((previous) => {
      const next = !previous;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { enabled, isLocked, supported, toggle, acquire };
}
