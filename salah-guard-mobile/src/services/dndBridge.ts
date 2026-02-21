/**
 * Bridge to the native Android DND module.
 * Wraps NativeModules.DndModule with type safety and error handling.
 */
import { NativeModules, Platform } from 'react-native';
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
 * Returns false on non-Android platforms or if permission is not granted.
 */
export async function enableDnd(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeDnd) {
    logger.warn('DND module not available on this platform');
    return false;
  }

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

/**
 * Disables Do Not Disturb mode on Android.
 */
export async function disableDnd(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeDnd) {
    logger.warn('DND module not available on this platform');
    return false;
  }

  try {
    return await nativeDnd.disableDnd();
  } catch (err) {
    logger.error('Failed to disable DND:', err);
    return false;
  }
}

/**
 * Checks whether DND is currently enabled.
 */
export async function isDndEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeDnd) {
    return false;
  }

  try {
    return await nativeDnd.isDndEnabled();
  } catch (err) {
    logger.error('Failed to check DND status:', err);
    return false;
  }
}

/**
 * Checks whether the app has DND access permission.
 */
export async function hasDndPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeDnd) {
    return false;
  }

  try {
    return await nativeDnd.hasDndPermission();
  } catch (err) {
    logger.error('Failed to check DND permission:', err);
    return false;
  }
}

/**
 * Opens the system settings screen for DND policy access.
 */
export async function requestDndPermission(): Promise<void> {
  if (Platform.OS !== 'android' || !nativeDnd) {
    logger.warn('DND permission request not available on this platform');
    return;
  }

  try {
    await nativeDnd.requestDndPermission();
  } catch (err) {
    logger.error('Failed to request DND permission:', err);
  }
}

/**
 * Requests exclusion from battery optimization.
 */
export async function requestBatteryOptimizationExclusion(): Promise<void> {
  if (Platform.OS !== 'android' || !nativeDnd) {
    return;
  }

  try {
    await nativeDnd.requestBatteryOptimizationExclusion();
  } catch (err) {
    logger.error('Failed to request battery optimization exclusion:', err);
  }
}
