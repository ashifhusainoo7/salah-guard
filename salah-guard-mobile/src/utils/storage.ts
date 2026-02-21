/**
 * AsyncStorage-based storage for non-sensitive data (Expo-compatible).
 * Replaces MMKV for Expo Go compatibility.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Prayer, UserSettings } from '../types';

const KEYS = {
  PRAYERS: 'cached_prayers',
  SETTINGS: 'cached_settings',
  THEME: 'theme_mode',
  LANGUAGE: 'language',
  API_URL: 'api_url',
  DEVICE_ID: 'device_id',
} as const;

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

export function getCachedPrayers(): Prayer[] | null {
  const data = getSync(KEYS.PRAYERS);
  if (!data) return null;
  try {
    return JSON.parse(data) as Prayer[];
  } catch {
    return null;
  }
}

export function setCachedPrayers(prayers: Prayer[]): void {
  setSync(KEYS.PRAYERS, JSON.stringify(prayers));
}

export function getCachedSettings(): UserSettings | null {
  const data = getSync(KEYS.SETTINGS);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserSettings;
  } catch {
    return null;
  }
}

export function setCachedSettings(settings: UserSettings): void {
  setSync(KEYS.SETTINGS, JSON.stringify(settings));
}

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

export function getApiUrl(): string | null {
  return getSync(KEYS.API_URL) ?? null;
}

export function setApiUrl(url: string): void {
  setSync(KEYS.API_URL, url);
}

export function getDeviceId(): string | null {
  return getSync(KEYS.DEVICE_ID) ?? null;
}

export function setDeviceId(id: string): void {
  setSync(KEYS.DEVICE_ID, id);
}

export default { getSync, setSync };
