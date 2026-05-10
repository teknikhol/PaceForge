import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PlansScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <ScreenShell title="Training Plans" subtitle="Choose your next milestone">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.planCard, { backgroundColor: theme.surface }]}>
          <MaterialIcons name="directions-run" size={32} color={theme.tint} />
          <View style={styles.planInfo}>
            <ThemedText type="defaultSemiBold">Couch to 5K</ThemedText>
            <ThemedText style={{ color: theme.icon }}>8 Weeks • 3 runs/week</ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 4, paddingBottom: 24 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 15,
  },
  planInfo: { flex: 1 },
});
