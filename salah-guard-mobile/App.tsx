import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoadingView from './src/components/LoadingView';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { useAuth } from './src/hooks/useAuth';
import {
  initializeNotificationChannel,
  configureNotificationListener,
} from './src/services/alarmScheduler';
import { t } from './src/i18n/strings';
import logger from './src/utils/logger';

// Initialize Sentry for crash reporting
Sentry.init({
  dsn: '__YOUR_SENTRY_DSN__',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

const App: React.FC = () => {
  const { isInitializing } = useAuth();
  useNetworkStatus();

  useEffect(() => {
    // Initialize notification channel
    initializeNotificationChannel();
    configureNotificationListener();

    // Root/jailbreak detection
    if (Platform.OS === 'android') {
      try {
        const JailMonkey = require('react-native-jail-monkey');
        if (JailMonkey.isJailBroken()) {
          Alert.alert(t('rootDetected'), t('rootDetectedMessage'));
          logger.warn('Rooted device detected');
        }
      } catch {
        // Module not available in dev
      }
    }
  }, []);

  if (isInitializing) {
    return <LoadingView />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default Sentry.wrap(App);
