/* eslint-disable @typescript-eslint/no-empty-function */

// Mock native modules that are NOT installed (virtual mocks)
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
  })),
}), { virtual: true });

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  getSupportedBiometryType: jest.fn().mockResolvedValue(null),
}), { virtual: true });

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  createChannel: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
}), { virtual: true });

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:5000',
}), { virtual: true });

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
}), { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'Icon',
}));

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn().mockResolvedValue({ resultCode: 0 }),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  wrap: (component: unknown) => component,
}), { virtual: true });

jest.mock('react-native-reanimated', () => ({
  default: { call: () => {} },
  useSharedValue: jest.fn(),
  useAnimatedStyle: jest.fn().mockReturnValue({}),
  withTiming: jest.fn(),
  withSpring: jest.fn(),
  Easing: { linear: jest.fn() },
}));

// Set up DndModule on NativeModules directly
const { NativeModules } = require('react-native');
NativeModules.DndModule = {
  enableDnd: jest.fn().mockResolvedValue(true),
  disableDnd: jest.fn().mockResolvedValue(true),
  isDndEnabled: jest.fn().mockResolvedValue(false),
  hasDndPermission: jest.fn().mockResolvedValue(true),
  requestDndPermission: jest.fn().mockResolvedValue(undefined),
  isBatteryOptimizationExcluded: jest.fn().mockResolvedValue(false),
  requestBatteryOptimizationExclusion: jest.fn().mockResolvedValue(undefined),
  saveNotificationSettings: jest.fn().mockResolvedValue(true),
  schedulePrayers: jest.fn().mockResolvedValue(true),
  cancelAllAlarms: jest.fn().mockResolvedValue(true),
  getPendingSessions: jest.fn().mockResolvedValue('[]'),
  clearPendingSessions: jest.fn().mockResolvedValue(true),
};

jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
    simplePrompt: jest.fn().mockResolvedValue({ success: false }),
  })),
}), { virtual: true });

jest.mock('react-native-jail-monkey', () => ({
  isJailBroken: jest.fn().mockReturnValue(false),
}), { virtual: true });

jest.mock('react-native-ssl-pinning', () => ({
  fetch: jest.fn(),
}), { virtual: true });

jest.mock('react-native-background-actions', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    updateNotification: jest.fn(),
    isRunning: jest.fn().mockReturnValue(false),
  },
}));

// Silence warnings in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
