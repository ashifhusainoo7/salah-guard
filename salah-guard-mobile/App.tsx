import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoadingView from './src/components/LoadingView';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { useAuth } from './src/hooks/useAuth';
import {
  initializeNotificationChannel,
  configureNotificationListener,
} from './src/services/alarmScheduler';
import logger from './src/utils/logger';

const App: React.FC = () => {
  const { isInitializing } = useAuth();
  useNetworkStatus();

  useEffect(() => {
    initializeNotificationChannel();
    configureNotificationListener();
    logger.info('App initialized');
  }, []);

  if (isInitializing) {
    return <LoadingView />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F1624" />
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
