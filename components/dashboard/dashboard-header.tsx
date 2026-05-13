import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { dashboardStyles } from '@/components/dashboard/dashboard-styles';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type Theme = (typeof Colors)['light'];

type Props = {
  theme: Theme;
  isDark: boolean;
  paddingTop: number;
  greeting: string;
  userName: string;
  streak: number;
  subtitle: string;
};

export function DashboardHeader({
  theme,
  isDark,
  paddingTop,
  greeting,
  userName,
  streak,
  subtitle,
}: Props) {
  return (
    <View style={[dashboardStyles.header, { paddingTop }]}>
      <View style={{ flex: 1 }}>
        <View style={dashboardStyles.greetingRow}>
          <ThemedText 
            numberOfLines={2} 
            ellipsizeMode="tail"
            style={[dashboardStyles.greetingText, { color: theme.text, flex: 1, marginRight: 8 }]}
          >
            {greeting}, {userName}!
          </ThemedText>
          <View
            style={[
              dashboardStyles.streakBadge,
              {
                backgroundColor: isDark ? 'rgba(118, 255, 3, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                marginLeft: 'auto',
              },
            ]}>
            <ThemedText style={[dashboardStyles.streakText, { color: theme.accent }]}>
              {streak}🔥
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[dashboardStyles.headerSubtitle, { color: theme.icon }]}>{subtitle}</ThemedText>
      </View>

      <View style={[dashboardStyles.headerActions, { marginLeft: 16 }]}>
        <Pressable
          onPress={() => router.push('/modal')}
          style={({ pressed }) => [
            dashboardStyles.profileButton,
            { borderColor: theme.tint, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText style={[dashboardStyles.avatarText, { color: theme.text }]}>
            {(userName || 'R').charAt(0).toUpperCase()}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
