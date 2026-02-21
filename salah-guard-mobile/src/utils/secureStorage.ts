/**
 * Secure storage wrapper using AsyncStorage for Expo Go compatibility.
 * In production, replace with expo-secure-store or react-native-keychain.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

const TOKEN_KEY = 'com.salahguard.tokens';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function storeTokens(tokens: TokenPair): Promise<boolean> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    return true;
  } catch (err) {
    logger.error('Failed to store tokens:', err);
    return false;
  }
}

export async function getTokens(): Promise<TokenPair | null> {
  try {
    const data = await AsyncStorage.getItem(TOKEN_KEY);
    if (data) {
      return JSON.parse(data) as TokenPair;
    }
    return null;
  } catch (err) {
    logger.error('Failed to retrieve tokens:', err);
    return null;
  }
}

export async function clearTokens(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (err) {
    logger.error('Failed to clear tokens:', err);
    return false;
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  return false;
}
