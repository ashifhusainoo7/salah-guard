/**
 * Hook that monitors network connectivity and updates the store.
 */
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import useSalahStore from '../store/useSalahStore';
import logger from '../utils/logger';

export function useNetworkStatus(): void {
  const setOffline = useSalahStore((s) => s.setOffline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = !(state.isConnected && state.isInternetReachable);
      setOffline(isOffline);
      logger.info('Network status changed:', isOffline ? 'offline' : 'online');
    });

    return () => {
      unsubscribe();
    };
  }, [setOffline]);
}
