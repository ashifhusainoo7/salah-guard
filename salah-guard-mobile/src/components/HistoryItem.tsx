import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DndSession } from '../types';
import { formatIsoToDateTime } from '../utils/timeUtils';
import { getPrayerColor } from '../utils/prayerUtils';
import { t } from '../i18n/strings';

interface HistoryItemProps {
  session: DndSession;
}

const HistoryItem: React.FC<HistoryItemProps> = React.memo(({ session }) => {
  const color = getPrayerColor(session.prayerName);
  const isCompleted = session.status === 'Completed';

  return (
    <View style={styles.container}>
      <View style={[styles.colorStrip, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.prayerName}>{session.prayerName}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isCompleted ? '#E8F5E9' : '#FFF3E0' },
            ]}
          >
            <Icon
              name={isCompleted ? 'check-circle' : 'alert-circle'}
              size={14}
              color={isCompleted ? '#2E7D32' : '#EF6C00'}
            />
            <Text
              style={[
                styles.statusText,
                { color: isCompleted ? '#2E7D32' : '#EF6C00' },
              ]}
            >
              {isCompleted ? t('completed') : t('interrupted')}
            </Text>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Icon name="clock-start" size={14} color="#666" />
            <Text style={styles.detailText}>
              {t('startTime')}: {formatIsoToDateTime(session.startTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock-end" size={14} color="#666" />
            <Text style={styles.detailText}>
              {t('endTime')}: {formatIsoToDateTime(session.endTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="timer-sand" size={14} color="#666" />
            <Text style={styles.detailText}>
              {session.durationMinutes} {t('minutes')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

HistoryItem.displayName = 'HistoryItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  colorStrip: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
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
    color: '#666',
  },
});

export default HistoryItem;
