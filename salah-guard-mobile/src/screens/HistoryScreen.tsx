import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  InteractionManager,
  ListRenderItem,
} from 'react-native';
import type { DndSession } from '../types';
import useSalahStore from '../store/useSalahStore';
import HistoryItem from '../components/HistoryItem';
import OfflineBanner from '../components/OfflineBanner';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import { t } from '../i18n/strings';
import { colors } from '../theme';

const HistoryScreen: React.FC = () => {
  const history = useSalahStore((s) => s.history);
  const isLoading = useSalahStore((s) => s.isLoading);
  const isRefreshing = useSalahStore((s) => s.isRefreshing);
  const historyPage = useSalahStore((s) => s.historyPage);
  const historyTotalPages = useSalahStore((s) => s.historyTotalPages);
  const loadHistory = useSalahStore((s) => s.loadHistory);
  const refreshHistory = useSalahStore((s) => s.refreshHistory);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadHistory(1).catch(() => {});
    });
  }, [loadHistory]);

  const handleRefresh = useCallback(() => {
    refreshHistory().catch(() => {});
  }, [refreshHistory]);

  const handleEndReached = useCallback(() => {
    if (!isLoading && historyPage < historyTotalPages) {
      loadHistory(historyPage + 1).catch(() => {});
    }
  }, [isLoading, historyPage, historyTotalPages, loadHistory]);

  const renderItem: ListRenderItem<DndSession> = useCallback(
    ({ item }) => <HistoryItem session={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: DndSession) => item.id.toString(),
    [],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<DndSession> | null | undefined, index: number) => ({
      length: 110,
      offset: 110 * index,
      index,
    }),
    [],
  );

  if (isLoading && history.length === 0) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        windowSize={7}
        maxToRenderPerBatch={10}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState icon="history" message={t('emptyHistory')} />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
    paddingVertical: 8,
    flexGrow: 1,
  },
});

export default HistoryScreen;
