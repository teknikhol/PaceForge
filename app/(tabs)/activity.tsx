import { StyleSheet, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ActivityScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <ScreenShell title="Activity History">
      <View style={styles.centered}>
        <ThemedText style={{ color: theme.icon }}>Your completed runs will appear here.</ThemedText>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
});
