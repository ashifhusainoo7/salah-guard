/**
 * Bridge to DND functionality.
 * Uses expo-intent-launcher for opening system settings in Expo Go,
 * falls back to NativeModules.DndModule for bare builds.
 */
import { NativeModules, Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import logger from '../utils/logger';

interface DndModuleInterface {
  enableDnd: () => Promise<boolean>;
  disableDnd: () => Promise<boolean>;
  isDndEnabled: () => Promise<boolean>;
  hasDndPermission: () => Promise<boolean>;
  requestDndPermission: () => Promise<void>;
  requestBatteryOptimizationExclusion: () => Promise<void>;
}

const { DndModule } = NativeModules;
const nativeDnd = DndModule as DndModuleInterface | undefined;

/**
 * Enables Do Not Disturb mode on Android.
 */
export async function enableDnd(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    logger.warn('DND module not available on this platform');
    return false;
  }

  if (nativeDnd) {
    try {
      const hasPermission = await nativeDnd.hasDndPermission();
      if (!hasPermission) {
        logger.warn('DND permission not granted');
        return false;
      }
      return await nativeDnd.enableDnd();
    } catch (err) {
      logger.error('Failed to enable DND:', err);
      return false;
    }
  }

  logger.warn('DND enable not available in Expo Go');
  return false;
}

/**
 * Disables Do Not Disturb mode on Android.
 */
export async function disableDnd(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (nativeDnd) {
    try {
      return await nativeDnd.disableDnd();
    } catch (err) {
      logger.error('Failed to disable DND:', err);
      return false;
    }
  }

  return false;
}

/**
 * Checks whether DND is currently enabled.
 */
export async function isDndEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (nativeDnd) {
    try {
      return await nativeDnd.isDndEnabled();
    } catch (err) {
      logger.error('Failed to check DND status:', err);
      return false;
    }
  }

  return false;
}

/**
 * Checks whether the app has DND access permission.
 * In Expo Go, always returns false since we can't check.
 */
export async function hasDndPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (nativeDnd) {
    try {
      return await nativeDnd.hasDndPermission();
    } catch (err) {
      logger.error('Failed to check DND permission:', err);
      return false;
    }
  }

  // In Expo Go we can't check, return null-ish false
  return false;
}

/**
 * Opens the system DND policy access settings screen.
 * Works in both Expo Go (via IntentLauncher) and bare builds (via NativeModule).
 */
export async function requestDndPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    logger.warn('DND permission request not available on this platform');
    return;
  }

  // Try native module first (bare build)
  if (nativeDnd) {
    try {
      await nativeDnd.requestDndPermission();
      return;
    } catch (err) {
      logger.error('Native DND permission request failed:', err);
    }
  }

  // Fallback: use expo-intent-launcher to open DND access settings
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
    );
  } catch (err) {
    logger.error('Failed to open DND settings via IntentLauncher:', err);
    // Last resort: open general app settings
    try {
      await Linking.openSettings();
    } catch {
      logger.error('Failed to open any settings screen');
    }
  }
}

/**
 * Opens the battery optimization exclusion settings screen.
 * Works in both Expo Go (via IntentLauncher) and bare builds.
 */
export async function requestBatteryOptimizationExclusion(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  // Try native module first (bare build)
  if (nativeDnd) {
    try {
      await nativeDnd.requestBatteryOptimizationExclusion();
      return;
    } catch (err) {
      logger.error('Native battery optimization request failed:', err);
    }
  }

  // Fallback: use expo-intent-launcher
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
    );
  } catch (err) {
    logger.error('Failed to open battery settings via IntentLauncher:', err);
    try {
      await Linking.openSettings();
    } catch {
      logger.error('Failed to open any settings screen');
    }
  }
}
