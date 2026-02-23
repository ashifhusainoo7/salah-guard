/**
 * Hook that handles device authentication on app start.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { registerDevice } from '../services/api';
import { storeTokens, getTokens, clearTokens } from '../utils/secureStorage';
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
        // Get or generate device ID
        let deviceId = getDeviceId();
        if (!deviceId) {
          deviceId = generateDeviceId();
          setDeviceId(deviceId);
        }

        // Check if we already have tokens
        const existingTokens = await getTokens();
        if (existingTokens?.accessToken) {
          // Tokens exist — trust them for now; the API interceptor
          // will auto-refresh or re-register if they're expired.
          setIsAuthenticated(true);
          setIsInitializing(false);
          return;
        }

        // No tokens — register device
        const tokens = await registerDevice(deviceId);
        await storeTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });

        setIsAuthenticated(true);
      } catch (err) {
        logger.error('Auth initialization failed:', err);
        // Clear any stale tokens so next launch retries registration
        await clearTokens().catch(() => {});
        // App can still function offline with defaults
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize().catch(() => {});
  }, []);

  return { isAuthenticated, isInitializing };
}
