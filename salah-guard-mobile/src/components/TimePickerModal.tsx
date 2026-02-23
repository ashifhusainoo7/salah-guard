import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { parseTime, formatTime12 } from '../utils/timeUtils';
import { t } from '../i18n/strings';
import { colors, spacing, radius, glassCard } from '../theme';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: string; // "HH:mm"
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const { hours, minutes } = parseTime(initialTime);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  });

  // Reset selected date when modal opens with new initial time
  useEffect(() => {
    if (visible) {
      const { hours, minutes } = parseTime(initialTime);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      setSelectedDate(d);
    }
  }, [visible, initialTime]);

  if (!visible) return null;

  let DateTimePicker: any = null;
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch {
    // picker not available
  }

  if (!DateTimePicker) return null;

  // Android: DateTimePicker always renders its own native dialog.
  // Do NOT wrap in a Modal — that causes a double-modal bug.
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={selectedDate}
        mode="time"
        is24Hour={false}
        display="spinner"
        onChange={(_event: any, date?: Date) => {
          // On Android, onChange fires once on OK (type: 'set') or Cancel (type: 'dismissed').
          // The native dialog auto-dismisses after this callback.
          if (_event.type === 'set' && date) {
            onConfirm(date);
          } else {
            onCancel();
          }
        }}
      />
    );
  }

  // iOS: DateTimePicker renders inline (no native dialog).
  // Wrap in our own Modal with custom Confirm/Cancel buttons.
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('selectTime')}</Text>
          <Text style={styles.preview}>
            {formatTime12(selectedDate.getHours(), selectedDate.getMinutes())}
          </Text>

          <DateTimePicker
            value={selectedDate}
            mode="time"
            is24Hour={false}
            display="spinner"
            themeVariant="dark"
            onChange={(_event: any, date?: Date) => {
              // On iOS, onChange fires on every scroll — just accumulate.
              if (date) setSelectedDate(date);
            }}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm(selectedDate)}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    ...glassCard,
    width: '85%',
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  preview: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent.emerald,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.cardHover,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.muted,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.emerald,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TimePickerModal;
