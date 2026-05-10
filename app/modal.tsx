import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingRow } from '@/components/settings/setting-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsModal() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.handlebarContainer}>
        <View style={[styles.handlebar, { backgroundColor: isDark ? '#444' : '#DDD' }]} />
      </View>

      <View
        style={[
          styles.modalHeader,
          { paddingTop: insets.top > 0 ? insets.top : 20 },
        ]}>
        <View style={styles.headerColumn} />
        <View style={[styles.headerColumn, { flex: 2 }]}>
          <ThemedText style={styles.headerTitle}>Account & Settings</ThemedText>
        </View>
        <View style={styles.headerColumn}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={20}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <ThemedText style={{ color: theme.tint, fontWeight: '700', fontSize: 16 }}>Done</ThemedText>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.largeAvatar, { backgroundColor: theme.tint }]}>
            <ThemedText style={[styles.avatarInitial, { color: isDark ? '#000' : '#FFF' }]}>A</ThemedText>
          </View>
          <ThemedText style={styles.userName}>Alex Runner</ThemedText>
          <ThemedText style={{ color: theme.icon, fontSize: 14 }}>alex.run@example.com</ThemedText>

          <Pressable style={[styles.editButton, { borderColor: isDark ? '#444' : '#DDD' }]}>
            <ThemedText style={{ fontSize: 13, fontWeight: '700' }}>Edit Profile</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.groupLabel}>APPEARANCE</ThemedText>
        <View style={[styles.group, { backgroundColor: theme.surface }]}>
          <Pressable onPress={toggleTheme} style={styles.rowPressable}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#24292E' : '#F1F5F9' }]}>
              <MaterialIcons name={isDark ? 'wb-sunny' : 'nights-stay'} size={22} color={theme.tint} />
            </View>
            <View style={styles.rowTextContainer}>
              <ThemedText style={styles.rowLabel}>Dark Mode</ThemedText>
            </View>
            <View style={{ marginRight: 10 }}>
              <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>{isDark ? 'ON' : 'OFF'}</ThemedText>
            </View>
          </Pressable>
        </View>

        <ThemedText style={styles.groupLabel}>PREFERENCES</ThemedText>
        <View style={[styles.group, { backgroundColor: theme.surface }]}>
          <SettingRow icon="notifications" label="Notifications" sublabel="On" />
          <SettingRow icon="straighten" label="Units" sublabel="Metric (km)" />
          <SettingRow icon="lock" label="Privacy" isLast />
        </View>

        <ThemedText style={styles.groupLabel}>SUPPORT</ThemedText>
        <View style={[styles.group, { backgroundColor: theme.surface }]}>
          <SettingRow icon="help-outline" label="Help Center" />
          <SettingRow icon="info-outline" label="About" isLast />
        </View>

        <Pressable style={[styles.logoutButton, { backgroundColor: theme.surface }]}>
          <MaterialIcons name="logout" size={20} color="#FF3B30" />
          <ThemedText style={{ color: '#FF3B30', fontWeight: '700' }}>Sign Out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handlebarContainer: {
    alignItems: 'center',
    paddingTop: 10,
    width: '100%',
  },
  handlebar: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  headerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollBody: { padding: 20 },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 32,
    marginBottom: 30,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 32, fontWeight: '900' },
  userName: { fontSize: 22, fontWeight: '800' },
  editButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.5,
    marginLeft: 15,
    marginBottom: 8,
    letterSpacing: 1,
  },
  group: { borderRadius: 24, marginBottom: 25, overflow: 'hidden' },
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 24,
    gap: 10,
  },
});
