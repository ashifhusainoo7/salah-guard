/**
 * iOS Focus Mode helper screen.
 * Since iOS does not allow programmatic DND control,
 * this screen walks users through setting up Focus/DND shortcuts manually.
 */
import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, radius, glassCard } from '../theme';

const IosFocusHelper: React.FC = () => {
  const openFocusSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:').catch(() => {});
    }
  }, []);

  const steps = [
    {
      icon: 'cog',
      title: 'Step 1: Open Settings',
      description: 'Go to Settings > Focus on your iPhone.',
    },
    {
      icon: 'plus-circle',
      title: 'Step 2: Create a Focus',
      description:
        'Tap the "+" button and select "Custom" to create a new Focus mode called "Salah".',
    },
    {
      icon: 'bell-off',
      title: 'Step 3: Configure Silence',
      description:
        'Choose "Silence Notifications From" and select "All Apps" to silence everything during prayer.',
    },
    {
      icon: 'clock-outline',
      title: 'Step 4: Set Schedule',
      description:
        'Under "Turn On Automatically", add a time-based schedule for each prayer time. Set the start time and end time matching your prayer schedule.',
    },
    {
      icon: 'repeat',
      title: 'Step 5: Repeat for Each Prayer',
      description:
        'Add 5 time-based automations, one for each prayer: Fajr, Dhuhr, Asr, Maghrib, and Isha.',
    },
    {
      icon: 'check-circle',
      title: 'Done!',
      description:
        'Your iPhone will now automatically enter Focus mode during prayer times. You can use the Salah Guard app to track your DND sessions.',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Icon name="apple" size={40} color={colors.text.primary} />
        <Text style={styles.title}>iOS Focus Mode Setup</Text>
        <Text style={styles.subtitle}>
          iOS does not allow apps to control Do Not Disturb directly. Follow
          these steps to set up automatic Focus mode for prayer times.
        </Text>
      </View>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <View style={styles.stepIcon}>
            <Icon name={step.icon as any} size={22} color={colors.accent.emerald} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        </View>
      ))}

      {Platform.OS === 'ios' && (
        <View style={styles.buttonContainer}>
          <Text
            style={styles.openSettingsButton}
            onPress={openFocusSettings}
          >
            Open Settings
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    padding: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  stepCard: {
    ...glassCard,
    flexDirection: 'row',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.emeraldDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  buttonContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  openSettingsButton: {
    backgroundColor: colors.accent.emerald,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center',
  },
});

export default IosFocusHelper;
