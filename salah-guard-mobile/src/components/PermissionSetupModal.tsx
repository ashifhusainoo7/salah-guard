import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  AppState,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  hasDndPermission,
  requestDndPermission,
  isBatteryOptimizationExcluded,
  requestBatteryOptimizationExclusion,
} from '../services/dndBridge';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../services/iosNotifications';
import { colors, spacing, radius, glassCard, typography } from '../theme';

const isAndroid = Platform.OS === 'android';
const isIos = Platform.OS === 'ios';

const PermissionSetupModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dndGranted, setDndGranted] = useState(false);
  const [batteryGranted, setBatteryGranted] = useState(false);
  const [iosNotifGranted, setIosNotifGranted] = useState(false);
  const appState = useRef(AppState.currentState);
  const checkedOnce = useRef(false);

  const checkPermissions = useCallback(async () => {
    if (isAndroid) {
      const [dnd, battery] = await Promise.all([
        hasDndPermission().catch(() => false),
        isBatteryOptimizationExcluded().catch(() => false),
      ]);
      setDndGranted(dnd);
      setBatteryGranted(battery);

      if (dnd && battery) {
        setVisible(false);
      } else if (checkedOnce.current || !dnd || !battery) {
        setVisible(true);
      }
    } else if (isIos) {
      const granted = await hasNotificationPermission().catch(() => false);
      setIosNotifGranted(granted);

      if (granted) {
        setVisible(false);
      } else if (checkedOnce.current || !granted) {
        setVisible(true);
      }
    }
    checkedOnce.current = true;
  }, []);

  // Check on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Re-check when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkPermissions();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [checkPermissions]);

  // Auto-dismiss when all permissions granted
  useEffect(() => {
    if (isAndroid && dndGranted && batteryGranted) {
      setVisible(false);
    } else if (isIos && iosNotifGranted) {
      setVisible(false);
    }
  }, [dndGranted, batteryGranted, iosNotifGranted]);

  const handleGrantDnd = useCallback(async () => {
    await requestDndPermission();
    // Re-check after a short delay — the battery optimization dialog
    // is an in-app overlay that may not trigger an AppState change.
    setTimeout(checkPermissions, 500);
  }, [checkPermissions]);

  const handleGrantBattery = useCallback(async () => {
    await requestBatteryOptimizationExclusion();
    setTimeout(checkPermissions, 500);
  }, [checkPermissions]);

  const handleGrantIosNotif = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setIosNotifGranted(granted);
  }, []);

  const handleSkip = useCallback(() => {
    setVisible(false);
  }, []);

  const allGranted = isAndroid
    ? dndGranted && batteryGranted
    : iosNotifGranted;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleSkip}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="mosque" size={32} color={colors.accent.emerald} />
          </View>
          <Text style={styles.title}>Smart Salah</Text>
          <Text style={styles.subtitle}>
            {isIos
              ? 'Grant notification access so you get prayer reminders.'
              : 'Grant these permissions so DND activates reliably during prayers.'}
          </Text>
        </View>

        {/* Permission Cards */}
        <View style={styles.cardList}>
          {isAndroid && (
            <>
              <PermissionCard
                icon="do-not-disturb"
                title="DND Access"
                description="Allows the app to silence your phone during prayer times."
                granted={dndGranted}
                onGrant={handleGrantDnd}
              />
              <PermissionCard
                icon="battery-heart-outline"
                title="Battery Optimization"
                description="Prevents Android from killing the app in the background."
                granted={batteryGranted}
                onGrant={handleGrantBattery}
              />
            </>
          )}

          {isIos && (
            <PermissionCard
              icon="bell-ring-outline"
              title="Notifications"
              description="Receive reminders to enable DND at prayer times."
              granted={iosNotifGranted}
              onGrant={handleGrantIosNotif}
            />
          )}
        </View>

        {/* Bottom buttons */}
        <View style={styles.footer}>
          {allGranted ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface PermissionCardProps {
  icon: string;
  title: string;
  description: string;
  granted: boolean;
  onGrant: () => void;
}

const PermissionCard: React.FC<PermissionCardProps> = React.memo(
  ({ icon, title, description, granted, onGrant }) => (
    <View style={[styles.card, granted && styles.cardGranted]}>
      <View style={styles.cardRow}>
        <View style={[styles.cardIcon, granted && styles.cardIconGranted]}>
          <Icon
            name={granted ? 'check-circle' : (icon as any)}
            size={22}
            color={granted ? colors.accent.emerald : colors.text.secondary}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, granted && styles.cardTitleGranted]}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        {granted ? (
          <View style={styles.grantButtonDisabled}>
            <Text style={styles.grantTextDisabled}>Granted</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.grantButton}
            onPress={onGrant}
            activeOpacity={0.8}
          >
            <Text style={styles.grantText}>Grant</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ),
);

PermissionCard.displayName = 'PermissionCard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardList: {
    gap: spacing.md,
  },
  card: {
    ...glassCard,
    padding: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconGranted: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  cardContent: {
    flex: 1,
  },
  cardGranted: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.20)',
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  cardTitleGranted: {
    color: colors.accent.emerald,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 2,
  },
  grantButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.emerald,
  },
  grantText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  grantButtonDisabled: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.input,
  },
  grantTextDisabled: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.muted,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.accent.emerald,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.muted,
  },
});

export default PermissionSetupModal;
