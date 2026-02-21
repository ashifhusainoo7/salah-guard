import React from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { t } from '../i18n/strings';

const TAB_ICONS: Record<string, string> = {
  Home: 'home-variant',
  Schedule: 'calendar-clock',
  History: 'history',
  Settings: 'cog',
};

const Tabs = createBottomTabNavigator({
  screenOptions: ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <Icon
        name={TAB_ICONS[route.name] as any}
        size={size}
        color={color}
      />
    ),
    tabBarActiveTintColor: '#1B5E20',
    tabBarInactiveTintColor: '#9E9E9E',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E0E0E0',
      paddingBottom: 4,
      height: 60,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    headerStyle: {
      backgroundColor: '#1B5E20',
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
      fontWeight: '700' as const,
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

const Navigation = createStaticNavigation(Tabs);

const AppNavigator: React.FC = () => {
  return <Navigation />;
};

export default AppNavigator;
