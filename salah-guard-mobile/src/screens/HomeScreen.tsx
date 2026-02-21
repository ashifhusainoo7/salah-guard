import React, { useEffect, useCallback } from 'react';
import {
  View,
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
      length: 120,
      offset: 120 * index,
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
          </>
        }
        ListEmptyComponent={
          <EmptyState icon="mosque" message={t('noPrayersEnabled')} />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#1B5E20']}
            tintColor="#1B5E20"
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
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default HomeScreen;
