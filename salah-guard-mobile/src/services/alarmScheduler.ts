/**
 * Alarm scheduling service stub for Expo Go compatibility.
 * In production, use react-native-push-notification with a native build.
 */
import type { Prayer } from '../types';
import logger from '../utils/logger';

export function initializeNotificationChannel(): void {
  logger.info('Notification channel init (stub in Expo Go)');
}

export function cancelAllScheduledAlarms(): void {
  logger.info('Cancel alarms (stub in Expo Go)');
}

export function scheduleAllAlarms(
  _prayers: Prayer[],
  _isGloballyActive: boolean,
): void {
  logger.info('Schedule alarms (stub in Expo Go)');
}

export async function handleNotificationAction(
  _notification: { data?: { type?: string; prayerNames?: string; durationMinutes?: number } },
): Promise<void> {
  // No-op in Expo Go
}

export function configureNotificationListener(): void {
  logger.info('Notification listener (stub in Expo Go)');
}
