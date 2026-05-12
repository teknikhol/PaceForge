import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading && !user) {
      // Animated transition to auth screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/auth');
      });
    }
  }, [user, loading, fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
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
            height: Platform.OS === 'ios' ? 90 + insets.bottom : 70 + insets.bottom,
            paddingBottom: Platform.OS === 'ios' ? 30 + insets.bottom : Math.max(12, insets.bottom),
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

        {/* History Tab */}
        <Tabs.Screen
          name="history"
          options={{
            title: 'HISTORY',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="history" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </Animated.View>
  );
}
