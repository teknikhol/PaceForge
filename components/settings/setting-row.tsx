import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  icon: MaterialIconName;
  label: string;
  sublabel?: string;
  iconColor?: string;
  isLast?: boolean;
  onPress?: () => void;
};

export function SettingRow({ icon, label, sublabel, iconColor, isLast, onPress }: Props) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? '#333' : '#EEE',
        },
      ]}>
      <View style={styles.rowPressable}>
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#24292E' : '#F1F5F9' }]}>
          <MaterialIcons name={icon} size={22} color={iconColor ?? theme.tint} />
        </View>
        <View style={styles.rowTextContainer}>
          <ThemedText style={styles.rowLabel}>{label}</ThemedText>
          {sublabel != null ? (
            <ThemedText style={[styles.rowSublabel, { color: theme.icon }]}>{sublabel}</ThemedText>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.icon} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rowTextContainer: { flex: 1, justifyContent: 'center', minWidth: 0 },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  rowSublabel: { fontSize: 12, marginTop: 2 },
});
