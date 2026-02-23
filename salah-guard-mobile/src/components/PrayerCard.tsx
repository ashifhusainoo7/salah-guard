import React, { useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Prayer } from '../types';
import { getPrayerColor } from '../utils/prayerUtils';
import { formatScheduledTime } from '../utils/timeUtils';
import { t } from '../i18n/strings';
import useSalahStore from '../store/useSalahStore';
import { getPrayerGradient } from '../theme';
import { colors, spacing, glassCard, shadows } from '../theme';
import GradientCard from './GradientCard';

interface PrayerCardProps {
  prayer: Prayer;
  isNext: boolean;
}

const PrayerCard: React.FC<PrayerCardProps> = React.memo(({ prayer, isNext }) => {
  const updatePrayer = useSalahStore((s) => s.updatePrayer);
  debugger
  const handleToggle = useCallback(
    (value: boolean) => {
      updatePrayer(prayer.id, { isEnabled: value }).catch(() => { });
    },
    [prayer.id, updatePrayer],
  );

  const gradient = getPrayerGradient(prayer.name);
  const prayerColor = getPrayerColor(prayer.name);

  return (
    <View style={styles.container}>
      <GradientCard
        gradientColors={[gradient.start, gradient.end]}
        accentSide
        style={[isNext && styles.highlighted]}
      >
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Icon name={gradient.icon as any} size={20} color={prayerColor} />
            <Text style={styles.name}>{prayer.name}</Text>
            <Text style={styles.arabicName}>{prayer.arabicName}</Text>
          </View>
          <Switch
            value={prayer.isEnabled}
            onValueChange={handleToggle}
            trackColor={{
              false: colors.switch.trackInactive,
              true: colors.switch.trackActive,
            }}
            thumbColor={prayer.isEnabled ? colors.switch.thumbActive : colors.switch.thumbInactive}
            testID={`prayer-toggle-${prayer.name}`}
          />
        </View>

        <View style={styles.detailRow}>
          <View style={styles.timeWrap}>
            <Icon name="clock-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.time}>{formatScheduledTime(prayer.scheduledTime)}</Text>
          </View>
          <View style={styles.durationWrap}>
            <Icon name="timer-sand" size={13} color={colors.text.muted} />
            <Text style={styles.duration}>
              {prayer.durationMinutes} {t('minutes')}
            </Text>
          </View>
        </View>

        {isNext && (
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>{t('nextPrayer')}</Text>
          </View>
        )}
      </GradientCard>
    </View>
  );
});

PrayerCard.displayName = 'PrayerCard';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: 5,
  },
  highlighted: {
    ...shadows.glow(colors.accent.gold),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  arabicName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  durationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 12,
    color: colors.text.muted,
  },
  nextBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.accent.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 4,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default PrayerCard;
