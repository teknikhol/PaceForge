import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'nativewind';
import { StyleSheet, View } from 'react-native';

export default function ActivityScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Activity History</ThemedText>
      </View>
      <View style={styles.centered}>
        <ThemedText style={{ color: theme.icon }}>Your completed runs will appear here.</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});