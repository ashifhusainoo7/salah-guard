/**
 * Alarm scheduling service — dual-layer approach:
 *
 * Layer 1 (App Open):  react-native-background-actions foreground service
 *   - Runs a JS loop that sleeps until prayer time, toggles DND, logs session
 *   - Works reliably while the app process is alive
 *   - Gets killed when user swipes the app away (JS runtime dies)
 *
 * Layer 2 (App Killed): Native AlarmManager.setAlarmClock() + BroadcastReceiver
 *   - Schedules exact alarms in Kotlin via DndModule.schedulePrayers()
 *   - DndAlarmReceiver toggles DND in pure native code — no JS needed
 *   - Survives app kill, screen off, Doze mode, and device reboot
 *   - Sessions logged to SharedPreferences, synced to JS on next app open
 *
 * Both layers run in parallel. When the app is open, the foreground service
 * handles DND directly. When the app is killed, native alarms take over.
 * On app re-open, pending native sessions are synced into local storage.
 *
 * iOS: Uses expo-notifications local notifications (DND can't be automated).
 */
import { Platform } from 'react-native';
import type { Prayer } from '../types';
import { getMergedDndWindows } from '../utils/prayerUtils';
import { getMillisUntilTime } from '../utils/timeUtils';
import { enableDnd, disableDnd } from './dndBridge';
import { scheduleNativeAlarms, cancelNativeAlarms } from './dndBridge';
import { scheduleIosPrayerNotifications, cancelAllIosNotifications } from './iosNotifications';
import { addDndSession } from '../utils/storage';
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
 * This is Layer 1 — works while the app process is alive.
 */
async function dndTaskLoop(): Promise<void> {
  const BackgroundService = getBackgroundService();
  if (!BackgroundService) return;

  // eslint-disable-next-line no-constant-condition
  while (BackgroundService.isRunning()) {
    try {
      const windows = getMergedDndWindows(cachedPrayers);

      if (windows.length === 0) {
        await sleep(5 * 60 * 1000);
        continue;
      }

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

      if (sleepMs > 1000) {
        logger.info(`DND: sleeping ${Math.round(sleepMs / 1000)}s until ${nextWindow.startTime} (${nextWindow.prayerNames.join(', ')})`);
        await sleep(sleepMs);
      }

      if (!BackgroundService.isRunning()) break;

      // Re-validate after sleep
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

      // Log the session to local storage
      try {
        addDndSession({
          prayerName: nextWindow.prayerNames.join(', '),
          startTime,
          endTime,
          durationMinutes: nextWindow.durationMinutes,
          status: 'Completed',
        });
        logger.info('DND: session logged locally');
      } catch (err) {
        logger.error('DND: failed to log session:', err);
      }
    } catch (err) {
      logger.error('DND: error in task loop:', err);
      await sleep(30 * 1000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initializes the notification channel.
 */
export function initializeNotificationChannel(): void {
  logger.info('DND: notification channel initialized');
}

/**
 * Cancels all scheduled alarms — both the foreground service and native alarms.
 */
export async function cancelAllScheduledAlarms(): Promise<void> {
  if (Platform.OS === 'ios') {
    await cancelAllIosNotifications();
    return;
  }

  // Cancel Layer 1: foreground service
  const BackgroundService = getBackgroundService();
  if (BackgroundService) {
    try {
      if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
        logger.info('DND: background service stopped');
      }
    } catch (err) {
      logger.error('DND: failed to stop background service:', err);
    }
  }

  // Cancel Layer 2: native AlarmManager alarms
  await cancelNativeAlarms();
  logger.info('DND: native alarms cancelled');
}

/**
 * Schedules DND for all enabled prayers using both layers:
 * 1. Background service foreground task (works while app is open)
 * 2. Native AlarmManager alarms (works when app is killed)
 */
export async function scheduleAllAlarms(
  prayers: Prayer[],
  isGloballyActive: boolean,
): Promise<void> {
  // Stop any existing scheduling
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

  // iOS: use local notifications
  if (Platform.OS === 'ios') {
    await scheduleIosPrayerNotifications(prayers);
    return;
  }

  // --- Layer 2: Native AlarmManager (safety net for when app is killed) ---
  // Schedule this FIRST so alarms are in place even if the foreground service fails
  const nativeSuccess = await scheduleNativeAlarms(prayers, isGloballyActive);
  if (nativeSuccess) {
    logger.info(`DND: native alarms scheduled for ${enabledPrayers.length} prayers`);
  } else {
    logger.warn('DND: failed to schedule native alarms — native module may not be linked');
  }

  // --- Layer 1: Background service (immediate DND when app is open) ---
  const BackgroundService = getBackgroundService();
  if (BackgroundService) {
    cachedPrayers = prayers;
    cachedIsGloballyActive = isGloballyActive;

    try {
      await BackgroundService.start(dndTaskLoop, BACKGROUND_TASK_OPTIONS);
      logger.info(`DND: background service started with ${enabledPrayers.length} enabled prayers`);
    } catch (err) {
      logger.error('DND: failed to start background service:', err);
    }
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
