import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import useSalahStore from '../store/useSalahStore';
import {
  requestDndPermission,
  requestBatteryOptimizationExclusion,
  hasDndPermission,
} from '../services/dndBridge';
import { resetApiClient } from '../services/api';
import { getApiUrl, setApiUrl } from '../utils/storage';
import OfflineBanner from '../components/OfflineBanner';
import { t } from '../i18n/strings';
import { colors, spacing, radius, glassCard } from '../theme';

const APP_VERSION = '1.0.0';

const SettingsScreen: React.FC = () => {
  const settings = useSalahStore((s) => s.settings);
  const updateSettings = useSalahStore((s) => s.updateSettings);
  const [apiUrl, setApiUrlState] = useState(getApiUrl() ?? '');
  const [hasDnd, setHasDnd] = useState<boolean | null>(null);

  const handleToggle = useCallback(
    (key: keyof typeof settings, value: boolean) => {
      updateSettings({ ...settings, [key]: value }).catch(() => {});
    },
    [settings, updateSettings],
  );

  const handleRequestDndPermission = useCallback(async () => {
    try {
      await requestDndPermission();
      setTimeout(async () => {
        const granted = await hasDndPermission();
        setHasDnd(granted);
        if (granted) {
          Alert.alert('Success', 'DND permission granted.');
        }
      }, 1000);
    } catch {
      Alert.alert(t('error'), 'Failed to open DND permission settings.');
    }
  }, []);

  const handleBatteryOptimization = useCallback(async () => {
    try {
      await requestBatteryOptimizationExclusion();
    } catch {
      Alert.alert(
        t('error'),
        'Failed to request battery optimization exclusion.',
      );
    }
  }, []);

  const handleSaveApiUrl = useCallback(() => {
    if (apiUrl.trim()) {
      setApiUrl(apiUrl.trim());
      resetApiClient();
      Alert.alert('Success', 'API URL updated. Restart the app for full effect.');
    }
  }, [apiUrl]);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://salahguard.app/privacy').catch(() => {});
  }, []);

  React.useEffect(() => {
    hasDndPermission()
      .then(setHasDnd)
      .catch(() => setHasDnd(false));
  }, []);

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
          <View style={styles.divider} />
          <SettingsRow
            icon="theme-light-dark"
            label={t('darkMode')}
            value={settings.darkMode}
            onToggle={(val) => handleToggle('darkMode', val)}
          />
        </View>

        {/* Permissions */}
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.section}>
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
              {hasDnd !== null && (
                <View style={[
                  styles.statusPill,
                  { backgroundColor: hasDnd ? colors.status.successBg : colors.status.warningBg },
                ]}>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: hasDnd ? colors.status.success : colors.status.warning },
                    ]}
                  >
                    {hasDnd ? 'Granted' : 'Not Granted'}
                  </Text>
                </View>
              )}
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
            <Text style={styles.actionLabel}>
              {t('excludeBatteryOptimization')}
            </Text>
            <Icon name="chevron-right" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* API Configuration */}
        <Text style={styles.sectionTitle}>{t('apiServerUrl')}</Text>
        <View style={styles.section}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrlState}
              placeholder="http://10.0.2.2:5000"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={styles.saveUrlButton}
              onPress={handleSaveApiUrl}
              activeOpacity={0.7}
            >
              <Text style={styles.saveUrlText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 11,
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
    gap: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.bg.cardBorder,
    backgroundColor: colors.bg.input,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
  },
  saveUrlButton: {
    backgroundColor: colors.accent.emerald,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  saveUrlText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text.muted,
  },
});

export default SettingsScreen;
