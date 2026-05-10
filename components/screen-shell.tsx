import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Applied to the main content area below the optional header */
  contentStyle?: ViewProps['style'];
};

export function ScreenShell({ children, title, subtitle, contentStyle }: Props) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {(title != null || subtitle != null) && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          {title != null ? <ThemedText type="title">{title}</ThemedText> : null}
          {subtitle != null ? (
            <ThemedText style={[styles.subtitle, { color: theme.icon }]}>{subtitle}</ThemedText>
          ) : null}
        </View>
      )}
      <View style={[styles.body, contentStyle]}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 8 },
  subtitle: { marginTop: 6, fontSize: 16 },
  body: { flex: 1 },
});
