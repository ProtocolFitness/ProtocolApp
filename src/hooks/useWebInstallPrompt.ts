import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandaloneWebApp() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)')?.matches ?? Boolean(nav.standalone);
}

export function useWebInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandaloneWebApp);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const canInstall = useMemo(
    () => Platform.OS === 'web' && !installed && Boolean(promptEvent),
    [installed, promptEvent]
  );

  const install = async () => {
    if (!promptEvent) {
      throw new Error('Install prompt is not available in this browser yet.');
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      setPromptEvent(null);
    }
  };

  return {
    isWeb: Platform.OS === 'web',
    installed,
    canInstall,
    install,
  };
}
