import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Theme = (typeof Colors)['light'];

type Props = {
  theme: Theme;
  isDark: boolean;
  insight: string;
};

export function DashboardMotivation({ theme, isDark, insight }: Props) {
  return (
    <View style={[dashboardStyles.motivationCard, { backgroundColor: theme.cardSecondary }]}>
      <View style={[dashboardStyles.iconCircle, { backgroundColor: theme.tint }]}>
        <MaterialIcons name="bolt" size={20} color={isDark ? '#000' : '#FFF'} />
      </View>
      <ThemedText style={[dashboardStyles.insightText, { color: theme.text }]}>{insight}</ThemedText>
    </View>
  );
}
