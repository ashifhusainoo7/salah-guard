import React, { useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { t } from '../i18n/strings';
import useSalahStore from '../store/useSalahStore';
import { colors, radius, spacing, glassCard } from '../theme';

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
          isGloballyActive && styles.cardActive,
        ]}
      >
        <View style={styles.textWrap}>
          <Text style={styles.label}>
            {isGloballyActive ? t('salahGuardActive') : t('salahGuardInactive')}
          </Text>
          <Text style={styles.sublabel}>
            {isGloballyActive ? 'DND will activate during prayers' : 'All prayers paused'}
          </Text>
        </View>
        <Switch
          value={isGloballyActive}
          onValueChange={handleToggle}
          trackColor={{
            false: colors.switch.trackInactive,
            true: colors.switch.trackActive,
          }}
          thumbColor={isGloballyActive ? colors.switch.thumbActive : colors.switch.thumbInactive}
          testID="master-toggle"
        />
      </View>
    </View>
  );
});

MasterToggle.displayName = 'MasterToggle';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    ...glassCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  cardActive: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sublabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default MasterToggle;
