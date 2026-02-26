import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { parseTime, formatTime12 } from '../utils/timeUtils';
import { t } from '../i18n/strings';
import { colors, spacing, radius, glassCard } from '../theme';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes60 = Array.from({ length: 60 }, (_, i) => i);
const periods = ['AM', 'PM'];

// Repeat array for infinite-scroll illusion
const REPEAT = 20;
function repeatArray<T>(arr: T[]): T[] {
  const result: T[] = [];
  for (let i = 0; i < REPEAT; i++) result.push(...arr);
  return result;
}

const repeatedHours = repeatArray(hours12);
const repeatedMinutes = repeatArray(minutes60);
// Padded periods: 2 empty slots top + AM/PM + 2 empty slots bottom (so selection band aligns)
const paddedPeriods: string[] = ['', '', 'AM', 'PM', '', ''];

interface WheelColumnProps {
  data: (string | number)[];
  unitLength: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  infinite?: boolean;
}

const WheelColumn: React.FC<WheelColumnProps> = React.memo(
  ({ data, unitLength, selectedIndex, onSelect, infinite = true }) => {
    const flatListRef = useRef<FlatList>(null);
    const isScrolling = useRef(false);
    const initialScrollDone = useRef(false);

    // For infinite: center in the middle repeat block
    // For finite: offset by padding items (2 empty slots above)
    const targetOffset = infinite
      ? (Math.floor(REPEAT / 2) * unitLength + selectedIndex) * ITEM_HEIGHT - ITEM_HEIGHT * 2
      : selectedIndex * ITEM_HEIGHT;

    useEffect(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: targetOffset,
          animated: initialScrollDone.current,
        });
        initialScrollDone.current = true;
      }
    }, [targetOffset]);

    const handleScrollEnd = useCallback(
      (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        if (!isScrolling.current) return;
        isScrolling.current = false;
        const y = event.nativeEvent.contentOffset.y;
        if (infinite) {
          const rawIndex = Math.round((y + ITEM_HEIGHT * 2) / ITEM_HEIGHT);
          const mod = ((rawIndex % unitLength) + unitLength) % unitLength;
          onSelect(mod);
        } else {
          // Finite: account for top padding
          const rawIndex = Math.round(y / ITEM_HEIGHT);
          const clamped = Math.max(0, Math.min(rawIndex, unitLength - 1));
          onSelect(clamped);
        }
      },
      [unitLength, onSelect, infinite],
    );

    const handleScrollBegin = useCallback(() => {
      isScrolling.current = true;
    }, []);

    const renderItem: ListRenderItem<string | number> = useCallback(
      ({ item, index }) => {
        // For finite lists, the first 2 and last 2 items are empty padding
        if (!infinite && (typeof item === 'string' && item === '')) {
          return <View style={s.wheelItem} />;
        }
        const actualIndex = infinite
          ? ((index % unitLength) + unitLength) % unitLength
          : index - 2; // subtract top padding count
        const isSelected = actualIndex === selectedIndex;
        return (
          <TouchableOpacity
            style={s.wheelItem}
            onPress={() => { if (actualIndex >= 0 && actualIndex < unitLength) onSelect(actualIndex); }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                s.wheelItemText,
                isSelected && s.wheelItemTextActive,
              ]}
            >
              {typeof item === 'number' ? item.toString().padStart(2, '0') : item}
            </Text>
          </TouchableOpacity>
        );
      },
      [unitLength, selectedIndex, onSelect, infinite],
    );

    const keyExtractor = useCallback(
      (_: string | number, index: number) => `${index}`,
      [],
    );

    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      [],
    );

    return (
      <View style={s.wheelWrapper}>
        {/* Top fade */}
        <View style={[s.fadeMask, s.fadeTop]} pointerEvents="none" />
        <FlatList
          ref={flatListRef}
          data={data as any[]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollBeginDrag={handleScrollBegin}
          style={{ height: WHEEL_HEIGHT }}
          contentContainerStyle={{ paddingVertical: 0 }}
        />
        {/* Bottom fade */}
        <View style={[s.fadeMask, s.fadeBottom]} pointerEvents="none" />
      </View>
    );
  },
);

WheelColumn.displayName = 'WheelColumn';

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [hour12, setHour12] = useState(5);
  const [minute, setMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);

  useEffect(() => {
    if (visible) {
      const { hours, minutes } = parseTime(initialTime);
      const h = hours % 12 || 12;
      setHour12(h);
      setMinute(minutes);
      setIsPM(hours >= 12);
    }
  }, [visible, initialTime]);

  const handleConfirm = useCallback(() => {
    const d = new Date();
    let h24 = hour12 % 12;
    if (isPM) h24 += 12;
    d.setHours(h24, minute, 0, 0);
    onConfirm(d);
  }, [hour12, minute, isPM, onConfirm]);

  if (!visible) return null;

  const displayH24 = (hour12 % 12) + (isPM ? 12 : 0);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* Header */}
          <Text style={s.label}>SELECT TIME</Text>
          <Text style={s.preview}>
            {formatTime12(displayH24, minute)}
          </Text>

          {/* Wheel area */}
          <View style={s.wheelsRow}>
            {/* Selection indicator band */}
            <View style={s.selectionBand} />

            <WheelColumn
              data={repeatedHours}
              unitLength={12}
              selectedIndex={hour12 - 1}
              onSelect={(i) => setHour12(i + 1)}
            />

            <Text style={s.colon}>:</Text>

            <WheelColumn
              data={repeatedMinutes}
              unitLength={60}
              selectedIndex={minute}
              onSelect={setMinute}
            />

            <WheelColumn
              data={paddedPeriods}
              unitLength={2}
              selectedIndex={isPM ? 1 : 0}
              onSelect={(i) => setIsPM(i === 1)}
              infinite={false}
            />
          </View>

          {/* Action buttons */}
          <View style={s.buttonRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={s.cancelTxt}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} activeOpacity={0.7}>
              <Text style={s.confirmTxt}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    ...glassCard,
    width: '88%',
    maxWidth: 380,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  preview: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.accent.emerald,
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
    position: 'relative',
    marginBottom: spacing.md,
  },
  selectionBand: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  colon: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.secondary,
    marginHorizontal: 2,
    marginBottom: 2,
  },
  wheelWrapper: {
    height: WHEEL_HEIGHT,
    width: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(241,245,249,0.20)',
  },
  wheelItemTextActive: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
  },
  fadeMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 2,
  },
  fadeTop: {
    top: 0,
    backgroundColor: 'transparent',
    // Simulated gradient via layered semi-transparent overlays
    borderBottomWidth: 0,
  },
  fadeBottom: {
    bottom: 0,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.cardHover,
    alignItems: 'center',
  },
  cancelTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.muted,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.emerald,
    alignItems: 'center',
  },
  confirmTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TimePickerModal;
