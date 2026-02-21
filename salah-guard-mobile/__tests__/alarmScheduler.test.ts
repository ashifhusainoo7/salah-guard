import PushNotification from 'react-native-push-notification';
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
  });

  describe('initializeNotificationChannel', () => {
    it('creates a notification channel', () => {
      initializeNotificationChannel();
      expect(PushNotification.createChannel).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelAllScheduledAlarms', () => {
    it('cancels all local notifications', () => {
      cancelAllScheduledAlarms();
      expect(PushNotification.cancelAllLocalNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduleAllAlarms', () => {
    it('schedules notifications for enabled prayers', () => {
      const prayers = createPrayers();
      scheduleAllAlarms(prayers, true);

      // Should cancel existing and schedule new ones
      expect(PushNotification.cancelAllLocalNotifications).toHaveBeenCalled();
      // 2 enabled prayers = 2 enable + 2 disable = 4 notifications
      expect(PushNotification.localNotificationSchedule).toHaveBeenCalledTimes(4);
    });

    it('does not schedule when globally inactive', () => {
      const prayers = createPrayers();
      scheduleAllAlarms(prayers, false);

      expect(PushNotification.cancelAllLocalNotifications).toHaveBeenCalled();
      expect(PushNotification.localNotificationSchedule).not.toHaveBeenCalled();
    });

    it('does not schedule for disabled prayers', () => {
      const prayers = createPrayers().map((p) => ({
        ...p,
        isEnabled: false,
      }));
      scheduleAllAlarms(prayers, true);

      expect(PushNotification.localNotificationSchedule).not.toHaveBeenCalled();
    });
  });
});
