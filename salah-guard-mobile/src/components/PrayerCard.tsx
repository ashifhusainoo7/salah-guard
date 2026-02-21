import React, { useCallback, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Prayer } from '../types';
import { getPrayerColor } from '../utils/prayerUtils';
import { parseTime } from '../utils/timeUtils';
import { t } from '../i18n/strings';
import useSalahStore from '../store/useSalahStore';

interface PrayerCardProps {
  prayer: Prayer;
  isNext: boolean;
}

const PrayerCard: React.FC<PrayerCardProps> = React.memo(({ prayer, isNext }) => {
  const updatePrayer = useSalahStore((s) => s.updatePrayer);

  const handleToggle = useCallback(
    (value: boolean) => {
      updatePrayer(prayer.id, { isEnabled: value }).catch(() => {});
    },
    [prayer.id, updatePrayer],
  );

  const prayerColor = getPrayerColor(prayer.name);

  return (
    <View style={[styles.container, isNext && styles.highlighted]}>
      <View style={[styles.colorStrip, { backgroundColor: prayerColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Icon name="mosque" size={20} color={prayerColor} />
            <Text style={styles.name}>{prayer.name}</Text>
            <Text style={styles.arabicName}>{prayer.arabicName}</Text>
          </View>
          <Switch
            value={prayer.isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
            thumbColor={prayer.isEnabled ? '#1B5E20' : '#BDBDBD'}
            testID={`prayer-toggle-${prayer.name}`}
          />
        </View>

        <View style={styles.timeRow}>
          <Icon name="clock-outline" size={16} color="#666" />
          <Text style={styles.time}>{prayer.scheduledTime}</Text>
        </View>

        <View style={styles.durationRow}>
          <Icon name="timer-sand" size={14} color="#666" />
          <Text style={styles.duration}>
            {prayer.durationMinutes} {t('minutes')}
          </Text>
        </View>

        {isNext && (
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>{t('nextPrayer')}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

PrayerCard.displayName = 'PrayerCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  highlighted: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  colorStrip: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  arabicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 13,
    color: '#666',
  },
  nextBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B5E20',
  },
});

export default PrayerCard;
