import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Theme = (typeof Colors)['light'];

type Props = {
  theme: Theme;
  distance: number;
  duration: number;
  pace: string;
};

export function DashboardTodayStats({ theme, distance, duration, pace }: Props) {
  return (
    <View style={[dashboardStyles.card, { backgroundColor: theme.surface }]}>
      <ThemedText style={[dashboardStyles.cardLabel, { color: theme.icon }]}>TODAY&apos;S PROGRESS</ThemedText>
      <View style={dashboardStyles.statsGrid}>
        <View style={dashboardStyles.statItem}>
          <MaterialIcons name="directions-run" size={26} color={theme.tint} />
          <ThemedText style={[dashboardStyles.statValue, { color: theme.text }]}>{distance}</ThemedText>
          <ThemedText style={dashboardStyles.statSubLabel}>KM</ThemedText>
        </View>
        <View style={dashboardStyles.statItem}>
          <MaterialIcons name="timer" size={26} color={theme.tint} />
          <ThemedText style={[dashboardStyles.statValue, { color: theme.text }]}>{duration}</ThemedText>
          <ThemedText style={dashboardStyles.statSubLabel}>MIN</ThemedText>
        </View>
        <View style={dashboardStyles.statItem}>
          <MaterialIcons name="speed" size={26} color={theme.tint} />
          <ThemedText style={[dashboardStyles.statValue, { color: theme.text }]}>{pace}</ThemedText>
          <ThemedText style={dashboardStyles.statSubLabel}>PACE</ThemedText>
        </View>
      </View>
    </View>
  );
}
