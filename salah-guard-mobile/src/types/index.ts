export interface Prayer {
  id: number;
  name: string;
  arabicName: string;
  scheduledTime: string; // "HH:mm"
  durationMinutes: number;
  isEnabled: boolean;
  activeDays: string[];
}

export interface DndSession {
  id: number;
  prayerName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'Completed' | 'Interrupted';
}

export interface UserSettings {
  isGloballyActive: boolean;
  silentNotificationOnStart: boolean;
  showLiftedNotification: boolean;
  darkMode: boolean;
}

export interface PrayerUpdatePayload {
  name?: string;
  arabicName?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  isEnabled?: boolean;
  activeDays?: string[];
}

export interface DndSessionCreate {
  prayerName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'Completed' | 'Interrupted';
}

export type ThemeMode = 'light' | 'dark';

export type ScreenName = 'Home' | 'Schedule' | 'History' | 'Settings';
