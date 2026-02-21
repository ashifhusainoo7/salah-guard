import React, { useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { t } from '../i18n/strings';
import useSalahStore from '../store/useSalahStore';

const ACTIVE_COLOR = '#1B5E20';
const INACTIVE_COLOR = '#757575';

const MasterToggle: React.FC = React.memo(() => {
  const isGloballyActive = useSalahStore((s) => s.settings.isGloballyActive);
  const toggleGlobalActive = useSalahStore((s) => s.toggleGlobalActive);

  const handleToggle = useCallback(() => {
    toggleGlobalActive().catch(() => {});
  }, [toggleGlobalActive]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: isGloballyActive ? ACTIVE_COLOR : INACTIVE_COLOR },
        ]}
      >
        <Text style={styles.label}>
          {isGloballyActive ? t('salahGuardActive') : t('salahGuardInactive')}
        </Text>
        <Switch
          value={isGloballyActive}
          onValueChange={handleToggle}
          trackColor={{ false: '#B0B0B0', true: '#A5D6A7' }}
          thumbColor={isGloballyActive ? '#FFD700' : '#E0E0E0'}
          testID="master-toggle"
        />
      </View>
    </View>
  );
});

MasterToggle.displayName = 'MasterToggle';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MasterToggle;
