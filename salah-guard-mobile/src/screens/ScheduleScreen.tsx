import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Prayer } from '../types';
import useSalahStore from '../store/useSalahStore';
import DurationSlider from '../components/DurationSlider';
import OfflineBanner from '../components/OfflineBanner';
import LoadingView from '../components/LoadingView';
import { parseTime } from '../utils/timeUtils';
import { getPrayerColor } from '../utils/prayerUtils';
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

  const [editingPrayerId, setEditingPrayerId] = useState<number | null>(null);
  const handleTimePress = useCallback((prayer: Prayer) => {
    Alert.alert('Change Time', `Current time: ${prayer.scheduledTime}\nUse the native app to change prayer times.`);
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
    Alert.alert(t('save'), 'Schedule saved successfully.');
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
      >
        {prayers.map((prayer) => {
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
                      {prayer.scheduledTime}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.bg.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.accent.emerald,
    borderColor: colors.accent.emerald,
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
});

export default ScheduleScreen;
