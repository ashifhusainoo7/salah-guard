import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { t } from '../i18n/strings';
import { colors } from '../theme';

const TAB_ICONS: Record<string, string> = {
  Home: 'home-variant',
  Schedule: 'calendar-clock',
  History: 'history',
  Settings: 'cog-outline',
};

const Tabs = createBottomTabNavigator({
  screenOptions: ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
      <View style={tabStyles.iconWrap}>
        <Icon
          name={TAB_ICONS[route.name] as any}
          size={22}
          color={color}
        />
        {focused && <View style={tabStyles.dot} />}
      </View>
    ),
    tabBarActiveTintColor: colors.accent.emerald,
    tabBarInactiveTintColor: colors.text.muted,
    tabBarStyle: {
      backgroundColor: colors.bg.tabBar,
      borderTopWidth: 0,
      paddingBottom: 8,
      paddingTop: 8,
      height: 65,
      elevation: 0,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '600' as const,
      marginTop: 2,
    },
    headerStyle: {
      backgroundColor: colors.bg.primary,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
    },
    headerTintColor: colors.text.primary,
    headerTitleStyle: {
      fontWeight: '700' as const,
      fontSize: 18,
    },
  }),
  screens: {
    Home: {
      screen: HomeScreen,
      options: {
        tabBarLabel: t('home'),
        headerTitle: t('appName'),
      },
    },
    Schedule: {
      screen: ScheduleScreen,
      options: {
        tabBarLabel: t('schedule'),
        headerTitle: t('prayerSchedule'),
      },
    },
    History: {
      screen: HistoryScreen,
      options: {
        tabBarLabel: t('history'),
        headerTitle: t('history'),
      },
    },
    Settings: {
      screen: SettingsScreen,
      options: {
        tabBarLabel: t('settings'),
        headerTitle: t('settings'),
      },
    },
  },
});

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.emerald,
    marginTop: 4,
  },
});

const Navigation = createStaticNavigation(Tabs);

const AppNavigator: React.FC = () => {
  return <Navigation />;
};

export default AppNavigator;
