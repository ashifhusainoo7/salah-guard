/**
 * Utility functions for prayer schedule logic.
 */
import type { Prayer } from '../types';
import { getCurrentDayAbbr, getMillisUntilTime } from './timeUtils';

/**
 * Finds the next upcoming enabled prayer based on current time and active days.
 */
export function getNextPrayer(prayers: Prayer[]): Prayer | null {
  const currentDay = getCurrentDayAbbr();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const enabledToday = prayers.filter(
    (p) => p.isEnabled && p.activeDays.includes(currentDay),
  );

  // Find prayers that haven't passed yet today
  const upcoming = enabledToday.filter((p) => {
    const [hours, minutes] = p.scheduledTime.split(':').map(Number);
    const prayerMinutes = (hours ?? 0) * 60 + (minutes ?? 0);
    return prayerMinutes > currentMinutes;
  });

  if (upcoming.length > 0) {
    return upcoming.sort((a, b) => {
      const aMs = getMillisUntilTime(a.scheduledTime);
      const bMs = getMillisUntilTime(b.scheduledTime);
      return aMs - bMs;
    })[0] ?? null;
  }

  // All prayers have passed today, return the first enabled prayer (next day)
  const allEnabled = prayers.filter((p) => p.isEnabled);
  if (allEnabled.length === 0) return null;

  return allEnabled.sort((a, b) => {
    const aMs = getMillisUntilTime(a.scheduledTime);
    const bMs = getMillisUntilTime(b.scheduledTime);
    return aMs - bMs;
  })[0] ?? null;
}

/**
 * Checks if two prayers overlap within their DND windows.
 * If prayer B starts within prayer A's DND duration, they overlap.
 */
export function checkOverlap(
  prayerA: Prayer,
  prayerB: Prayer,
): boolean {
  const [aHours, aMinutes] = prayerA.scheduledTime.split(':').map(Number);
  const [bHours, bMinutes] = prayerB.scheduledTime.split(':').map(Number);

  const aStartMinutes = (aHours ?? 0) * 60 + (aMinutes ?? 0);
  const aEndMinutes = aStartMinutes + prayerA.durationMinutes;
  const bStartMinutes = (bHours ?? 0) * 60 + (bMinutes ?? 0);

  return bStartMinutes >= aStartMinutes && bStartMinutes < aEndMinutes;
}

/**
 * Merges overlapping prayer windows and returns DND windows with extended durations.
 */
export function getMergedDndWindows(
  prayers: Prayer[],
): Array<{ startTime: string; durationMinutes: number; prayerNames: string[] }> {
  const currentDay = getCurrentDayAbbr();
  const enabled = prayers
    .filter((p) => p.isEnabled && p.activeDays.includes(currentDay))
    .sort((a, b) => {
      const [aH, aM] = a.scheduledTime.split(':').map(Number);
      const [bH, bM] = b.scheduledTime.split(':').map(Number);
      return ((aH ?? 0) * 60 + (aM ?? 0)) - ((bH ?? 0) * 60 + (bM ?? 0));
    });

  if (enabled.length === 0) return [];

  const windows: Array<{
    startTime: string;
    durationMinutes: number;
    prayerNames: string[];
  }> = [];

  let currentWindow = {
    startTime: enabled[0]!.scheduledTime,
    durationMinutes: enabled[0]!.durationMinutes,
    prayerNames: [enabled[0]!.name],
  };

  for (let i = 1; i < enabled.length; i++) {
    const prayer = enabled[i]!;
    const [cwH, cwM] = currentWindow.startTime.split(':').map(Number);
    const cwStartMin = (cwH ?? 0) * 60 + (cwM ?? 0);
    const cwEndMin = cwStartMin + currentWindow.durationMinutes;

    const [pH, pM] = prayer.scheduledTime.split(':').map(Number);
    const pStartMin = (pH ?? 0) * 60 + (pM ?? 0);

    if (pStartMin <= cwEndMin) {
      // Overlap: extend the window
      const newEndMin = Math.max(cwEndMin, pStartMin + prayer.durationMinutes);
      currentWindow.durationMinutes = newEndMin - cwStartMin;
      currentWindow.prayerNames.push(prayer.name);
    } else {
      windows.push(currentWindow);
      currentWindow = {
        startTime: prayer.scheduledTime,
        durationMinutes: prayer.durationMinutes,
        prayerNames: [prayer.name],
      };
    }
  }

  windows.push(currentWindow);
  return windows;
}

/**
 * Returns a color for a prayer based on its position in the daily schedule.
 */
export function getPrayerColor(prayerName: string): string {
  const colorMap: Record<string, string> = {
    Fajr: '#4A90D9',
    Dhuhr: '#F59E0B',
    Asr: '#F97316',
    Maghrib: '#F43F5E',
    Isha: '#8B5CF6',
  };
  return colorMap[prayerName] ?? '#10B981';
}
