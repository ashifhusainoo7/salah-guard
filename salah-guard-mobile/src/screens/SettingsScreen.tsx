import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  AppState,
  Platform,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import useSalahStore from '../store/useSalahStore';
import {
  requestDndPermission,
  requestBatteryOptimizationExclusion,
  hasDndPermission,
} from '../services/dndBridge';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../services/iosNotifications';
import IosFocusHelper from '../screens/IosFocusHelper';
import OfflineBanner from '../components/OfflineBanner';
import { t } from '../i18n/strings';
import { colors, spacing, radius, glassCard } from '../theme';

const APP_VERSION = '1.0.0';

const SettingsScreen: React.FC = () => {
  const settings = useSalahStore((s) => s.settings);
  const updateSettings = useSalahStore((s) => s.updateSettings);
  const [hasDnd, setHasDnd] = useState<boolean | null>(null);
  const [showFocusGuide, setShowFocusGuide] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);
  const isIos = Platform.OS === 'ios';

  const checkDndStatus = useCallback(() => {
    if (isIos) {
      hasNotificationPermission()
        .then((result) => {
          setNotificationsEnabled(result);
          setHasDnd(result);
        })
        .catch(() => {
          setNotificationsEnabled(false);
          setHasDnd(false);
        });
    } else {
      hasDndPermission()
        .then((result) => setHasDnd(result))
        .catch(() => setHasDnd(false));
    }
  }, [isIos]);

  const handleToggle = useCallback(
    (key: keyof typeof settings, value: boolean) => {
      updateSettings({ ...settings, [key]: value }).catch(() => {});
    },
    [settings, updateSettings],
  );

  const handleRequestDndPermission = useCallback(async () => {
    await requestDndPermission();
  }, []);

  const handleBatteryOptimization = useCallback(async () => {
    await requestBatteryOptimizationExclusion();
  }, []);

  const handleIosDndRow = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      setHasDnd(granted);
      if (granted) {
        setShowFocusGuide(true);
      }
    } else {
      setShowFocusGuide(true);
    }
  }, [notificationsEnabled]);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://salahguard.app/privacy').catch(() => {});
  }, []);

  useEffect(() => {
    checkDndStatus();
  }, [checkDndStatus]);

  // Re-check DND permission when the app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkDndStatus();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [checkDndStatus]);

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Settings */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="bell-ring-outline"
            label={t('silentNotification')}
            value={settings.silentNotificationOnStart}
            onToggle={(val) => handleToggle('silentNotificationOnStart', val)}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="bell-check-outline"
            label={t('showLiftedNotification')}
            value={settings.showLiftedNotification}
            onToggle={(val) => handleToggle('showLiftedNotification', val)}
          />
        </View>

        {/* Permissions */}
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.section}>
          {isIos ? (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleIosDndRow}
              activeOpacity={0.7}
            >
              <Icon name="moon-waning-crescent" size={20} color={colors.accent.emerald} />
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>
                  {t('iosFocusSetup')}
                </Text>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: notificationsEnabled ? colors.status.successBg : colors.bg.cardHover },
                ]}>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: notificationsEnabled ? colors.status.success : colors.status.warning },
                    ]}
                  >
                    {notificationsEnabled ? t('iosFocusConfigured') : t('iosFocusSetupRequired')}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleRequestDndPermission}
                activeOpacity={0.7}
              >
                <Icon name="do-not-disturb" size={20} color={colors.accent.emerald} />
                <View style={styles.actionContent}>
                  <Text style={styles.actionLabel}>
                    {t('requestDndPermission')}
                  </Text>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: hasDnd ? colors.status.successBg : colors.bg.cardHover },
                  ]}>
                    <Text
                      style={[
                        styles.statusLabel,
                        { color: hasDnd ? colors.status.success : colors.text.muted },
                      ]}
                    >
                      {hasDnd ? 'Granted' : 'Tap to configure'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={colors.text.muted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleBatteryOptimization}
                activeOpacity={0.7}
              >
                <Icon name="battery-heart-outline" size={20} color={colors.accent.emerald} />
                <View style={styles.actionContent}>
                  <Text style={styles.actionLabel}>
                    {t('excludeBatteryOptimization')}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: colors.bg.cardHover }]}>
                    <Text style={[styles.statusLabel, { color: colors.text.muted }]}>
                      Tap to configure
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Icon name="information-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.infoLabel}>{t('appVersion')}</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <Icon name="shield-check-outline" size={20} color={colors.accent.emerald} />
            <Text style={styles.actionLabel}>Privacy Policy</Text>
            <Icon name="open-in-new" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isIos && (
        <Modal
          visible={showFocusGuide}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFocusGuide(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFocusGuide(false)} activeOpacity={0.7}>
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <IosFocusHelper onPermissionGranted={() => {
              setNotificationsEnabled(true);
              setHasDnd(true);
            }} />
          </View>
        </Modal>
      )}
    </View>
  );
};

interface SettingsRowProps {
  icon: string;
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

const SettingsRow: React.FC<SettingsRowProps> = React.memo(
  ({ icon, label, value, onToggle }) => (
    <View style={styles.settingsRow}>
      <Icon name={icon as any} size={20} color={colors.accent.emerald} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: colors.switch.trackInactive,
          true: colors.switch.trackActive,
        }}
        thumbColor={value ? colors.switch.thumbActive : colors.switch.thumbInactive}
      />
    </View>
  ),
);

SettingsRow.displayName = 'SettingsRow';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  section: {
    ...glassCard,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.bg.cardBorder,
    marginHorizontal: spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 14,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.muted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
});

export default SettingsScreen;
