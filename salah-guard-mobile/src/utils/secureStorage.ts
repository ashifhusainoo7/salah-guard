/**
 * Secure storage wrapper using react-native-keychain for sensitive data.
 * Uses hardware-backed keystore on Android and Keychain on iOS.
 */
import * as Keychain from 'react-native-keychain';
import logger from './logger';

const SERVICE_PREFIX = 'com.salahguard';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function storeTokens(tokens: TokenPair): Promise<boolean> {
  try {
    await Keychain.setGenericPassword(
      'auth_tokens',
      JSON.stringify(tokens),
      { service: `${SERVICE_PREFIX}.tokens` },
    );
    return true;
  } catch (err) {
    logger.error('Failed to store tokens securely:', err);
    return false;
  }
}

export async function getTokens(): Promise<TokenPair | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${SERVICE_PREFIX}.tokens`,
    });
    if (credentials && credentials.password) {
      return JSON.parse(credentials.password) as TokenPair;
    }
    return null;
  } catch (err) {
    logger.error('Failed to retrieve tokens:', err);
    return null;
  }
}

export async function clearTokens(): Promise<boolean> {
  try {
    await Keychain.resetGenericPassword({
      service: `${SERVICE_PREFIX}.tokens`,
    });
    return true;
  } catch (err) {
    logger.error('Failed to clear tokens:', err);
    return false;
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const supportedType = await Keychain.getSupportedBiometryType();
    return supportedType !== null;
  } catch {
    return false;
  }
}
