import { useCallback, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let globalListenersInstalled = false;
const promptListeners = new Set<(available: boolean) => void>();

const notifyPromptListeners = () => {
  promptListeners.forEach((listener) => listener(Boolean(deferredInstallPrompt)));
};

const ensureGlobalListeners = () => {
  if (typeof window === 'undefined' || globalListenersInstalled) return;
  globalListenersInstalled = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyPromptListeners();
  });
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as any).standalone);
};

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(deferredInstallPrompt));
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [installCompleted, setInstallCompleted] = useState(false);

  useEffect(() => {
    ensureGlobalListeners();
    const listener = (available: boolean) => setCanInstall(available);
    promptListeners.add(listener);
    setCanInstall(Boolean(deferredInstallPrompt));

    const handleAppInstalled = () => {
      setInstallCompleted(true);
      setIsInstalled(true);
      setCanInstall(false);
    };
    const handleDisplayModeChange = () => setIsInstalled(isStandaloneMode());
    window.addEventListener('appinstalled', handleAppInstalled);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener?.('change', handleDisplayModeChange);
    return () => {
      promptListeners.delete(listener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredInstallPrompt) return 'manual' as const;
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    notifyPromptListeners();
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallCompleted(true);
      setIsInstalled(true);
    }
    return result.outcome;
  }, []);

  return {
    isInstalled,
    installCompleted,
    canInstall,
    isIos: isIosDevice(),
    install
  };
}
