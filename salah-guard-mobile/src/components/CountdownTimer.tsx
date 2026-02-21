import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Prayer } from '../types';
import { getMillisUntilTime, formatCountdown } from '../utils/timeUtils';
import { t } from '../i18n/strings';

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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {t('nextPrayer')}: {prayer.name} {prayer.arabicName}
      </Text>
      <Text style={styles.countdown}>
        {t('countdown')} {formatCountdown(remaining)}
      </Text>
    </View>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD700',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  countdown: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
  },
});

export default CountdownTimer;
