import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  InteractionManager,
} from 'react-native';
import useSalahStore from '../store/useSalahStore';
import { getNextPrayer } from '../utils/prayerUtils';
import MasterToggle from '../components/MasterToggle';
import CountdownTimer from '../components/CountdownTimer';
import PrayerCard from '../components/PrayerCard';
import OfflineBanner from '../components/OfflineBanner';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import { t } from '../i18n/strings';
import { colors, spacing } from '../theme';

const HomeScreen: React.FC = () => {
  const prayers = useSalahStore((s) => s.prayers);
  const isLoading = useSalahStore((s) => s.isLoading);
  const loadPrayers = useSalahStore((s) => s.loadPrayers);
  const loadSettings = useSalahStore((s) => s.loadSettings);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadPrayers().catch(() => { });
      loadSettings().catch(() => { });
    });
  }, [loadPrayers, loadSettings]);

  useEffect(() => {
    const id = setInterval(() => setTick((prev) => prev + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const nextPrayer = useMemo(() => getNextPrayer(prayers), [prayers, tick]);

  const handleCountdownExpired = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    loadPrayers().catch(() => { });
  }, [loadPrayers]);

  if (isLoading && prayers.length === 0) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.accent.emerald]}
            tintColor={colors.accent.emerald}
            progressBackgroundColor={colors.bg.secondary}
          />
        }
      >
        <MasterToggle />
        {nextPrayer && (
          <CountdownTimer prayer={nextPrayer} onExpired={handleCountdownExpired} />
        )}
        {prayers.length > 0 && (
          <Text style={styles.sectionLabel}>{t('schedule')}</Text>
        )}
        {prayers.length === 0 && !isLoading && (
          <EmptyState icon="mosque" message={t('noPrayersEnabled')} />
        )}
        {prayers.map((prayer, index) => (
          <PrayerCard
            key={`prayer-${index}-${prayer.name}`}
            prayer={prayer}
            isNext={nextPrayer?.id === prayer.id}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});

export default HomeScreen;
