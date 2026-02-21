/**
 * Alarm scheduling service that manages DND activation/deactivation
 * via local notifications and background tasks.
 */
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import type { Prayer } from '../types';
import { enableDnd, disableDnd, hasDndPermission } from './dndBridge';
import { logDndSession } from './api';
import { getMergedDndWindows } from '../utils/prayerUtils';
import { getNextOccurrence } from '../utils/timeUtils';
import logger from '../utils/logger';

const CHANNEL_ID = 'salah-guard-dnd';
const ENABLE_PREFIX = 'dnd-enable-';
const DISABLE_PREFIX = 'dnd-disable-';

/**
 * Creates the notification channel for Android.
 */
export function initializeNotificationChannel(): void {
  if (Platform.OS !== 'android') return;

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: 'Salah Guard DND',
      channelDescription: 'Notifications for DND activation during prayer times',
      importance: 4,
      vibrate: false,
      playSound: false,
    },
    (created: boolean) => {
      logger.info(`Notification channel created: ${created}`);
    },
  );
}

/**
 * Cancels all previously scheduled DND notifications.
 */
export function cancelAllScheduledAlarms(): void {
  PushNotification.cancelAllLocalNotifications();
  logger.info('All scheduled DND alarms cancelled');
}

/**
 * Schedules DND enable/disable notifications for all active prayers.
 * Handles overlapping prayers by merging DND windows.
 */
export function scheduleAllAlarms(
  prayers: Prayer[],
  isGloballyActive: boolean,
): void {
  cancelAllScheduledAlarms();

  if (!isGloballyActive) {
    logger.info('Global toggle is off, skipping alarm scheduling');
    return;
  }

  const windows = getMergedDndWindows(prayers);

  windows.forEach((window, index) => {
    const enableTime = getNextOccurrence(window.startTime);
    const disableTime = new Date(
      enableTime.getTime() + window.durationMinutes * 60 * 1000,
    );

    // Schedule DND enable notification
    PushNotification.localNotificationSchedule({
      id: `${ENABLE_PREFIX}${index}`,
      channelId: CHANNEL_ID,
      title: 'Salah Guard',
      message: `DND enabled for ${window.prayerNames.join(', ')}`,
      date: enableTime,
      allowWhileIdle: true,
      importance: 'high',
      priority: 'high',
      playSound: false,
      vibrate: false,
      userInfo: {
        type: 'enable',
        prayerNames: window.prayerNames.join(','),
        durationMinutes: window.durationMinutes,
      },
    });

    // Schedule DND disable notification
    PushNotification.localNotificationSchedule({
      id: `${DISABLE_PREFIX}${index}`,
      channelId: CHANNEL_ID,
      title: 'Salah Guard',
      message: `DND lifted after ${window.prayerNames.join(', ')}`,
      date: disableTime,
      allowWhileIdle: true,
      importance: 'high',
      priority: 'high',
      playSound: false,
      vibrate: false,
      userInfo: {
        type: 'disable',
        prayerNames: window.prayerNames.join(','),
      },
    });

    logger.info(
      `Scheduled DND: ${window.prayerNames.join(',')} at ${enableTime.toISOString()} for ${window.durationMinutes}m`,
    );
  });
}

/**
 * Handles notification actions when they fire.
 * Called from the notification listener in the app setup.
 */
export async function handleNotificationAction(
  notification: { data?: { type?: string; prayerNames?: string; durationMinutes?: number } },
): Promise<void> {
  const data = notification.data;
  if (!data?.type) return;

  if (data.type === 'enable') {
    const hasPermission = await hasDndPermission();
    if (!hasPermission) {
      logger.warn('DND permission not available when alarm fired');
      return;
    }

    const success = await enableDnd();
    if (success) {
      logger.info(`DND enabled for: ${data.prayerNames}`);
    }
  } else if (data.type === 'disable') {
    const success = await disableDnd();
    if (success) {
      logger.info(`DND disabled after: ${data.prayerNames}`);

      // Log the completed session
      try {
        const endTime = new Date();
        const durationMinutes = data.durationMinutes ?? 15;
        const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);

        await logDndSession({
          prayerName: data.prayerNames ?? 'Unknown',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
          status: 'Completed',
        });
      } catch (err) {
        logger.error('Failed to log DND session:', err);
      }
    }
  }
}

/**
 * Configures the notification listener for handling scheduled alarms.
 */
export function configureNotificationListener(): void {
  PushNotification.configure({
    onNotification: (notification) => {
      handleNotificationAction(notification as {
        data?: { type?: string; prayerNames?: string; durationMinutes?: number };
      }).catch((err) => {
        logger.error('Error handling notification:', err);
      });
    },
    permissions: {
      alert: true,
      badge: false,
      sound: false,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });
}
