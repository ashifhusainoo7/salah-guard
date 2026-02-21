/**
 * Hook that monitors network connectivity and updates the store.
 * Expo Go compatible - uses simple online/offline detection.
 */
import { useEffect } from 'react';
import useSalahStore from '../store/useSalahStore';
import logger from '../utils/logger';

export function useNetworkStatus(): void {
  const setOffline = useSalahStore((s) => s.setOffline);

  useEffect(() => {
    // Simple connectivity check for Expo Go
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setOffline(false);
      } catch {
        setOffline(true);
        logger.info('Network appears offline');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [setOffline]);
}
