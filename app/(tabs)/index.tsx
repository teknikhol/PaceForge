import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

interface RunData {
  id: string;
  date: string;
  distance: number;
  duration: number;
  pace: string;
}

export default function DashboardScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];

  // Mock data
  const user = { name: "Alex" };
  const todayStats = { distance: 5.2, duration: 32, pace: '6:09' };
  const weekStats = { distance: 28.5, runs: 4, streak: 12 };
  const insight = "You're 8% faster than last week! 🔥 Keep crushing it";

  const recentRuns: RunData[] = [
    { id: '1', date: 'Today', distance: 5.2, duration: 32, pace: '6:09' },
    { id: '2', date: 'May 8', distance: 7.3, duration: 46, pace: '6:18' },
    { id: '3', date: 'May 7', distance: 8.1, duration: 51, pace: '6:19' },
  ];

  const trendData = [
    { value: 20 }, { value: 35 }, { value: 45 }, { value: 55 }, { value: 40 }, { value: 65 }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* --- REFINED HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.greetingRow}>
            <ThemedText style={[styles.greetingText, { color: theme.text }]}>
              {getGreeting()}, {user.name}!
            </ThemedText>
            <View style={[styles.streakBadge, { backgroundColor: isDark ? 'rgba(118, 255, 3, 0.1)' : 'rgba(234, 88, 12, 0.1)' }]}>
              <ThemedText style={[styles.streakText, { color: theme.accent }]}>{weekStats.streak}🔥</ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.headerSubtitle, { color: theme.icon }]}>
            ☀️ 68°F • Ready to run? 🏃‍♂️
          </ThemedText>
        </View>
        
        {/* ACTION BUTTONS */}
        <View style={styles.headerActions}>

          {/* PROFILE BUTTON - Triggers the app/modal.tsx */}
          <Pressable 
            onPress={() => router.push('/modal')}
            style={({ pressed }) => [
              styles.profileButton, 
              { borderColor: theme.tint, opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <ThemedText style={[styles.avatarText, { color: theme.text }]}>A</ThemedText>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- MOTIVATION SECTION --- */}
        <View style={[styles.motivationCard, { backgroundColor: theme.cardSecondary }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.tint }]}>
            <MaterialIcons name="bolt" size={20} color={isDark ? '#000' : '#FFF'} />
          </View>
          <ThemedText style={[styles.insightText, { color: theme.text }]}>
            {insight}
          </ThemedText>
        </View>

        {/* --- TODAY'S STATS --- */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.cardLabel, { color: theme.icon }]}>TODAY'S PROGRESS</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="directions-run" size={26} color={theme.tint} />
              <ThemedText style={[styles.statValue, { color: theme.text }]}>{todayStats.distance}</ThemedText>
              <ThemedText style={styles.statSubLabel}>KM</ThemedText>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="timer" size={26} color={theme.tint} />
              <ThemedText style={[styles.statValue, { color: theme.text }]}>{todayStats.duration}</ThemedText>
              <ThemedText style={styles.statSubLabel}>MIN</ThemedText>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="speed" size={26} color={theme.tint} />
              <ThemedText style={[styles.statValue, { color: theme.text }]}>{todayStats.pace}</ThemedText>
              <ThemedText style={styles.statSubLabel}>PACE</ThemedText>
            </View>
          </View>
        </View>

        {/* --- ACTIVITY TREND --- */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.cardLabel, { color: theme.icon }]}>WEEKLY INTENSITY</ThemedText>
          <View style={styles.chartContainer}>
            <LineChart
              data={trendData}
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

        {/* --- RECENT ACTIVITY --- */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={[styles.cardLabel, { color: theme.icon }]}>RECENT ACTIVITY</ThemedText>
          {recentRuns.map((run, index) => (
            <Pressable 
              key={run.id} 
              style={[
                styles.runItem, 
                { borderBottomWidth: index === recentRuns.length - 1 ? 0 : StyleSheet.hairlineWidth }
              ]}
            >
              <View>
                <ThemedText style={[styles.runDate, { color: theme.text }]}>{run.date}</ThemedText>
                <ThemedText style={[styles.runDetails, { color: theme.icon }]}>
                  {run.distance} km • {run.pace} /km
                </ThemedText>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* --- FLOATING ACTION BUTTON --- */}
      <View pointerEvents="box-none" style={styles.fabContainer}>
        <Pressable 
          style={[styles.fab, { backgroundColor: theme.tint, shadowColor: theme.tint }]}
          onPress={() => console.log("Starting Workout")}
        >
          <FontAwesome5 name="running" size={24} color={isDark ? '#000' : '#FFF'} />
          <ThemedText style={[styles.fabText, { color: isDark ? '#000' : '#FFF' }]}>START RUN</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greetingText: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakText: { fontSize: 14, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleButton: { 
    padding: 10, 
    borderRadius: 14, 
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 150, paddingTop: 10 },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    marginBottom: 20,
    gap: 14
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  insightText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  card: {
    padding: 20,
    borderRadius: 28,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 18 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 6 },
  statSubLabel: { fontSize: 10, fontWeight: '800', opacity: 0.6 },
  chartContainer: { marginLeft: -20, marginTop: 10 },
  runItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  runDate: { fontSize: 16, fontWeight: '700' },
  runDetails: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  fabContainer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 40,
    gap: 12,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabText: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});