import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { t } from '../i18n/strings';
import { colors, spacing, radius } from '../theme';

interface DurationSliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 60];

function formatDuration(minutes: number): string {
  return minutes >= 60 ? `${minutes / 60} hr` : `${minutes}`;
}

const DurationSlider: React.FC<DurationSliderProps> = React.memo(
  ({ value, onValueChange }) => {
    const handlePress = useCallback(
      (newVal: number) => {
        onValueChange(newVal);
      },
      [onValueChange],
    );

    const displayValue = value >= 60 ? `1 ${t('hour')}` : `${value} ${t('minutes')}`;

    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {t('dndDuration')}: <Text style={styles.valueText}>{displayValue}</Text>
        </Text>
        <View style={styles.pillRow}>
          {DURATION_OPTIONS.map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.pill, v === value && styles.pillActive]}
              onPress={() => handlePress(v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, v === value && styles.pillTextActive]}>
                {formatDuration(v)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  },
);

DurationSlider.displayName = 'DurationSlider';

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  valueText: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 0,
    backgroundColor: colors.bg.cardHover,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.accent.emerald,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default DurationSlider;
