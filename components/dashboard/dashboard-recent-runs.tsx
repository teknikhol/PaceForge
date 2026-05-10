import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import type { RunData } from '@/lib/dashboard-data';

type Theme = (typeof Colors)['light'];

type Props = {
  theme: Theme;
  runs: RunData[];
};

export function DashboardRecentRuns({ theme, runs }: Props) {
  return (
    <View style={[dashboardStyles.card, { backgroundColor: theme.surface }]}>
      <ThemedText style={[dashboardStyles.cardLabel, { color: theme.icon }]}>RECENT ACTIVITY</ThemedText>
      {runs.map((run, index) => (
        <Pressable
          key={run.id}
          style={[
            dashboardStyles.runItem,
            { borderBottomWidth: index === runs.length - 1 ? 0 : StyleSheet.hairlineWidth },
          ]}>
          <View>
            <ThemedText style={[dashboardStyles.runDate, { color: theme.text }]}>{run.date}</ThemedText>
            <ThemedText style={[dashboardStyles.runDetails, { color: theme.icon }]}>
              {run.distance} km • {run.pace} /km
            </ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
        </Pressable>
      ))}
    </View>
  );
}
