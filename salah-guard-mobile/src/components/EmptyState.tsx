import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ icon, message }) => (
  <View style={styles.container}>
    <Icon name={icon} size={64} color="#BDBDBD" />
    <Text style={styles.text}>{message}</Text>
  </View>
));

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default EmptyState;
