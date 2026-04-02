import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProtocolsScreen } from '../screens/ProtocolsScreen';
import { AddEditProtocolScreen } from '../screens/AddEditProtocolScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { LabsScreen } from '../screens/LabsScreen';
import { AddLabScreen } from '../screens/AddLabScreen';
import { MetricsScreen } from '../screens/MetricsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Protocol } from '../hooks/useProtocols';

export type RootStackParamList = {
  Tabs: undefined;
  AddEditProtocol: { protocol?: Protocol };
  AddLab: Record<string, never>;
};

export type TabParamList = {
  Dashboard: undefined;
  Protocols: undefined;
  Calendar: undefined;
  Labs: undefined;
  Metrics: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type TabName = keyof TabParamList;

const TAB_ICONS: Record<TabName, React.ComponentProps<typeof Feather>['name']> = {
  Dashboard: 'home',
  Protocols: 'activity',
  Calendar: 'calendar',
  Labs: 'droplet',
  Metrics: 'bar-chart-2',
  Settings: 'settings',
};

const TAB_LABELS: Record<TabName, string> = {
  Dashboard: 'Home',
  Protocols: 'Protocols',
  Calendar: 'Calendar',
  Labs: 'Labs',
  Metrics: 'Metrics',
  Settings: 'Settings',
};

function TabIcon({ name, focused }: { name: TabName; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconActive]}>
      {focused && <View style={tabStyles.glow} />}
      <Feather
        name={TAB_ICONS[name]}
        size={20}
        color={focused ? colors.accentText : colors.textMuted}
      />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  iconActive: {
    backgroundColor: colors.accentDim,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name as TabName} focused={focused} />
        ),
        tabBarLabel: TAB_LABELS[route.name as TabName],
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Protocols" component={ProtocolsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Labs" component={LabsScreen} />
      <Tab.Screen name="Metrics" component={MetricsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="AddEditProtocol"
          component={AddEditProtocolScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="AddLab"
          component={AddLabScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
