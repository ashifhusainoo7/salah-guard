/**
 * Utility functions for time parsing, formatting, and countdown calculations.
 */

/**
 * Parses a "HH:mm" string into hours and minutes.
 */
export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':');
  return {
    hours: parseInt(parts[0] ?? '0', 10),
    minutes: parseInt(parts[1] ?? '0', 10),
  };
}

/**
 * Converts hours and minutes to a "HH:mm" formatted string.
 */
export function formatTime(hours: number, minutes: number): string {
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Formats a Date object to "HH:mm".
 */
export function formatDateToTime(date: Date): string {
  return formatTime(date.getHours(), date.getMinutes());
}

/**
 * Gets the number of milliseconds from now until the given HH:mm time today or tomorrow.
 * If the time has already passed today, returns the time until tomorrow at that time.
 */
export function getMillisUntilTime(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Gets the Date object for a given HH:mm time today or tomorrow.
 */
export function getNextOccurrence(timeStr: string): Date {
  const { hours, minutes } = parseTime(timeStr);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Converts milliseconds to a human-readable countdown string (e.g., "2h 15m").
 */
export function formatCountdown(millis: number): string {
  if (millis <= 0) return '0m';

  const totalSeconds = Math.floor(millis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Formats an ISO date string to a localized time string.
 */
export function formatIsoToTime(isoString: string): string {
  const date = new Date(isoString);
  return formatTime(date.getHours(), date.getMinutes());
}

/**
 * Formats an ISO date string to a localized date + time string.
 */
export function formatIsoToDateTime(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const time = formatTime(date.getHours(), date.getMinutes());
  return `${day}/${month}/${year} ${time}`;
}

/**
 * Gets the current day abbreviation (Mon, Tue, etc.).
 */
export function getCurrentDayAbbr(): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()] ?? 'Mon';
}

/**
 * Checks whether a given day abbreviation is today.
 */
export function isToday(dayAbbr: string): boolean {
  return getCurrentDayAbbr() === dayAbbr;
}
