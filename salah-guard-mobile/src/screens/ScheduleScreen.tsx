import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
// DateTimePicker removed for web compatibility
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Prayer } from '../types';
import useSalahStore from '../store/useSalahStore';
import DurationSlider from '../components/DurationSlider';
import OfflineBanner from '../components/OfflineBanner';
import LoadingView from '../components/LoadingView';
import { parseTime } from '../utils/timeUtils';
import { t } from '../i18n/strings';

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
        <Text style={styles.screenTitle}>{t('prayerSchedule')}</Text>

        {prayers.map((prayer) => {
          const isEditing = editingPrayerId === prayer.id;
          const { hours, minutes } = parseTime(prayer.scheduledTime);
          const pickerDate = new Date();
          pickerDate.setHours(hours, minutes, 0, 0);

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
                  <Icon name="mosque" size={20} color="#1B5E20" />
                  <Text style={styles.prayerName}>
                    {prayer.name} {prayer.arabicName}
                  </Text>
                </View>
                <Icon
                  name={isEditing ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {isEditing && (
                <View style={styles.editSection}>
                  {/* Time picker */}
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => handleTimePress(prayer)}
                    activeOpacity={0.7}
                  >
                    <Icon name="clock-outline" size={20} color="#1B5E20" />
                    <Text style={styles.timeText}>{prayer.scheduledTime}</Text>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>

                  {/* Duration slider */}
                  <DurationSlider
                    value={prayer.durationMinutes}
                    onValueChange={(val) =>
                      handleDurationChange(prayer.id, val)
                    }
                  />

                  {/* Day selector */}
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

                  {/* Save button */}
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
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 16,
  },
  prayerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  editSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    flex: 1,
  },
  changeText: {
    fontSize: 13,
    color: '#1B5E20',
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  dayButtonActive: {
    backgroundColor: '#1B5E20',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#1B5E20',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ScheduleScreen;
