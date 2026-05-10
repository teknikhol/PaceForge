import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardMotivation } from '@/components/dashboard/dashboard-motivation';
import { DashboardRecentRuns } from '@/components/dashboard/dashboard-recent-runs';
import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { DashboardTodayStats } from '@/components/dashboard/dashboard-today-stats';
import { DashboardWeeklyChart } from '@/components/dashboard/dashboard-weekly-chart';
import { DashboardStartRunFab } from '@/components/dashboard/dashboard-start-run-fab';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  dashboardMockInsight,
  dashboardMockRecentRuns,
  dashboardMockTodayStats,
  dashboardMockTrendData,
  dashboardMockUser,
  dashboardMockWeekStats,
  getGreeting,
} from '@/lib/dashboard-data';

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];

  return (
    <ThemedView style={[dashboardStyles.container, { backgroundColor: theme.background }]}>
      <DashboardHeader
        theme={theme}
        isDark={isDark}
        paddingTop={insets.top + 12}
        greeting={getGreeting()}
        userName={dashboardMockUser.name}
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

      <DashboardStartRunFab theme={theme} isDark={isDark} onPress={() => console.log('Starting Workout')} />
    </ThemedView>
  );
}
