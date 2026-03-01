import { Platform, NativeModules } from 'react-native';
import type { Prayer } from '../src/types';
import {
  scheduleAllAlarms,
  cancelAllScheduledAlarms,
  initializeNotificationChannel,
} from '../src/services/alarmScheduler';

jest.useFakeTimers();

const createPrayers = (): Prayer[] => [
  {
    id: 1,
    name: 'Fajr',
    arabicName: 'فجر',
    scheduledTime: '05:00',
    durationMinutes: 15,
    isEnabled: true,
    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 2,
    name: 'Dhuhr',
    arabicName: 'ظهر',
    scheduledTime: '13:00',
    durationMinutes: 20,
    isEnabled: true,
    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 3,
    name: 'Asr',
    arabicName: 'عصر',
    scheduledTime: '16:30',
    durationMinutes: 15,
    isEnabled: false,
    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
];

describe('alarmScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('initializeNotificationChannel', () => {
    it('runs without error', () => {
      expect(() => initializeNotificationChannel()).not.toThrow();
    });
  });

  describe('cancelAllScheduledAlarms', () => {
    it('calls cancelAllAlarms on Android', async () => {
      Platform.OS = 'android';
      await cancelAllScheduledAlarms();
      expect(NativeModules.DndModule.cancelAllAlarms).toHaveBeenCalled();
    });

    it('cancels iOS notifications on iOS', async () => {
      Platform.OS = 'ios';
      const Notifications = require('expo-notifications');
      await cancelAllScheduledAlarms();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('scheduleAllAlarms', () => {
    it('schedules native alarms for enabled prayers on Android', async () => {
      Platform.OS = 'android';
      const prayers = createPrayers();
      await scheduleAllAlarms(prayers, true);

      // Should call the native module to schedule prayers
      expect(NativeModules.DndModule.schedulePrayers).toHaveBeenCalledWith(
        expect.any(String),
        true,
      );
    });

    it('does not schedule when globally inactive', async () => {
      Platform.OS = 'android';
      const prayers = createPrayers();
      await scheduleAllAlarms(prayers, false);

      expect(NativeModules.DndModule.schedulePrayers).not.toHaveBeenCalled();
    });

    it('does not schedule for disabled prayers', async () => {
      Platform.OS = 'android';
      const prayers = createPrayers().map((p) => ({
        ...p,
        isEnabled: false,
      }));
      await scheduleAllAlarms(prayers, true);

      expect(NativeModules.DndModule.schedulePrayers).not.toHaveBeenCalled();
    });

    it('uses iOS notifications path on iOS', async () => {
      Platform.OS = 'ios';
      const Notifications = require('expo-notifications');
      const prayers = createPrayers();
      await scheduleAllAlarms(prayers, true);

      // Should schedule via expo-notifications, not native alarms
      expect(NativeModules.DndModule.schedulePrayers).not.toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });
  });
});
