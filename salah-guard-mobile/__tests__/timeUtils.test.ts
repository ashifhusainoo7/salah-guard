import {
  parseTime,
  formatTime,
  formatCountdown,
  getMillisUntilTime,
  formatIsoToTime,
  getCurrentDayAbbr,
} from '../src/utils/timeUtils';

describe('timeUtils', () => {
  describe('parseTime', () => {
    it('parses HH:mm string correctly', () => {
      expect(parseTime('05:30')).toEqual({ hours: 5, minutes: 30 });
    });

    it('parses midnight correctly', () => {
      expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 });
    });

    it('parses 23:59 correctly', () => {
      expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
    });
  });

  describe('formatTime', () => {
    it('formats hours and minutes with leading zeros', () => {
      expect(formatTime(5, 3)).toBe('05:03');
    });

    it('formats double-digit values', () => {
      expect(formatTime(13, 45)).toBe('13:45');
    });
  });

  describe('formatCountdown', () => {
    it('returns 0m for non-positive values', () => {
      expect(formatCountdown(0)).toBe('0m');
      expect(formatCountdown(-100)).toBe('0m');
    });

    it('formats seconds only', () => {
      expect(formatCountdown(30000)).toBe('30s');
    });

    it('formats minutes and seconds', () => {
      expect(formatCountdown(90000)).toBe('1m 30s');
    });

    it('formats hours and minutes', () => {
      expect(formatCountdown(7500000)).toBe('2h 5m');
    });
  });

  describe('getMillisUntilTime', () => {
    it('returns positive value for future time', () => {
      // Use a time that will definitely be in the future
      const futureTime = '23:59';
      const now = new Date();
      if (now.getHours() < 23 || (now.getHours() === 23 && now.getMinutes() < 59)) {
        expect(getMillisUntilTime(futureTime)).toBeGreaterThan(0);
      }
    });

    it('wraps to next day for past time', () => {
      const result = getMillisUntilTime('00:00');
      expect(result).toBeGreaterThan(0);
      // Should be less than 24 hours
      expect(result).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });

  describe('formatIsoToTime', () => {
    it('extracts time from ISO string in 12-hour format', () => {
      const result = formatIsoToTime('2024-01-15T13:45:00.000Z');
      // Returns 12-hour format like "1:45 PM" or "7:15 PM" (depends on timezone)
      expect(result).toMatch(/^\d{1,2}:\d{2}\s(AM|PM)$/);
    });
  });

  describe('getCurrentDayAbbr', () => {
    it('returns a valid day abbreviation', () => {
      const validDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      expect(validDays).toContain(getCurrentDayAbbr());
    });
  });
});
