import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
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
import { UnitSystem } from '@/lib/run-formatting';
import { fetchWeather } from '@/lib/weather-service';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];
  const [userName, setUserName] = useState('Runner');
  const [weatherSubtitle, setWeatherSubtitle] = useState('Checking the sky... ☁️');

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        // 1. Try to load from cache immediately for a seamless feel
        const cachedName = await AsyncStorage.getItem(`user_name_${auth.currentUser.uid}`);
        const cachedUnits = await AsyncStorage.getItem(`unit_system_${auth.currentUser.uid}`) as UnitSystem | null;
        
        if (cachedName) setUserName(cachedName);
        
        // Start loading weather immediately with cached units or default
        loadWeather(cachedUnits || 'metric');

        // 2. Sync with Firestore to ensure data is up to date
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data.firstName || 'Runner');
          await AsyncStorage.setItem(`user_name_${auth.currentUser.uid}`, data.firstName);
          
          // If units changed in Firestore, refresh weather to match
          if (data.unitSystem && data.unitSystem !== cachedUnits) {
            loadWeather(data.unitSystem);
            await AsyncStorage.setItem(`unit_system_${auth.currentUser.uid}`, data.unitSystem);
          }
        }
      }
    };

    const loadWeather = async (units: UnitSystem) => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setWeatherSubtitle('Location access needed for weather 📍');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const weather = await fetchWeather(location.coords.latitude, location.coords.longitude, units);
        
        if (weather.temp !== null) {
          const tempUnit = units === 'metric' ? '°C' : '°F';
          setWeatherSubtitle(`${weather.emoji} ${weather.temp}${tempUnit} • ${weather.message}`);
        } else {
          setWeatherSubtitle(`${weather.emoji} ${weather.message}`);
        }
      } catch (error) {
        setWeatherSubtitle('Forge ahead! Ready to run? 🏃‍♂️');
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
        subtitle={weatherSubtitle}
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
