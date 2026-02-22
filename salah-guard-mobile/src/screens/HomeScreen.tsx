import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  InteractionManager,
  ListRenderItem,
} from 'react-native';
import type { Prayer } from '../types';
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

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadPrayers().catch(() => {});
      loadSettings().catch(() => {});
    });
  }, [loadPrayers, loadSettings]);

  const nextPrayer = getNextPrayer(prayers);

  const handleRefresh = useCallback(() => {
    loadPrayers().catch(() => {});
  }, [loadPrayers]);

  const renderItem: ListRenderItem<Prayer> = useCallback(
    ({ item }) => (
      <PrayerCard
        prayer={item}
        isNext={nextPrayer?.id === item.id}
      />
    ),
    [nextPrayer],
  );

  const keyExtractor = useCallback((item: Prayer) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<Prayer> | null | undefined, index: number) => ({
      length: 110,
      offset: 110 * index,
      index,
    }),
    [],
  );

  if (isLoading && prayers.length === 0) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={prayers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        windowSize={5}
        ListHeaderComponent={
          <>
            <MasterToggle />
            {nextPrayer && <CountdownTimer prayer={nextPrayer} />}
            {prayers.length > 0 && (
              <Text style={styles.sectionLabel}>{t('schedule')}</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState icon="mosque" message={t('noPrayersEnabled')} />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[colors.accent.emerald]}
            tintColor={colors.accent.emerald}
            progressBackgroundColor={colors.bg.secondary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  listContent: {
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
