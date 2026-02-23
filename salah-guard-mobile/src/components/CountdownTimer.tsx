import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Prayer } from '../types';
import { getNextOccurrence, formatCountdown, formatScheduledTime } from '../utils/timeUtils';
import { getPrayerColor } from '../utils/prayerUtils';
import { t } from '../i18n/strings';
import { colors, spacing, glassCard } from '../theme';

interface CountdownTimerProps {
  prayer: Prayer;
  onExpired?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = React.memo(({ prayer, onExpired }) => {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, getNextOccurrence(prayer.scheduledTime).getTime() - Date.now()),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef<number>(
    getNextOccurrence(prayer.scheduledTime).getTime(),
  );
  const expiredCalledRef = useRef(false);

  useEffect(() => {
    const target = getNextOccurrence(prayer.scheduledTime);
    targetRef.current = target.getTime();
    expiredCalledRef.current = false;
    setRemaining(Math.max(0, target.getTime() - Date.now()));

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = targetRef.current - now;

      if (diff <= 0) {
        if (!expiredCalledRef.current) {
          expiredCalledRef.current = true;
          onExpired?.();
        }
        // Advance target to next occurrence (wraps to tomorrow)
        targetRef.current = getNextOccurrence(prayer.scheduledTime).getTime();
        expiredCalledRef.current = false;
        setRemaining(Math.max(0, targetRef.current - now));
      } else {
        setRemaining(diff);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [prayer.scheduledTime, onExpired]);

  const prayerColor = getPrayerColor(prayer.name);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.arabicName}>{prayer.arabicName}</Text>
        <Text style={styles.label}>
          {t('nextPrayer')} — {prayer.name}
        </Text>
        <Text style={[styles.countdown, { color: prayerColor }]}>
          {formatCountdown(remaining)}
        </Text>
        <Text style={styles.time}>{formatScheduledTime(prayer.scheduledTime)}</Text>
      </View>
    </View>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  card: {
    ...glassCard,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  arabicName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdown: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
  },
});

export default CountdownTimer;
