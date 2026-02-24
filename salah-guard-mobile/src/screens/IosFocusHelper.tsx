/**
 * iOS DND Reminders helper screen.
 * Explains the notification-based approach and lets users enable notifications.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { requestNotificationPermission, hasNotificationPermission } from '../services/iosNotifications';
import { colors, spacing, radius, glassCard } from '../theme';

interface IosFocusHelperProps {
  onPermissionGranted?: () => void;
}

const IosFocusHelper: React.FC<IosFocusHelperProps> = ({ onPermissionGranted }) => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted && onPermissionGranted) {
      onPermissionGranted();
    }
  }, [onPermissionGranted]);

  // Check current status on mount
  React.useEffect(() => {
    hasNotificationPermission().then(setPermissionGranted);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Icon name="moon-waning-crescent" size={36} color={colors.accent.emerald} />
        </View>
        <Text style={styles.title}>DND Reminders</Text>
        <Text style={styles.subtitle}>
          We'll send you a notification at each prayer time. Just swipe down
          Control Center and tap the DND icon.
        </Text>
      </View>

      <View style={styles.stepCard}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Notification arrives</Text>
          <Text style={styles.stepDescription}>
            You'll get a reminder when each prayer starts and ends.
          </Text>
        </View>
      </View>

      <View style={styles.stepCard}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Toggle DND</Text>
          <Text style={styles.stepDescription}>
            Swipe down from the top-right corner to open Control Center,
            then tap the moon icon to turn DND on or off.
          </Text>
        </View>
      </View>

      {!permissionGranted ? (
        <TouchableOpacity
          style={styles.enableButton}
          onPress={handleEnableNotifications}
          activeOpacity={0.8}
        >
          <Icon name="bell-ring-outline" size={20} color="#FFFFFF" />
          <Text style={styles.enableButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.enabledBanner}>
          <Icon name="check-circle" size={20} color={colors.accent.emerald} />
          <Text style={styles.enabledText}>Notifications enabled — you're all set!</Text>
        </View>
      )}

      <Text style={styles.hint}>
        Notifications are scheduled with the system and will fire even if the app is closed.
      </Text>
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
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent.emeraldDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  stepCard: {
    ...glassCard,
    flexDirection: 'row',
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
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
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.emerald,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    gap: 10,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  enabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: 8,
  },
  enabledText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.emerald,
  },
  hint: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});

export default IosFocusHelper;
