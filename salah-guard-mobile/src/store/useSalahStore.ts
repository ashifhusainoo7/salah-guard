/**
 * Zustand store for global app state management.
 * Handles prayers, settings, history, and offline fallback.
 */
import { create } from 'zustand';
import type {
  DndSession,
  PaginatedResponse,
  Prayer,
  PrayerUpdatePayload,
  UserSettings,
} from '../types';
import * as api from '../services/api';
import {
  getCachedPrayers,
  setCachedPrayers,
  getCachedSettings,
  setCachedSettings,
} from '../utils/storage';
import { scheduleAllAlarms } from '../services/alarmScheduler';
import logger from '../utils/logger';

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
  isOffline: boolean;
  error: string | null;

  // Actions
  loadPrayers: () => Promise<void>;
  updatePrayer: (id: number, data: PrayerUpdatePayload) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (data: UserSettings) => Promise<void>;
  loadHistory: (page?: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
  toggleGlobalActive: () => Promise<void>;
  setOffline: (offline: boolean) => void;
  clearError: () => void;
}

const defaultSettings: UserSettings = {
  isGloballyActive: true,
  silentNotificationOnStart: true,
  showLiftedNotification: true,
  darkMode: false,
};

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const defaultPrayers: Prayer[] = [
  { id: 1, name: 'Fajr',    arabicName: 'الفجر',   scheduledTime: '05:30', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 2, name: 'Dhuhr',   arabicName: 'الظهر',   scheduledTime: '12:30', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 3, name: 'Asr',     arabicName: 'العصر',   scheduledTime: '15:45', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 4, name: 'Maghrib', arabicName: 'المغرب',  scheduledTime: '18:15', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 5, name: 'Isha',    arabicName: 'العشاء',   scheduledTime: '20:00', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
];

const useSalahStore = create<SalahState>((set, get) => ({
  prayers: [],
  settings: defaultSettings,
  history: [],
  historyPage: 1,
  historyTotalPages: 1,
  isLoading: false,
  isRefreshing: false,
  isOffline: false,
  error: null,

  loadPrayers: async () => {
    set({ isLoading: true, error: null });
    try {
      const prayers = await api.fetchPrayers();
      setCachedPrayers(prayers);
      set({ prayers, isLoading: false, isOffline: false });
      scheduleAllAlarms(prayers, get().settings.isGloballyActive);
    } catch (err) {
      logger.error('Failed to load prayers from API, using cache:', err);
      const cached = getCachedPrayers();
      const fallback = cached ?? defaultPrayers;
      setCachedPrayers(fallback);
      set({ prayers: fallback, isLoading: false, isOffline: true, error: null });
      scheduleAllAlarms(fallback, get().settings.isGloballyActive);
    }
  },

  updatePrayer: async (id: number, data: PrayerUpdatePayload) => {
    set({ error: null });
    // Optimistic: update UI instantly
    const optimistic = get().prayers.map((p) =>
      p.id === id ? { ...p, ...data } : p,
    );
    setCachedPrayers(optimistic as Prayer[]);
    set({ prayers: optimistic as Prayer[] });
    try {
      const updated = await api.updatePrayer(id, data);
      const prayers = get().prayers.map((p) => (p.id === id ? updated : p));
      setCachedPrayers(prayers);
      set({ prayers });
      scheduleAllAlarms(prayers, get().settings.isGloballyActive);
    } catch (err) {
      logger.error('Failed to update prayer:', err);
      // Already set optimistically; schedule alarms with local data
      scheduleAllAlarms(get().prayers, get().settings.isGloballyActive);
    }
  },

  loadSettings: async () => {
    try {
      const settings = await api.fetchSettings();
      setCachedSettings(settings);
      set({ settings });
    } catch (err) {
      logger.error('Failed to load settings, using cache:', err);
      const cached = getCachedSettings();
      if (cached) {
        set({ settings: cached });
      }
    }
  },

  updateSettings: async (data: UserSettings) => {
    set({ error: null });
    // Optimistic: update UI instantly
    setCachedSettings(data);
    set({ settings: data });
    try {
      const settings = await api.updateSettings(data);
      setCachedSettings(settings);
      set({ settings });
      scheduleAllAlarms(get().prayers, settings.isGloballyActive);
    } catch (err) {
      logger.error('Failed to update settings:', err);
      // Already set optimistically; schedule alarms with local data
      scheduleAllAlarms(get().prayers, data.isGloballyActive);
    }
  },

  loadHistory: async (page?: number) => {
    const targetPage = page ?? get().historyPage;
    set({ isLoading: true, error: null });
    try {
      const result: PaginatedResponse<DndSession> = await api.fetchHistory(targetPage, 20);
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
    } catch (err) {
      logger.error('Failed to load history:', err);
      set({ isLoading: false, error: 'Failed to load history.' });
    }
  },

  refreshHistory: async () => {
    set({ isRefreshing: true });
    try {
      const result: PaginatedResponse<DndSession> = await api.fetchHistory(1, 20);
      set({
        history: result.items,
        historyPage: 1,
        historyTotalPages: result.totalPages,
        isRefreshing: false,
      });
    } catch (err) {
      logger.error('Failed to refresh history:', err);
      set({ isRefreshing: false });
    }
  },

  toggleGlobalActive: async () => {
    const current = get().settings;
    const updated = { ...current, isGloballyActive: !current.isGloballyActive };
    await get().updateSettings(updated);
  },

  setOffline: (offline: boolean) => {
    set({ isOffline: offline });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useSalahStore;
