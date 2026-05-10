import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Theme = (typeof Colors)['light'];

type Props = {
  theme: Theme;
  isDark: boolean;
  onPress?: () => void;
};

export function DashboardStartRunFab({ theme, isDark, onPress }: Props) {
  return (
    <View pointerEvents="box-none" style={dashboardStyles.fabContainer}>
      <Pressable
        style={[dashboardStyles.fab, { backgroundColor: theme.tint, shadowColor: theme.tint }]}
        onPress={onPress}>
        <FontAwesome5 name="running" size={24} color={isDark ? '#000' : '#FFF'} />
        <ThemedText style={[dashboardStyles.fabText, { color: isDark ? '#000' : '#FFF' }]}>
          START RUN
        </ThemedText>
      </Pressable>
    </View>
  );
}
