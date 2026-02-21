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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
      // Re-check after returning from settings
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
        <Text style={styles.sectionTitle}>{t('settings')}</Text>

        {/* Notification Settings */}
        <View style={styles.section}>
          <SettingsRow
            icon="bell-ring-outline"
            label={t('silentNotification')}
            value={settings.silentNotificationOnStart}
            onToggle={(val) => handleToggle('silentNotificationOnStart', val)}
          />
          <SettingsRow
            icon="bell-check-outline"
            label={t('showLiftedNotification')}
            value={settings.showLiftedNotification}
            onToggle={(val) => handleToggle('showLiftedNotification', val)}
          />
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
            <Icon name="do-not-disturb" size={20} color="#1B5E20" />
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>
                {t('requestDndPermission')}
              </Text>
              {hasDnd !== null && (
                <Text
                  style={[
                    styles.statusLabel,
                    { color: hasDnd ? '#2E7D32' : '#EF6C00' },
                  ]}
                >
                  {hasDnd ? 'Granted' : 'Not Granted'}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleBatteryOptimization}
            activeOpacity={0.7}
          >
            <Icon name="battery-heart-outline" size={20} color="#1B5E20" />
            <Text style={styles.actionLabel}>
              {t('excludeBatteryOptimization')}
            </Text>
            <Icon name="chevron-right" size={20} color="#999" />
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
              placeholderTextColor="#999"
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
            <Icon name="information-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>{t('appVersion')}</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <Icon name="shield-check-outline" size={20} color="#1B5E20" />
            <Text style={styles.actionLabel}>Privacy Policy</Text>
            <Icon name="open-in-new" size={16} color="#999" />
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
      <Icon name={icon} size={20} color="#1B5E20" />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
        thumbColor={value ? '#1B5E20' : '#BDBDBD'}
      />
    </View>
  ),
);

SettingsRow.displayName = 'SettingsRow';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  saveUrlButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveUrlText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#999',
  },
});

export default SettingsScreen;
