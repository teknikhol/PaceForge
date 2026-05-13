import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { DynamicInsight } from '@/lib/motivation-service';

type Theme = (typeof Colors)['light'];

type Props = {
  theme: Theme;
  isDark: boolean;
  insight: DynamicInsight;
};

export function DashboardMotivation({ theme, isDark, insight }: Props) {
  return (
    <View style={[dashboardStyles.motivationCard, { backgroundColor: theme.cardSecondary }]}>
      <View style={[dashboardStyles.iconCircle, { backgroundColor: theme.tint }]}>
        <Ionicons name={insight.icon as any} size={20} color={isDark ? '#000' : '#FFF'} />
      </View>
      <View style={{ flex: 1, marginLeft: 4 }}>
        <ThemedText style={{ fontSize: 14, fontWeight: '900', color: theme.tint, letterSpacing: 0.5, marginBottom: 2 }}>
          {insight.title.toUpperCase()}
        </ThemedText>
        <ThemedText style={[dashboardStyles.insightText, { color: theme.text, marginTop: 0 }]}>{insight.message}</ThemedText>
      </View>
    </View>
  );
}
