/**
 * Zustand store for global app state management.
 * All data is local — no network calls.
 */
import { create } from 'zustand';
import type {
  DndSession,
  Prayer,
  PrayerUpdatePayload,
  UserSettings,
} from '../types';
import {
  initializeAppData,
  getPrayers,
  updatePrayer as storageUpdatePrayer,
  getSettings,
  updateLocalSettings,
  getHistory,
  addDndSession,
  defaultPrayers,
  defaultSettings,
} from '../utils/storage';
import { scheduleAllAlarms } from '../services/alarmScheduler';
import { getPendingNativeSessions, clearPendingNativeSessions, saveNotificationSettings } from '../services/dndBridge';

interface SalahState {
  // Data
  prayers: Prayer[];
  settings: UserSettings;
  history: DndSession[];
  historyPage: number;
  historyTotalPages: number;

  // UI State
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadPrayers: () => Promise<void>;
  updatePrayer: (id: number, data: PrayerUpdatePayload) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (data: UserSettings) => Promise<void>;
  loadHistory: (page?: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
  toggleGlobalActive: () => Promise<void>;
}

/**
 * Merges a partial prayers array with defaults so all 6 are always present.
 */
function mergePrayers(source: Prayer[]): Prayer[] {
  return defaultPrayers.map((def) => {
    const match = source.find((p) => p.name === def.name);
    return match ?? def;
  });
}

const useSalahStore = create<SalahState>((set, get) => ({
  prayers: defaultPrayers,
  settings: defaultSettings,
  history: [],
  historyPage: 1,
  historyTotalPages: 1,
  isLoading: false,
  isRefreshing: false,

  initialize: async () => {
    await initializeAppData();
    const prayers = mergePrayers(getPrayers());
    const settings = getSettings();
    set({ prayers, settings });
    scheduleAllAlarms(prayers, settings.isGloballyActive);
    saveNotificationSettings(settings.silentNotificationOnStart, settings.showLiftedNotification);

    // Sync DND sessions that completed while the app was closed
    try {
      const pendingSessions = await getPendingNativeSessions();
      for (const session of pendingSessions) {
        addDndSession({
          prayerName: session.prayerName,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: session.durationMinutes,
          status: session.status || 'Completed',
        });
      }
      if (pendingSessions.length > 0) {
        await clearPendingNativeSessions();
      }
    } catch {
      // Non-critical — sessions will sync next time
    }
  },

  loadPrayers: async () => {
    set({ isLoading: true });
    const prayers = mergePrayers(getPrayers());
    set({ prayers, isLoading: false });
    scheduleAllAlarms(prayers, get().settings.isGloballyActive);
  },

  updatePrayer: async (id: number, data: PrayerUpdatePayload) => {
    const prayers = storageUpdatePrayer(id, data);
    set({ prayers });
    scheduleAllAlarms(prayers, get().settings.isGloballyActive);
  },

  loadSettings: async () => {
    const settings = getSettings();
    set({ settings });
  },

  updateSettings: async (data: UserSettings) => {
    const settings = updateLocalSettings(data);
    set({ settings });
    scheduleAllAlarms(get().prayers, settings.isGloballyActive);
    saveNotificationSettings(settings.silentNotificationOnStart, settings.showLiftedNotification);
  },

  loadHistory: async (page?: number) => {
    const targetPage = page ?? get().historyPage;
    set({ isLoading: true });
    const result = getHistory(targetPage, 20);
    if (targetPage === 1) {
      set({
        history: result.items,
        historyPage: result.page,
        historyTotalPages: result.totalPages,
        isLoading: false,
      });
    } else {
      set({
        history: [...get().history, ...result.items],
        historyPage: result.page,
        historyTotalPages: result.totalPages,
        isLoading: false,
      });
    }
  },

  refreshHistory: async () => {
    set({ isRefreshing: true });
    const result = getHistory(1, 20);
    set({
      history: result.items,
      historyPage: 1,
      historyTotalPages: result.totalPages,
      isRefreshing: false,
    });
  },

  toggleGlobalActive: async () => {
    const current = get().settings;
    const updated = { ...current, isGloballyActive: !current.isGloballyActive };
    await get().updateSettings(updated);
  },
}));

export default useSalahStore;
