import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.icon,
        headerShown: false,
        tabBarButton: HapticTab,
        // Visual Style of the Bar
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'DASHBOARD',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="grid-view" size={26} color={color} />
          ),
        }}
      />
      
      {/* New "Plans" Tab instead of Explore */}
      <Tabs.Screen
        name="plans"
        options={{
          title: 'PLANS',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="route" size={22} color={color} />
          ),
        }}
      />

      {/* Routine or Activity Tab */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'HISTORY',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="history" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}