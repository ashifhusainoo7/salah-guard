import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface EmptyStateProps {
  icon: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ icon, message }) => (
  <View style={styles.container}>
    <Icon name={icon as any} size={64} color={colors.text.muted} />
    <Text style={styles.text}>{message}</Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  text: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default EmptyState;
