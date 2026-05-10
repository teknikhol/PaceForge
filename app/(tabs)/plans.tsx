import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function PlansScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Training Plans</ThemedText>
        <ThemedText style={{ color: theme.icon }}>Choose your next milestone</ThemedText>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Placeholder for a Plan Card */}
        <View style={[styles.planCard, { backgroundColor: theme.surface }]}>
          <MaterialIcons name="directions-run" size={32} color={theme.tint} />
          <View style={styles.planInfo}>
            <ThemedText type="defaultSemiBold">Couch to 5K</ThemedText>
            <ThemedText style={{ color: theme.icon }}>8 Weeks • 3 runs/week</ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  content: { paddingHorizontal: 20 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 15,
  },
  planInfo: { flex: 1 },
});