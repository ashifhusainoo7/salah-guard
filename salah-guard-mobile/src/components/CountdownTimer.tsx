import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Prayer } from '../types';
import { getMillisUntilTime, formatCountdown } from '../utils/timeUtils';
import { getPrayerColor } from '../utils/prayerUtils';
import { t } from '../i18n/strings';
import { colors, spacing, glassCard } from '../theme';

interface CountdownTimerProps {
  prayer: Prayer;
}

const CountdownTimer: React.FC<CountdownTimerProps> = React.memo(({ prayer }) => {
  const [remaining, setRemaining] = useState<number>(
    getMillisUntilTime(prayer.scheduledTime),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(getMillisUntilTime(prayer.scheduledTime));

    intervalRef.current = setInterval(() => {
      setRemaining(getMillisUntilTime(prayer.scheduledTime));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [prayer.scheduledTime]);

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
        <Text style={styles.time}>{prayer.scheduledTime}</Text>
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
    paddingVertical: spacing.xl,
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
    fontSize: 40,
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
