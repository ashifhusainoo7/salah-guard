/**
 * AsyncStorage-based local storage — the single source of truth.
 * Handles prayers, settings, DND history, and app preferences.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Prayer, DndSession, DndSessionCreate, UserSettings } from '../types';

const KEYS = {
  PRAYERS: 'cached_prayers',
  SETTINGS: 'cached_settings',
  HISTORY: 'dnd_history',
  THEME: 'theme_mode',
  LANGUAGE: 'language',
} as const;

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const defaultPrayers: Prayer[] = [
  { id: 1, name: 'Fajr', arabicName: '\u0627\u0644\u0641\u062C\u0631', scheduledTime: '05:30', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 2, name: 'Dhuhr', arabicName: '\u0627\u0644\u0638\u0647\u0631', scheduledTime: '12:30', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 3, name: 'Asr', arabicName: '\u0627\u0644\u0639\u0635\u0631', scheduledTime: '15:45', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 4, name: 'Maghrib', arabicName: '\u0627\u0644\u0645\u063A\u0631\u0628', scheduledTime: '18:15', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 5, name: 'Isha', arabicName: '\u0627\u0644\u0639\u0634\u0627\u0621', scheduledTime: '20:00', durationMinutes: 15, isEnabled: true, activeDays: ALL_DAYS },
  { id: 6, name: 'Jumuah', arabicName: '\u0627\u0644\u062C\u0645\u0639\u0629', scheduledTime: '13:00', durationMinutes: 30, isEnabled: true, activeDays: ['Fri'] },
];

export const defaultSettings: UserSettings = {
  isGloballyActive: true,
  silentNotificationOnStart: true,
  showLiftedNotification: true,
  darkMode: false,
};

const MAX_HISTORY_SESSIONS = 200;

// In-memory cache for synchronous reads
const memCache: Record<string, string | undefined> = {};

// Preload cache from AsyncStorage
AsyncStorage.multiGet(Object.values(KEYS)).then((pairs) => {
  pairs.forEach(([key, value]) => {
    if (value !== null) memCache[key] = value;
  });
});

function getSync(key: string): string | undefined {
  return memCache[key];
}

function setSync(key: string, value: string): void {
  memCache[key] = value;
  AsyncStorage.setItem(key, value).catch(() => {});
}

// --- Prayers ---

export function getPrayers(): Prayer[] {
  const data = getSync(KEYS.PRAYERS);
  if (!data) return defaultPrayers;
  try {
    return JSON.parse(data) as Prayer[];
  } catch {
    return defaultPrayers;
  }
}

export function updatePrayer(id: number, updates: Partial<Prayer>): Prayer[] {
  const prayers = getPrayers().map((p) =>
    p.id === id ? { ...p, ...updates } : p,
  );
  setSync(KEYS.PRAYERS, JSON.stringify(prayers));
  return prayers;
}

function setPrayers(prayers: Prayer[]): void {
  setSync(KEYS.PRAYERS, JSON.stringify(prayers));
}

// --- Settings ---

export function getSettings(): UserSettings {
  const data = getSync(KEYS.SETTINGS);
  if (!data) return defaultSettings;
  try {
    return JSON.parse(data) as UserSettings;
  } catch {
    return defaultSettings;
  }
}

export function updateLocalSettings(updates: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const merged = { ...current, ...updates };
  setSync(KEYS.SETTINGS, JSON.stringify(merged));
  return merged;
}

// --- History ---

function getRawHistory(): DndSession[] {
  const data = getSync(KEYS.HISTORY);
  if (!data) return [];
  try {
    return JSON.parse(data) as DndSession[];
  } catch {
    return [];
  }
}

function setRawHistory(sessions: DndSession[]): void {
  setSync(KEYS.HISTORY, JSON.stringify(sessions));
}

export function getHistory(
  page: number = 1,
  pageSize: number = 20,
): { items: DndSession[]; page: number; totalPages: number } {
  const all = getRawHistory();
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { items, page, totalPages };
}

export function addDndSession(session: DndSessionCreate): DndSession {
  const all = getRawHistory();
  const newSession: DndSession = {
    id: Date.now(),
    ...session,
  };
  // Prepend newest first, cap at MAX_HISTORY_SESSIONS (FIFO, oldest dropped)
  const updated = [newSession, ...all].slice(0, MAX_HISTORY_SESSIONS);
  setRawHistory(updated);
  return newSession;
}

// --- First-launch initialization ---

export async function initializeAppData(): Promise<void> {
  // Read directly from AsyncStorage (not memCache which may not be populated yet)
  const pairs = await AsyncStorage.multiGet([KEYS.PRAYERS, KEYS.SETTINGS, KEYS.HISTORY]);
  for (const [key, value] of pairs) {
    if (value !== null) memCache[key] = value;
  }

  // Only seed if no existing data (preserves user's customizations on upgrade)
  if (!memCache[KEYS.PRAYERS]) {
    setPrayers(defaultPrayers);
  }
  if (!memCache[KEYS.SETTINGS]) {
    setSync(KEYS.SETTINGS, JSON.stringify(defaultSettings));
  }
}

// --- Theme / Language (unchanged) ---

export function getThemeMode(): 'light' | 'dark' {
  return (getSync(KEYS.THEME) as 'light' | 'dark') ?? 'light';
}

export function setThemeMode(mode: 'light' | 'dark'): void {
  setSync(KEYS.THEME, mode);
}

export function getLanguage(): string {
  return getSync(KEYS.LANGUAGE) ?? 'en';
}

export function setLanguage(lang: string): void {
  setSync(KEYS.LANGUAGE, lang);
}

export default { getSync, setSync };
