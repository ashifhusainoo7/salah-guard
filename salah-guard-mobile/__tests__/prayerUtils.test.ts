import type { Prayer } from '../src/types';
import {
  getNextPrayer,
  checkOverlap,
  getMergedDndWindows,
  getPrayerColor,
} from '../src/utils/prayerUtils';

const createPrayer = (overrides: Partial<Prayer> = {}): Prayer => ({
  id: 1,
  name: 'Fajr',
  arabicName: 'فجر',
  scheduledTime: '05:00',
  durationMinutes: 15,
  isEnabled: true,
  activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ...overrides,
});

describe('prayerUtils', () => {
  describe('getNextPrayer', () => {
    it('returns null for empty array', () => {
      expect(getNextPrayer([])).toBeNull();
    });

    it('returns null when no prayers are enabled', () => {
      const prayers = [
        createPrayer({ isEnabled: false }),
        createPrayer({ id: 2, name: 'Dhuhr', isEnabled: false }),
      ];
      expect(getNextPrayer(prayers)).toBeNull();
    });

    it('returns an enabled prayer', () => {
      const prayers = [
        createPrayer({ scheduledTime: '23:59' }),
      ];
      const result = getNextPrayer(prayers);
      expect(result).not.toBeNull();
    });
  });

  describe('checkOverlap', () => {
    it('detects overlap when prayers are within duration', () => {
      const prayerA = createPrayer({ scheduledTime: '13:00', durationMinutes: 20 });
      const prayerB = createPrayer({
        id: 2,
        name: 'Asr',
        scheduledTime: '13:15',
      });
      expect(checkOverlap(prayerA, prayerB)).toBe(true);
    });

    it('returns false when prayers do not overlap', () => {
      const prayerA = createPrayer({ scheduledTime: '13:00', durationMinutes: 15 });
      const prayerB = createPrayer({
        id: 2,
        name: 'Asr',
        scheduledTime: '16:30',
      });
      expect(checkOverlap(prayerA, prayerB)).toBe(false);
    });
  });

  describe('getMergedDndWindows', () => {
    it('returns empty array for empty prayers', () => {
      expect(getMergedDndWindows([])).toEqual([]);
    });

    it('merges overlapping windows', () => {
      const prayers = [
        createPrayer({ scheduledTime: '13:00', durationMinutes: 25 }),
        createPrayer({
          id: 2,
          name: 'Asr',
          scheduledTime: '13:20',
          durationMinutes: 15,
        }),
      ];
      const windows = getMergedDndWindows(prayers);
      expect(windows.length).toBe(1);
      expect(windows[0]!.prayerNames).toContain('Fajr');
      expect(windows[0]!.prayerNames).toContain('Asr');
    });

    it('keeps non-overlapping windows separate', () => {
      const prayers = [
        createPrayer({ scheduledTime: '05:00', durationMinutes: 15 }),
        createPrayer({
          id: 2,
          name: 'Dhuhr',
          scheduledTime: '13:00',
          durationMinutes: 20,
        }),
      ];
      const windows = getMergedDndWindows(prayers);
      expect(windows.length).toBe(2);
    });
  });

  describe('getPrayerColor', () => {
    it('returns correct color for known prayers', () => {
      expect(getPrayerColor('Fajr')).toBe('#4A90D9');
      expect(getPrayerColor('Maghrib')).toBe('#E74C3C');
    });

    it('returns default color for unknown prayer', () => {
      expect(getPrayerColor('Unknown')).toBe('#1B5E20');
    });
  });
});
