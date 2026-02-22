/**
 * Salah Guard — Centralized Design System
 * Dark-first theme with prayer-specific gradients and glassmorphism.
 */

// ─── Colors ──────────────────────────────────────────────
export const colors = {
  bg: {
    primary: '#0F1624',
    secondary: '#151C2E',
    card: 'rgba(255,255,255,0.06)',
    cardHover: 'rgba(255,255,255,0.10)',
    cardBorder: 'rgba(255,255,255,0.10)',
    input: 'rgba(255,255,255,0.08)',
    tabBar: 'rgba(15,22,36,0.92)',
  },
  accent: {
    emerald: '#10B981',
    emeraldDim: 'rgba(16,185,129,0.15)',
    gold: '#F59E0B',
    goldDim: 'rgba(245,158,11,0.15)',
    amber: '#F97316',
    rose: '#F43F5E',
  },
  text: {
    primary: '#F1F5F9',
    secondary: 'rgba(241,245,249,0.60)',
    muted: 'rgba(241,245,249,0.35)',
    inverse: '#0F1624',
  },
  status: {
    success: '#10B981',
    successBg: 'rgba(16,185,129,0.15)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.15)',
    error: '#EF4444',
    errorBg: 'rgba(239,68,68,0.15)',
    offline: '#F97316',
    offlineBg: 'rgba(249,115,22,0.12)',
  },
  switch: {
    trackActive: '#10B981',
    trackInactive: 'rgba(255,255,255,0.12)',
    thumbActive: '#FFFFFF',
    thumbInactive: 'rgba(255,255,255,0.50)',
  },
} as const;

// ─── Prayer Gradients ────────────────────────────────────
export type PrayerGradient = { start: string; end: string; icon: string };

export const prayerGradients: Record<string, PrayerGradient> = {
  Fajr: { start: '#1E3A5F', end: '#4A90D9', icon: 'weather-sunset-up' },
  Dhuhr: { start: '#92400E', end: '#F59E0B', icon: 'white-balance-sunny' },
  Asr: { start: '#78350F', end: '#F97316', icon: 'weather-sunny' },
  Maghrib: { start: '#831843', end: '#F43F5E', icon: 'weather-sunset-down' },
  Isha: { start: '#312E81', end: '#8B5CF6', icon: 'moon-waning-crescent' },
};

export function getPrayerGradient(name: string): PrayerGradient {
  return prayerGradients[name] ?? { start: '#1E3A5F', end: '#4A90D9', icon: 'star-four-points' };
}

// ─── Spacing ─────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border Radius ───────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

// ─── Typography ──────────────────────────────────────────
export const typography = {
  hero: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  arabic: { fontSize: 22, fontWeight: '600' as const },
  arabicLarge: { fontSize: 28, fontWeight: '700' as const },
} as const;

// ─── Glass Card Style ────────────────────────────────────
export const glassCard = {
  backgroundColor: colors.bg.card,
  borderWidth: 1,
  borderColor: colors.bg.cardBorder,
  borderRadius: radius.lg,
} as const;

// ─── Shadows ─────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;
