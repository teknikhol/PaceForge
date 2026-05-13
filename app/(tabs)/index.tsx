import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardMotivation } from '@/components/dashboard/dashboard-motivation';
import { DashboardRecentRuns } from '@/components/dashboard/dashboard-recent-runs';
import { DashboardStartRunFab } from '@/components/dashboard/dashboard-start-run-fab';
import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { DashboardTodayStats } from '@/components/dashboard/dashboard-today-stats';
import { DashboardWeeklyChart } from '@/components/dashboard/dashboard-weekly-chart';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  dashboardMockInsight,
  dashboardMockRecentRuns,
  dashboardMockTodayStats,
  dashboardMockTrendData,
  dashboardMockWeekStats,
  getGreeting
} from '@/lib/dashboard-data';
import { auth, db } from '@/lib/firebase-config';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const [userName, setUserName] = useState('Runner');

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        // 1. Try to load from cache immediately for a seamless feel
        const cachedName = await AsyncStorage.getItem(`user_name_${auth.currentUser.uid}`);
        if (cachedName) setUserName(cachedName);

        // 2. Sync with Firestore to ensure data is up to date
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const name = docSnap.data().firstName;
          setUserName(name || 'Runner');
          await AsyncStorage.setItem(`user_name_${auth.currentUser.uid}`, name);
        }
      }
    };
    loadProfile();
  }, []);

  return (
    <ThemedView style={[dashboardStyles.container, { backgroundColor: theme.background }]}>
      <DashboardHeader
        theme={theme}
        isDark={isDark}
        paddingTop={insets.top + 12}
        greeting={getGreeting()}
        userName={userName}
        streak={dashboardMockWeekStats.streak}
        subtitle="☀️ 68°F • Ready to run? 🏃‍♂️"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dashboardStyles.scrollContent}>
        <DashboardMotivation theme={theme} isDark={isDark} insight={dashboardMockInsight} />
        <DashboardTodayStats
          theme={theme}
          distance={dashboardMockTodayStats.distance}
          duration={dashboardMockTodayStats.duration}
          pace={dashboardMockTodayStats.pace}
        />
        <DashboardWeeklyChart theme={theme} data={dashboardMockTrendData} />
        <DashboardRecentRuns theme={theme} runs={dashboardMockRecentRuns} />
      </ScrollView>

      <DashboardStartRunFab theme={theme} isDark={isDark} onPress={() => router.push('/active-run')} />
    </ThemedView>
  );
}
