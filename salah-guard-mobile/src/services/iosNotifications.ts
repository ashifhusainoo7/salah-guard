/**
 * iOS notification-based DND reminders.
 * Schedules local notifications at prayer start/end times to remind
 * users to toggle DND from Control Center.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Prayer } from '../types';
import logger from '../utils/logger';

/**
 * Request iOS notification permission.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return status === 'granted';
  } catch (err) {
    logger.error('Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Check whether notification permission is currently granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    logger.error('Failed to check notification permission:', err);
    return false;
  }
}

/**
 * Cancel all scheduled iOS notifications.
 */
export async function cancelAllIosNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    logger.info('iOS: cancelled all scheduled notifications');
  } catch (err) {
    logger.error('Failed to cancel iOS notifications:', err);
  }
}

/**
 * Get the current day abbreviation (e.g. "Mon", "Tue").
 */
function getTodayAbbrev(): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

/**
 * Schedule iOS prayer notifications for all enabled prayers.
 * Cancels existing notifications first, then schedules daily triggers
 * for each prayer start/end time.
 */
export async function scheduleIosPrayerNotifications(prayers: Prayer[]): Promise<void> {
  if (Platform.OS !== 'ios') return;

  const permitted = await hasNotificationPermission();
  if (!permitted) {
    logger.warn('iOS: notification permission not granted — skipping schedule');
    return;
  }

  await cancelAllIosNotifications();

  const today = getTodayAbbrev();
  const enabledPrayers = prayers.filter(
    (p) => p.isEnabled && p.activeDays.includes(today),
  );

  if (enabledPrayers.length === 0) {
    logger.info('iOS: no enabled prayers active today — nothing to schedule');
    return;
  }

  for (const prayer of enabledPrayers) {
    const [hourStr, minStr] = prayer.scheduledTime.split(':');
    const startHour = parseInt(hourStr, 10);
    const startMinute = parseInt(minStr, 10);

    // Calculate end time
    const totalEndMinutes = startHour * 60 + startMinute + prayer.durationMinutes;
    const endHour = Math.floor(totalEndMinutes / 60) % 24;
    const endMinute = totalEndMinutes % 60;

    // Schedule "start" notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayer.name} Prayer Time`,
          body: 'Swipe down and turn on Do Not Disturb',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: startHour,
          minute: startMinute,
        },
      });
    } catch (err) {
      logger.error(`iOS: failed to schedule start notification for ${prayer.name}:`, err);
    }

    // Schedule "end" notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayer.name} Prayer Ended`,
          body: 'You can turn off Do Not Disturb now',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: endHour,
          minute: endMinute,
        },
      });
    } catch (err) {
      logger.error(`iOS: failed to schedule end notification for ${prayer.name}:`, err);
    }
  }

  logger.info(`iOS: scheduled notifications for ${enabledPrayers.length} prayers`);
}
