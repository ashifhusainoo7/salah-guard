/**
 * Salah Guard — Centralized Design System
 * Dark-first theme with prayer-specific gradients and CRED-inspired depth.
 */

// ─── Colors ──────────────────────────────────────────────
export const colors = {
  bg: {
    primary: '#0B0F1A',
    secondary: '#111827',
    card: '#1A2236',
    cardHover: '#212B42',
    cardBorder: 'rgba(255,255,255,0.04)',
    input: 'rgba(255,255,255,0.08)',
    tabBar: '#0E1320',
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
    inverse: '#0B0F1A',
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
  Jumuah: { start: '#064E3B', end: '#10B981', icon: 'mosque' },
};

export function getPrayerGradient(name: string): PrayerGradient {
  return prayerGradients[name] ?? { start: '#1E3A5F', end: '#4A90D9', icon: 'star-four-points' };
}

// ─── Spacing ─────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 36,
  xxxl: 40,
} as const;

// ─── Border Radius ───────────────────────────────────────
export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

// ─── Typography ──────────────────────────────────────────
export const typography = {
  hero: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  arabic: { fontSize: 22, fontWeight: '600' as const },
  arabicLarge: { fontSize: 28, fontWeight: '700' as const },
} as const;

// ─── Glass Card Style ────────────────────────────────────
export const glassCard = {
  backgroundColor: colors.bg.card,
  borderWidth: 0,
  borderColor: colors.bg.cardBorder,
  borderRadius: radius.lg,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 6,
} as const;

// ─── Shadows ─────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }),
} as const;
