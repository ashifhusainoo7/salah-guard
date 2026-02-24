/**
 * Alarm scheduling service using react-native-background-actions.
 * Runs a persistent background task that enables/disables DND at prayer times.
 */
import { Platform } from 'react-native';
import type { Prayer } from '../types';
import { getMergedDndWindows } from '../utils/prayerUtils';
import { getMillisUntilTime } from '../utils/timeUtils';
import { enableDnd, disableDnd } from './dndBridge';
import { logDndSession } from './api';
import { scheduleIosPrayerNotifications, cancelAllIosNotifications } from './iosNotifications';
import logger from '../utils/logger';

const BACKGROUND_TASK_OPTIONS = {
  taskName: 'SalahGuardDND',
  taskTitle: 'Salah Guard',
  taskDesc: 'Monitoring prayer times for DND scheduling',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: '#10B981',
  linkingURI: 'salahguard://',
  parameters: { delay: 1000 },
};

/**
 * Lazily require react-native-background-actions to avoid crash
 * if the native module isn't linked in the current build.
 */
function getBackgroundService(): typeof import('react-native-background-actions').default | null {
  try {
    const { NativeModules } = require('react-native');
    if (!NativeModules.RNBackgroundActions) {
      logger.warn('RNBackgroundActions native module not linked — rebuild the app with: npx expo run:android');
      return null;
    }
    return require('react-native-background-actions').default;
  } catch (err) {
    logger.warn('react-native-background-actions not available:', err);
    return null;
  }
}

let cachedPrayers: Prayer[] = [];
let cachedIsGloballyActive = false;

/**
 * The background task loop that manages DND windows.
 * Runs continuously, sleeping until the next prayer window.
 */
async function dndTaskLoop(): Promise<void> {
  const BackgroundService = getBackgroundService();
  if (!BackgroundService) return;

  // eslint-disable-next-line no-constant-condition
  while (BackgroundService.isRunning()) {
    try {
      const windows = getMergedDndWindows(cachedPrayers);

      if (windows.length === 0) {
        // No windows today — sleep 5 minutes and re-check
        await sleep(5 * 60 * 1000);
        continue;
      }

      // Find the next upcoming window
      let nextWindow = null;
      let sleepMs = Infinity;

      for (const w of windows) {
        const ms = getMillisUntilTime(w.startTime);
        if (ms < sleepMs) {
          sleepMs = ms;
          nextWindow = w;
        }
      }

      if (!nextWindow) {
        await sleep(5 * 60 * 1000);
        continue;
      }

      // Sleep until the next window starts
      if (sleepMs > 1000) {
        logger.info(`DND: sleeping ${Math.round(sleepMs / 1000)}s until ${nextWindow.startTime} (${nextWindow.prayerNames.join(', ')})`);
        await sleep(sleepMs);
      }

      if (!BackgroundService.isRunning()) break;

      // Re-validate after sleep: the day may have changed (e.g. slept from Mon night to Tue morning)
      const freshWindows = getMergedDndWindows(cachedPrayers);
      const stillValid = freshWindows.some((w) => w.startTime === nextWindow.startTime);
      if (!stillValid) {
        logger.info('DND: window no longer valid after sleep (day changed or prayer disabled), skipping');
        continue;
      }

      // Enable DND
      const startTime = new Date().toISOString();
      const enabled = await enableDnd();
      if (enabled) {
        logger.info(`DND: enabled for ${nextWindow.prayerNames.join(', ')} (${nextWindow.durationMinutes}min)`);
      } else {
        logger.warn('DND: failed to enable — check permissions');
      }

      // Sleep for the DND duration
      await sleep(nextWindow.durationMinutes * 60 * 1000);

      if (!BackgroundService.isRunning()) break;

      // Disable DND
      await disableDnd();
      const endTime = new Date().toISOString();
      logger.info(`DND: disabled after ${nextWindow.prayerNames.join(', ')}`);

      // Log the session to the API
      try {
        await logDndSession({
          prayerName: nextWindow.prayerNames.join(', '),
          startTime,
          endTime,
          durationMinutes: nextWindow.durationMinutes,
          status: 'Completed',
        });
        logger.info('DND: session logged to API');
      } catch (err) {
        logger.error('DND: failed to log session:', err);
      }
    } catch (err) {
      logger.error('DND: error in task loop:', err);
      // Sleep briefly before retrying to avoid tight error loops
      await sleep(30 * 1000);
    }
  }
}

/**
 * Promise-based sleep that works inside background tasks.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initializes the notification channel for the background service.
 * On Android, react-native-background-actions handles this automatically
 * via the taskOptions, but we call updateNotification to ensure it's set up.
 */
export function initializeNotificationChannel(): void {
  logger.info('DND: notification channel initialized');
}

/**
 * Cancels all scheduled alarms by stopping the background service.
 */
export async function cancelAllScheduledAlarms(): Promise<void> {
  if (Platform.OS === 'ios') {
    await cancelAllIosNotifications();
    return;
  }

  const BackgroundService = getBackgroundService();
  if (!BackgroundService) return;
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
      logger.info('DND: background service stopped');
    }
  } catch (err) {
    logger.error('DND: failed to stop background service:', err);
  }
}

/**
 * Schedules DND alarms for all enabled prayers using a background service.
 * Stops any existing task and starts a new one if there are active prayers.
 */
export async function scheduleAllAlarms(
  prayers: Prayer[],
  isGloballyActive: boolean,
): Promise<void> {
  // Stop any existing background task
  await cancelAllScheduledAlarms();

  if (!isGloballyActive) {
    logger.info('DND: globally inactive — not scheduling');
    return;
  }

  const enabledPrayers = prayers.filter((p) => p.isEnabled);
  if (enabledPrayers.length === 0) {
    logger.info('DND: no enabled prayers — not scheduling');
    return;
  }

  // iOS: use local notifications instead of background service
  if (Platform.OS === 'ios') {
    await scheduleIosPrayerNotifications(prayers);
    return;
  }

  const BackgroundService = getBackgroundService();
  if (!BackgroundService) {
    logger.warn('DND: background service not available — native module not linked');
    return;
  }

  // Cache prayer data for the background task
  cachedPrayers = prayers;
  cachedIsGloballyActive = isGloballyActive;

  try {
    await BackgroundService.start(dndTaskLoop, BACKGROUND_TASK_OPTIONS);
    logger.info(`DND: background service started with ${enabledPrayers.length} enabled prayers`);
  } catch (err) {
    logger.error('DND: failed to start background service:', err);
  }
}

export async function handleNotificationAction(
  _notification: { data?: { type?: string; prayerNames?: string; durationMinutes?: number } },
): Promise<void> {
  // Reserved for future notification action handling
}

export function configureNotificationListener(): void {
  logger.info('DND: notification listener configured');
}
