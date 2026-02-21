import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { t } from '../i18n/strings';

interface DurationSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
}

const TRACK_WIDTH = 280;
const THUMB_SIZE = 28;
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
    const initialProgress = ((value - minimumValue) / range) * TRACK_WIDTH;
    const translateX = useSharedValue(initialProgress);

    const updateValue = useCallback(
      (x: number) => {
        const clamped = Math.max(0, Math.min(x, TRACK_WIDTH));
        const newValue = Math.round(
          minimumValue + (clamped / TRACK_WIDTH) * range,
        );
        onValueChange(newValue);
      },
      [minimumValue, range, onValueChange],
    );

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        const newX = Math.max(
          0,
          Math.min(initialProgress + event.translationX, TRACK_WIDTH),
        );
        translateX.value = newX;
        runOnJS(updateValue)(newX);
      })
      .onEnd(() => {
        const snapped =
          ((Math.round(
            minimumValue + (translateX.value / TRACK_WIDTH) * range,
          ) -
            minimumValue) /
            range) *
          TRACK_WIDTH;
        translateX.value = withTiming(snapped, { duration: 100 });
      });

    const thumbStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
    }));

    const fillStyle = useAnimatedStyle(() => ({
      width: translateX.value,
    }));

    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {t('dndDuration')}: {value} {t('minutes')}
        </Text>
        <GestureHandlerRootView>
          <GestureDetector gesture={panGesture}>
            <View style={styles.trackContainer}>
              <View style={styles.track}>
                <Animated.View style={[styles.fill, fillStyle]} />
              </View>
              <Animated.View style={[styles.thumb, thumbStyle]} />
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
        <View style={styles.labels}>
          <Text style={styles.rangeLabel}>{minimumValue} {t('minutes')}</Text>
          <Text style={styles.rangeLabel}>{maximumValue} {t('minutes')}</Text>
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
  trackContainer: {
    width: TRACK_WIDTH + THUMB_SIZE,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
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
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#1B5E20',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    top: (40 - THUMB_SIZE) / 2,
    left: THUMB_SIZE / 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 11,
    color: '#999',
  },
});

export default DurationSlider;
