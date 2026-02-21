/* eslint-disable @typescript-eslint/no-empty-function */

// Mock native modules
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
  })),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(null),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  getSupportedBiometryType: jest.fn().mockResolvedValue(null),
}));

jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  createChannel: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
}));

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://localhost:5000',
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  wrap: (component: unknown) => component,
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/NativeModules/NativeModules', () => ({
  DndModule: {
    enableDnd: jest.fn().mockResolvedValue(true),
    disableDnd: jest.fn().mockResolvedValue(true),
    isDndEnabled: jest.fn().mockResolvedValue(false),
    hasDndPermission: jest.fn().mockResolvedValue(true),
    requestDndPermission: jest.fn().mockResolvedValue(undefined),
    requestBatteryOptimizationExclusion: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
    simplePrompt: jest.fn().mockResolvedValue({ success: false }),
  })),
}));

jest.mock('react-native-jail-monkey', () => ({
  isJailBroken: jest.fn().mockReturnValue(false),
}));

jest.mock('react-native-ssl-pinning', () => ({
  fetch: jest.fn(),
}));

jest.mock('react-native-background-actions', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  updateNotification: jest.fn(),
  isRunning: jest.fn().mockReturnValue(false),
}));

// Silence warnings in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
