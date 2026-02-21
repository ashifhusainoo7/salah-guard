import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { t } from '../i18n/strings';

interface LoadingViewProps {
  message?: string;
}

const LoadingView: React.FC<LoadingViewProps> = React.memo(({ message }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#1B5E20" />
    <Text style={styles.text}>{message ?? t('loading')}</Text>
  </View>
));

LoadingView.displayName = 'LoadingView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
});

export default LoadingView;
