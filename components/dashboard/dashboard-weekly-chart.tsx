import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Theme = (typeof Colors)['light'];

type Point = { value: number };

type Props = {
  theme: Theme;
  data: Point[];
};

export function DashboardWeeklyChart({ theme, data }: Props) {
  return (
    <View style={[dashboardStyles.card, { backgroundColor: theme.surface }]}>
      <ThemedText style={[dashboardStyles.cardLabel, { color: theme.icon }]}>WEEKLY INTENSITY</ThemedText>
      <View style={dashboardStyles.chartContainer}>
        <LineChart
          data={data}
          color={theme.tint}
          thickness={4}
          hideRules
          hideYAxisText
          areaChart
          curved
          startFillColor={theme.tint}
          startOpacity={0.3}
          endOpacity={0.01}
          height={100}
          spacing={45}
          hideDataPoints
          xAxisThickness={0}
          yAxisThickness={0}
        />
      </View>
    </View>
  );
}
