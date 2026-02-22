import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { t } from '../i18n/strings';
import { colors, spacing } from '../theme';

interface LoadingViewProps {
  message?: string;
}

const LoadingView: React.FC<LoadingViewProps> = React.memo(({ message }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.accent.emerald} />
    <Text style={styles.text}>{message ?? t('loading')}</Text>
  </View>
));

LoadingView.displayName = 'LoadingView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.bg.primary,
  },
  text: {
    marginTop: spacing.lg,
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default LoadingView;
