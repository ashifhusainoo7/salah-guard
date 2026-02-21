import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { t } from '../i18n/strings';

interface DurationSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
}

const MIN_VALUE = 5;
const MAX_VALUE = 30;

const DurationSlider: React.FC<DurationSliderProps> = React.memo(
  ({
    value,
    onValueChange,
    minimumValue = MIN_VALUE,
    maximumValue = MAX_VALUE,
  }) => {
    const range = maximumValue - minimumValue;
    const percentage = ((value - minimumValue) / range) * 100;

    const handlePress = useCallback(
      (newVal: number) => {
        onValueChange(newVal);
      },
      [onValueChange],
    );

    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {t('dndDuration')}: {value} {t('minutes')}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.buttonsRow}>
          {Array.from(
            { length: (maximumValue - minimumValue) / 5 + 1 },
            (_, i) => minimumValue + i * 5,
          ).map((v) => (
            <Text
              key={v}
              style={[styles.stepButton, v === value && styles.stepButtonActive]}
              onPress={() => handlePress(v)}
            >
              {v}
            </Text>
          ))}
        </View>
      </View>
    );
  },
);

DurationSlider.displayName = 'DurationSlider';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  track: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#1B5E20',
    borderRadius: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    textAlign: 'center',
    overflow: 'hidden',
  },
  stepButtonActive: {
    backgroundColor: '#1B5E20',
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default DurationSlider;
