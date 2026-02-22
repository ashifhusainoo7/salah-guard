import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { DndSession } from '../types';
import { formatIsoToDateTime } from '../utils/timeUtils';
import { getPrayerColor } from '../utils/prayerUtils';
import { getPrayerGradient } from '../theme';
import { t } from '../i18n/strings';
import { colors, spacing, glassCard } from '../theme';
import GradientCard from './GradientCard';

interface HistoryItemProps {
  session: DndSession;
}

const HistoryItem: React.FC<HistoryItemProps> = React.memo(({ session }) => {
  const gradient = getPrayerGradient(session.prayerName);
  const isCompleted = session.status === 'Completed';

  return (
    <View style={styles.container}>
      <GradientCard
        gradientColors={[gradient.start, gradient.end]}
        accentSide
      >
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Icon name={gradient.icon as any} size={16} color={getPrayerColor(session.prayerName)} />
            <Text style={styles.prayerName}>{session.prayerName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted
                  ? colors.status.successBg
                  : colors.status.warningBg,
              },
            ]}
          >
            <Icon
              name={isCompleted ? 'check-circle' : 'alert-circle'}
              size={12}
              color={isCompleted ? colors.status.success : colors.status.warning}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isCompleted
                    ? colors.status.success
                    : colors.status.warning,
                },
              ]}
            >
              {isCompleted ? t('completed') : t('interrupted')}
            </Text>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Icon name="clock-start" size={13} color={colors.text.muted} />
            <Text style={styles.detailText}>
              {formatIsoToDateTime(session.startTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock-end" size={13} color={colors.text.muted} />
            <Text style={styles.detailText}>
              {formatIsoToDateTime(session.endTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="timer-sand" size={13} color={colors.text.muted} />
            <Text style={styles.detailText}>
              {session.durationMinutes} {t('minutes')}
            </Text>
          </View>
        </View>
      </GradientCard>
    </View>
  );
});

HistoryItem.displayName = 'HistoryItem';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: 4,
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
    gap: 6,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    gap: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default HistoryItem;
