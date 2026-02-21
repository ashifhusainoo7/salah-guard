import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { t } from '../i18n/strings';
import useSalahStore from '../store/useSalahStore';

const OfflineBanner: React.FC = React.memo(() => {
  const isOffline = useSalahStore((s) => s.isOffline);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={16} color="#FFFFFF" />
      <Text style={styles.text}>{t('offlineMessage')}</Text>
    </View>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF6C00',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OfflineBanner;
