/**
 * Bug 4: Verify battery optimization status is checked and displayed dynamically.
 *
 * Tests:
 * 1. SettingsScreen imports and calls isBatteryOptimizationExcluded
 * 2. dndBridge.isBatteryOptimizationExcluded calls the native module correctly
 * 3. The UI conditionally renders "Granted" vs "Tap to configure" based on state
 */
import { Platform, NativeModules } from 'react-native';

// Mock native modules before importing dndBridge
jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(),
}));

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../src/services/iosNotifications', () => ({
  hasNotificationPermission: jest.fn().mockResolvedValue(false),
}));

const fs = require('fs');
const path = require('path');

describe('Bug 4: Battery optimization status display', () => {
  describe('SettingsScreen source code verification', () => {
    const settingsSource = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
      'utf8',
    );

    it('imports isBatteryOptimizationExcluded from dndBridge', () => {
      expect(settingsSource).toContain('isBatteryOptimizationExcluded');
      // Verify it's in the import block
      const importBlock = settingsSource.substring(
        settingsSource.indexOf("from '../services/dndBridge'") - 200,
        settingsSource.indexOf("from '../services/dndBridge'"),
      );
      expect(importBlock).toContain('isBatteryOptimizationExcluded');
    });

    it('declares hasBatteryExclusion state', () => {
      expect(settingsSource).toContain('hasBatteryExclusion');
      expect(settingsSource).toContain('setHasBatteryExclusion');
      expect(settingsSource).toMatch(
        /useState<boolean \| null>\(null\)/,
      );
    });

    it('calls isBatteryOptimizationExcluded in checkDndStatus for Android', () => {
      // The call should be in the else (Android) branch of checkDndStatus
      const checkDndBlock = settingsSource.substring(
        settingsSource.indexOf('const checkDndStatus'),
        settingsSource.indexOf('const handleToggle'),
      );
      expect(checkDndBlock).toContain('isBatteryOptimizationExcluded()');
      expect(checkDndBlock).toContain('setHasBatteryExclusion');
    });

    it('renders dynamic battery status based on hasBatteryExclusion state', () => {
      // Should show "Granted" when hasBatteryExclusion is true
      expect(settingsSource).toContain("hasBatteryExclusion ? 'Granted' : 'Tap to configure'");
    });

    it('uses green color when battery exclusion is granted', () => {
      // Should use successBg and success colors when granted
      expect(settingsSource).toContain(
        'hasBatteryExclusion ? colors.status.successBg : colors.bg.cardHover',
      );
      expect(settingsSource).toContain(
        'hasBatteryExclusion ? colors.status.success : colors.text.muted',
      );
    });
  });

  describe('dndBridge.isBatteryOptimizationExcluded', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('returns the native module result when excluded (true)', async () => {
      NativeModules.DndModule = {
        isBatteryOptimizationExcluded: jest.fn().mockResolvedValue(true),
      };
      Platform.OS = 'android';

      const { isBatteryOptimizationExcluded } = require('../src/services/dndBridge');
      const result = await isBatteryOptimizationExcluded();
      expect(result).toBe(true);
      expect(NativeModules.DndModule.isBatteryOptimizationExcluded).toHaveBeenCalled();
    });

    it('returns the native module result when not excluded (false)', async () => {
      NativeModules.DndModule = {
        isBatteryOptimizationExcluded: jest.fn().mockResolvedValue(false),
      };
      Platform.OS = 'android';

      const { isBatteryOptimizationExcluded } = require('../src/services/dndBridge');
      const result = await isBatteryOptimizationExcluded();
      expect(result).toBe(false);
    });

    it('returns true on iOS (not applicable)', async () => {
      Platform.OS = 'ios';

      const { isBatteryOptimizationExcluded } = require('../src/services/dndBridge');
      const result = await isBatteryOptimizationExcluded();
      expect(result).toBe(true);
    });

    it('returns false when native module is unavailable', async () => {
      NativeModules.DndModule = undefined;
      Platform.OS = 'android';

      const { isBatteryOptimizationExcluded } = require('../src/services/dndBridge');
      const result = await isBatteryOptimizationExcluded();
      expect(result).toBe(false);
    });
  });
});
