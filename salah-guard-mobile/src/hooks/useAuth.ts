/**
 * Hook that handles device authentication on app start.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { registerDevice } from '../services/api';
import { storeTokens, getTokens } from '../utils/secureStorage';
import { getDeviceId, setDeviceId } from '../utils/storage';
import logger from '../utils/logger';

function generateDeviceId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = `${Platform.OS}-`;
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useAuth(): { isAuthenticated: boolean; isInitializing: boolean } {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        // Check if we already have tokens
        const existingTokens = await getTokens();
        if (existingTokens?.accessToken) {
          setIsAuthenticated(true);
          setIsInitializing(false);
          return;
        }

        // Get or generate device ID
        let deviceId = getDeviceId();
        if (!deviceId) {
          deviceId = generateDeviceId();
          setDeviceId(deviceId);
        }

        // Register device and store tokens
        const tokens = await registerDevice(deviceId);
        await storeTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });

        setIsAuthenticated(true);
      } catch (err) {
        logger.error('Auth initialization failed:', err);
        // App can still function offline
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize().catch(() => {});
  }, []);

  return { isAuthenticated, isInitializing };
}
