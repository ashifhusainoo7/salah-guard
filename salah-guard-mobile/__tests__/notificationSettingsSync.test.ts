/**
 * Bug 5: Verify notification toggles are synced to native SharedPreferences
 * so DndAlarmReceiver respects them when deciding to show notifications.
 *
 * Tests cover:
 * 1. DndModule template has saveNotificationSettings ReactMethod
 * 2. DndAlarmReceiver template reads notify_on_start / notify_on_lifted prefs
 * 3. dndBridge.saveNotificationSettings calls native module
 * 4. useSalahStore syncs notification settings on init and update
 */
import { Platform, NativeModules } from 'react-native';

// Mock native modules
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

const pluginSource = fs.readFileSync(
  path.join(__dirname, '..', 'plugins', 'withDndModule.js'),
  'utf8',
);

// Extract templates
const moduleMatch = pluginSource.match(/const DND_MODULE_KT = `([\s\S]*?)`;/);
const moduleTemplate = moduleMatch ? moduleMatch[1] : '';

const receiverMatch = pluginSource.match(
  /const DND_ALARM_RECEIVER_KT = `([\s\S]*?)`;/,
);
const receiverTemplate = receiverMatch ? receiverMatch[1] : '';

describe('Bug 5: Notification settings sync to native', () => {
  describe('DndModule template - saveNotificationSettings ReactMethod', () => {
    it('contains saveNotificationSettings method', () => {
      expect(moduleTemplate).toContain('fun saveNotificationSettings');
    });

    it('has @ReactMethod annotation on saveNotificationSettings', () => {
      const methodIdx = moduleTemplate.indexOf('fun saveNotificationSettings');
      const preceding = moduleTemplate.substring(
        Math.max(0, methodIdx - 50),
        methodIdx,
      );
      expect(preceding).toContain('@ReactMethod');
    });

    it('accepts silentOnStart and showLifted boolean parameters', () => {
      expect(moduleTemplate).toContain(
        'fun saveNotificationSettings(silentOnStart: Boolean, showLifted: Boolean, promise: Promise)',
      );
    });

    it('writes notify_on_start to SharedPreferences', () => {
      expect(moduleTemplate).toContain('.putBoolean("notify_on_start", silentOnStart)');
    });

    it('writes notify_on_lifted to SharedPreferences', () => {
      expect(moduleTemplate).toContain('.putBoolean("notify_on_lifted", showLifted)');
    });

    it('uses the correct SharedPreferences name', () => {
      // Should use "salah_guard_prefs" to match DndAlarmReceiver
      const saveBlock = moduleTemplate.substring(
        moduleTemplate.indexOf('fun saveNotificationSettings'),
        moduleTemplate.indexOf('fun saveNotificationSettings') + 500,
      );
      expect(saveBlock).toContain('salah_guard_prefs');
    });
  });

  describe('DndAlarmReceiver template - notification pref checks', () => {
    it('reads notify_on_start pref in handleEnableDnd', () => {
      const enableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleEnableDnd'),
        receiverTemplate.indexOf('fun handleDisableDnd'),
      );
      expect(enableBlock).toContain('getBoolean("notify_on_start"');
    });

    it('defaults notify_on_start to true', () => {
      const enableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleEnableDnd'),
        receiverTemplate.indexOf('fun handleDisableDnd'),
      );
      expect(enableBlock).toContain('getBoolean("notify_on_start", true)');
    });

    it('conditionally shows notification on DND start', () => {
      const enableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleEnableDnd'),
        receiverTemplate.indexOf('fun handleDisableDnd'),
      );
      expect(enableBlock).toContain('notifyOnStart');
      expect(enableBlock).toContain('if (notifyOnStart)');
      expect(enableBlock).toContain('showNotification');
    });

    it('reads notify_on_lifted pref in handleDisableDnd', () => {
      const disableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleDisableDnd'),
        receiverTemplate.indexOf('fun showNotification'),
      );
      expect(disableBlock).toContain('getBoolean("notify_on_lifted"');
    });

    it('defaults notify_on_lifted to true', () => {
      const disableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleDisableDnd'),
        receiverTemplate.indexOf('fun showNotification'),
      );
      expect(disableBlock).toContain('getBoolean("notify_on_lifted", true)');
    });

    it('conditionally shows notification on DND lifted', () => {
      const disableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleDisableDnd'),
        receiverTemplate.indexOf('fun showNotification'),
      );
      expect(disableBlock).toContain('notifyOnLifted');
      expect(disableBlock).toContain('if (notifyOnLifted)');
      expect(disableBlock).toContain('showNotification');
    });

    it('still always disables DND regardless of notification pref', () => {
      // setInterruptionFilter(ALL) should happen before the notification check
      const disableBlock = receiverTemplate.substring(
        receiverTemplate.indexOf('fun handleDisableDnd'),
        receiverTemplate.indexOf('fun showNotification'),
      );
      const filterAllIdx = disableBlock.indexOf('INTERRUPTION_FILTER_ALL');
      const notifyCheckIdx = disableBlock.indexOf('notifyOnLifted');
      expect(filterAllIdx).toBeGreaterThan(-1);
      expect(notifyCheckIdx).toBeGreaterThan(-1);
      expect(filterAllIdx).toBeLessThan(notifyCheckIdx);
    });
  });

  describe('dndBridge.saveNotificationSettings', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('calls native module with correct parameters', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      NativeModules.DndModule = {
        saveNotificationSettings: mockSave,
      };
      Platform.OS = 'android';

      const { saveNotificationSettings } = require('../src/services/dndBridge');
      await saveNotificationSettings(true, false);

      expect(mockSave).toHaveBeenCalledWith(true, false);
    });

    it('calls with both false', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      NativeModules.DndModule = {
        saveNotificationSettings: mockSave,
      };
      Platform.OS = 'android';

      const { saveNotificationSettings } = require('../src/services/dndBridge');
      await saveNotificationSettings(false, false);

      expect(mockSave).toHaveBeenCalledWith(false, false);
    });

    it('does nothing on iOS', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      NativeModules.DndModule = {
        saveNotificationSettings: mockSave,
      };
      Platform.OS = 'ios';

      const { saveNotificationSettings } = require('../src/services/dndBridge');
      await saveNotificationSettings(true, true);

      expect(mockSave).not.toHaveBeenCalled();
    });

    it('does not throw when native module is unavailable', async () => {
      NativeModules.DndModule = undefined;
      Platform.OS = 'android';

      const { saveNotificationSettings } = require('../src/services/dndBridge');
      // Should not throw
      await expect(
        saveNotificationSettings(true, true),
      ).resolves.toBeUndefined();
    });

    it('handles native module errors gracefully', async () => {
      NativeModules.DndModule = {
        saveNotificationSettings: jest.fn().mockRejectedValue(new Error('test error')),
      };
      Platform.OS = 'android';

      const { saveNotificationSettings } = require('../src/services/dndBridge');
      // Should not throw, just log the error
      await expect(
        saveNotificationSettings(true, true),
      ).resolves.toBeUndefined();
    });
  });

  describe('useSalahStore - notification settings sync', () => {
    const storeSource = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'store', 'useSalahStore.ts'),
      'utf8',
    );

    it('imports saveNotificationSettings from dndBridge', () => {
      expect(storeSource).toContain('saveNotificationSettings');
      // Extract imports — find the line containing the dndBridge import
      const lines = storeSource.split(/\r?\n/);
      const dndBridgeImportLine = lines.find(
        (l: string) => l.includes('dndBridge') && l.includes('import'),
      );
      expect(dndBridgeImportLine).toBeDefined();
      expect(storeSource).toContain("saveNotificationSettings } from '../services/dndBridge'");
    });

    it('calls saveNotificationSettings in initialize()', () => {
      const initBlock = storeSource.substring(
        storeSource.indexOf('initialize: async ()'),
        storeSource.indexOf('loadPrayers: async ()'),
      );
      expect(initBlock).toContain('saveNotificationSettings');
      expect(initBlock).toContain('silentNotificationOnStart');
      expect(initBlock).toContain('showLiftedNotification');
    });

    it('calls saveNotificationSettings in updateSettings()', () => {
      const updateBlock = storeSource.substring(
        storeSource.indexOf('updateSettings: async ('),
        storeSource.indexOf('loadHistory: async ('),
      );
      expect(updateBlock).toContain('saveNotificationSettings');
      expect(updateBlock).toContain('silentNotificationOnStart');
      expect(updateBlock).toContain('showLiftedNotification');
    });

    it('passes settings fields to saveNotificationSettings correctly', () => {
      // Should pass settings.silentNotificationOnStart and settings.showLiftedNotification
      expect(storeSource).toContain(
        'saveNotificationSettings(settings.silentNotificationOnStart, settings.showLiftedNotification)',
      );
    });
  });
});
