import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Prayer } from '../types';
import useSalahStore from '../store/useSalahStore';
import DurationSlider from '../components/DurationSlider';
import OfflineBanner from '../components/OfflineBanner';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import TimePickerModal from '../components/TimePickerModal';
import { formatTime, formatScheduledTime } from '../utils/timeUtils';
import { getPrayerColor, isWeeklyPrayer } from '../utils/prayerUtils';
import { getPrayerGradient } from '../theme';
import { t } from '../i18n/strings';
import { colors, spacing, radius, glassCard } from '../theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type DayAbbr = (typeof DAYS)[number];

const dayTranslations: Record<DayAbbr, () => string> = {
  Mon: () => t('mon'),
  Tue: () => t('tue'),
  Wed: () => t('wed'),
  Thu: () => t('thu'),
  Fri: () => t('fri'),
  Sat: () => t('sat'),
  Sun: () => t('sun'),
};

const ScheduleScreen: React.FC = () => {
  const prayers = useSalahStore((s) => s.prayers);
  const isLoading = useSalahStore((s) => s.isLoading);
  const updatePrayer = useSalahStore((s) => s.updatePrayer);
  const loadPrayers = useSalahStore((s) => s.loadPrayers);

  const [editingPrayerId, setEditingPrayerId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerPrayerId, setTimePickerPrayerId] = useState<number | null>(null);

  useEffect(() => {
    if (prayers.length === 0) {
      loadPrayers().catch(() => {});
    }
  }, [prayers.length, loadPrayers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPrayers()
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [loadPrayers]);
  const handleTimePress = useCallback((prayer: Prayer) => {
    setTimePickerPrayerId(prayer.id);
    setShowTimePicker(true);
  }, []);

  const handleTimeConfirm = useCallback(
    (selectedDate: Date) => {
      if (timePickerPrayerId == null) return;
      const newTime = formatTime(selectedDate.getHours(), selectedDate.getMinutes());
      updatePrayer(timePickerPrayerId, { scheduledTime: newTime }).catch(() => {});
      setShowTimePicker(false);
    },
    [timePickerPrayerId, updatePrayer],
  );

  const handleTimeCancel = useCallback(() => {
    setShowTimePicker(false);
  }, []);

  const handleDurationChange = useCallback(
    (prayerId: number, value: number) => {
      updatePrayer(prayerId, { durationMinutes: value }).catch(() => {});
    },
    [updatePrayer],
  );

  const handleDayToggle = useCallback(
    (prayer: Prayer, day: string) => {
      const activeDays = prayer.activeDays.includes(day)
        ? prayer.activeDays.filter((d) => d !== day)
        : [...prayer.activeDays, day];
      updatePrayer(prayer.id, { activeDays }).catch(() => {});
    },
    [updatePrayer],
  );

  const handleSave = useCallback(() => {
    setEditingPrayerId(null);
  }, []);

  if (isLoading && prayers.length === 0) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent.emerald]}
            tintColor={colors.accent.emerald}
            progressBackgroundColor={colors.bg.secondary}
          />
        }
      >
        {prayers.length === 0 && !isLoading && (
          <EmptyState icon="calendar-blank" message="No prayer schedules found. Pull to refresh." />
        )}
        {prayers.filter((p) => !isWeeklyPrayer(p.name)).map((prayer) => {
          const isEditing = editingPrayerId === prayer.id;
          const gradient = getPrayerGradient(prayer.name);
          const prayerColor = getPrayerColor(prayer.name);

          return (
            <View key={prayer.id} style={styles.prayerSection}>
              <TouchableOpacity
                style={styles.prayerHeader}
                onPress={() =>
                  setEditingPrayerId(isEditing ? null : prayer.id)
                }
                activeOpacity={0.7}
              >
                <View style={styles.prayerNameRow}>
                  <View style={[styles.colorDot, { backgroundColor: prayerColor }]} />
                  <Icon name={gradient.icon as any} size={20} color={prayerColor} />
                  <Text style={styles.prayerName}>
                    {prayer.name}
                  </Text>
                  <Text style={styles.arabicName}>{prayer.arabicName}</Text>
                </View>
                <Icon
                  name={isEditing ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.text.muted}
                />
              </TouchableOpacity>

              {isEditing && (
                <View style={styles.editSection}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => handleTimePress(prayer)}
                    activeOpacity={0.7}
                  >
                    <Icon name="clock-outline" size={20} color={prayerColor} />
                    <Text style={[styles.timeText, { color: prayerColor }]}>
                      {formatScheduledTime(prayer.scheduledTime)}
                    </Text>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>

                  <DurationSlider
                    value={prayer.durationMinutes}
                    onValueChange={(val) =>
                      handleDurationChange(prayer.id, val)
                    }
                  />

                  <Text style={styles.sectionLabel}>{t('daysOfWeek')}</Text>
                  <View style={styles.daysRow}>
                    {DAYS.map((day) => {
                      const isActive = prayer.activeDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            isActive && styles.dayButtonActive,
                          ]}
                          onPress={() => handleDayToggle(prayer, day)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isActive && styles.dayTextActive,
                            ]}
                          >
                            {dayTranslations[day]()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Weekly prayers (Jumu'ah) section */}
        {prayers.filter((p) => isWeeklyPrayer(p.name)).length > 0 && (
          <>
            <View style={styles.jumuahDivider} />
            <View style={styles.jumuahSectionHeader}>
              <Icon name="mosque" size={18} color={colors.accent.emerald} />
              <Text style={styles.jumuahSectionLabel}>{t('jumuahSection')}</Text>
            </View>
          </>
        )}
        {prayers.filter((p) => isWeeklyPrayer(p.name)).map((prayer) => {
          const isEditing = editingPrayerId === prayer.id;
          const gradient = getPrayerGradient(prayer.name);
          const prayerColor = getPrayerColor(prayer.name);

          return (
            <View key={prayer.id} style={styles.jumuahCard}>
              <TouchableOpacity
                style={styles.prayerHeader}
                onPress={() =>
                  setEditingPrayerId(isEditing ? null : prayer.id)
                }
                activeOpacity={0.7}
              >
                <View style={styles.prayerNameRow}>
                  <View style={[styles.colorDot, { backgroundColor: prayerColor }]} />
                  <Icon name={gradient.icon as any} size={20} color={prayerColor} />
                  <Text style={styles.prayerName}>
                    {t('jumuah')}
                  </Text>
                  <Text style={styles.arabicName}>{prayer.arabicName}</Text>
                </View>
                <Icon
                  name={isEditing ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.text.muted}
                />
              </TouchableOpacity>

              {isEditing && (
                <View style={styles.jumuahEditSection}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => handleTimePress(prayer)}
                    activeOpacity={0.7}
                  >
                    <Icon name="clock-outline" size={20} color={prayerColor} />
                    <Text style={[styles.timeText, { color: prayerColor }]}>
                      {formatScheduledTime(prayer.scheduledTime)}
                    </Text>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>

                  <DurationSlider
                    value={prayer.durationMinutes}
                    onValueChange={(val) =>
                      handleDurationChange(prayer.id, val)
                    }
                  />

                  <Text style={styles.sectionLabel}>{t('daysOfWeek')}</Text>
                  <View style={styles.daysRow}>
                    {DAYS.map((day) => {
                      const isActive = prayer.activeDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            isActive && styles.dayButtonActive,
                          ]}
                          onPress={() => handleDayToggle(prayer, day)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isActive && styles.dayTextActive,
                            ]}
                          >
                            {dayTranslations[day]()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <TimePickerModal
        visible={showTimePicker && timePickerPrayerId != null}
        initialTime={
          prayers.find((p) => p.id === timePickerPrayerId)?.scheduledTime ?? '00:00'
        }
        onConfirm={handleTimeConfirm}
        onCancel={handleTimeCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  prayerSection: {
    ...glassCard,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  arabicName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  editSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.bg.cardBorder,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.cardBorder,
  },
  timeText: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  changeText: {
    fontSize: 13,
    color: colors.text.muted,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0,
    backgroundColor: colors.bg.cardHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.accent.emerald,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.accent.emerald,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  jumuahDivider: {
    height: 1,
    backgroundColor: 'rgba(16,185,129,0.25)',
    marginVertical: spacing.lg,
  },
  jumuahSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  jumuahSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.emerald,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  jumuahCard: {
    backgroundColor: '#0D2818',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: radius.lg,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  jumuahEditSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,185,129,0.15)',
  },
});

export default ScheduleScreen;
