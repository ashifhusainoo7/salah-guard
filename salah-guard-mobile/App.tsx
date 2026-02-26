import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import PermissionSetupModal from './src/components/PermissionSetupModal';
import useSalahStore from './src/store/useSalahStore';
import {
  initializeNotificationChannel,
  configureNotificationListener,
} from './src/services/alarmScheduler';
import logger from './src/utils/logger';

const App: React.FC = () => {
  const initialize = useSalahStore((s) => s.initialize);

  useEffect(() => {
    initialize();
    initializeNotificationChannel();
    configureNotificationListener();
    logger.info('App initialized');
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F1624" />
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
      <PermissionSetupModal />
    </SafeAreaProvider>
  );
};

export default App;
