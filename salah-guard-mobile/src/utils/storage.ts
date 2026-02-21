/**
 * MMKV-based storage for non-sensitive data (preferences, cached schedules).
 * Sensitive data (tokens) must use react-native-keychain instead.
 */
import { MMKV } from 'react-native-mmkv';
import type { Prayer, UserSettings } from '../types';

const storage = new MMKV({ id: 'salah-guard-storage' });

const KEYS = {
  PRAYERS: 'cached_prayers',
  SETTINGS: 'cached_settings',
  THEME: 'theme_mode',
  LANGUAGE: 'language',
  API_URL: 'api_url',
  DEVICE_ID: 'device_id',
} as const;

export function getCachedPrayers(): Prayer[] | null {
  const data = storage.getString(KEYS.PRAYERS);
  if (!data) return null;
  try {
    return JSON.parse(data) as Prayer[];
  } catch {
    return null;
  }
}

export function setCachedPrayers(prayers: Prayer[]): void {
  storage.set(KEYS.PRAYERS, JSON.stringify(prayers));
}

export function getCachedSettings(): UserSettings | null {
  const data = storage.getString(KEYS.SETTINGS);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserSettings;
  } catch {
    return null;
  }
}

export function setCachedSettings(settings: UserSettings): void {
  storage.set(KEYS.SETTINGS, JSON.stringify(settings));
}

export function getThemeMode(): 'light' | 'dark' {
  return (storage.getString(KEYS.THEME) as 'light' | 'dark') ?? 'light';
}

export function setThemeMode(mode: 'light' | 'dark'): void {
  storage.set(KEYS.THEME, mode);
}

export function getLanguage(): string {
  return storage.getString(KEYS.LANGUAGE) ?? 'en';
}

export function setLanguage(lang: string): void {
  storage.set(KEYS.LANGUAGE, lang);
}

export function getApiUrl(): string | null {
  return storage.getString(KEYS.API_URL) ?? null;
}

export function setApiUrl(url: string): void {
  storage.set(KEYS.API_URL, url);
}

export function getDeviceId(): string | null {
  return storage.getString(KEYS.DEVICE_ID) ?? null;
}

export function setDeviceId(id: string): void {
  storage.set(KEYS.DEVICE_ID, id);
}

export default storage;
