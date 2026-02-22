import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { t } from '../i18n/strings';
import useSalahStore from '../store/useSalahStore';
import { colors, spacing } from '../theme';

const OfflineBanner: React.FC = React.memo(() => {
  const isOffline = useSalahStore((s) => s.isOffline);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={14} color={colors.status.offline} />
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
    backgroundColor: colors.status.offlineBg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    color: colors.status.offline,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OfflineBanner;
