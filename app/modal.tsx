import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingRow } from '@/components/settings/setting-row';
import { useThemedAlert } from '@/components/themed-alert';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, db } from '@/lib/firebase-config';
import { doc, getDoc } from 'firebase/firestore';

export default function SettingsModal() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useThemedAlert();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<{ firstName?: string; photoURL?: string | null }>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        // 1. Try to load from cache immediately for a seamless feel
        const cachedName = await AsyncStorage.getItem(`user_name_${auth.currentUser.uid}`);
        const cachedPhoto = await AsyncStorage.getItem(`user_photo_${auth.currentUser.uid}`);
        
        if (cachedName || cachedPhoto) {
          setUserProfile(prev => ({ 
            ...prev, 
            firstName: cachedName || prev.firstName, 
            photoURL: cachedPhoto || prev.photoURL 
          }));
        }

        // 2. Sync with Firestore to ensure data is up to date
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      }
    };
    fetchProfile();
  }, []);

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    try {
      await signOut(auth);
      // Navigate back to the auth screen
      router.replace('/auth');
    } catch (error) {
      showAlert('Error', 'Failed to sign out. Please try again.', 'error');
    }
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
        contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.largeAvatar, { backgroundColor: theme.tint }]}>
            {userProfile.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.avatarImage} />
            ) : (
              <ThemedText style={[styles.avatarInitial, { color: isDark ? '#000' : '#FFF' }]}>
                {(userProfile.firstName || auth.currentUser?.email || 'A').charAt(0).toUpperCase()}
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.userName}>{userProfile.firstName || 'Runner'}</ThemedText>
          <ThemedText style={{ color: theme.icon, fontSize: 14 }}>{auth.currentUser?.email}</ThemedText>

          <Pressable 
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={() => {/* TODO: Implement Edit Profile */}}>
            <View style={[styles.editButton, { borderColor: isDark ? '#444' : '#DDD' }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: '700' }}>Edit Profile</ThemedText>
            </View>
          </Pressable>
        </View>

        <ThemedText style={styles.groupLabel}>APPEARANCE</ThemedText>
        <View style={[styles.group, { backgroundColor: theme.surface }]}>
          <Pressable 
            onPress={toggleTheme}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <View style={styles.rowPressable}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#24292E' : '#F1F5F9' }]}>
                <MaterialIcons name={isDark ? 'wb-sunny' : 'nights-stay'} size={22} color={theme.tint} />
              </View>
              <View style={styles.rowTextContainer}>
                <ThemedText style={styles.rowLabel}>Dark Mode</ThemedText>
              </View>
              <View style={{ marginRight: 10 }}>
                <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>{isDark ? 'ON' : 'OFF'}</ThemedText>
              </View>
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

        <Pressable
          onPress={() => setShowSignOutConfirm(true)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <View
            style={[
              styles.logoutButton,
              {
                backgroundColor: theme.surface,
                borderColor: isDark ? 'rgba(255,59,48,0.3)' : 'rgba(255,59,48,0.15)',
              },
            ]}>
            <MaterialIcons name="logout" size={20} color="#FF3B30" />
            <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
          </View>
        </Pressable>
      </ScrollView>

      {/* Themed Confirmation Modal Overlay */}
      {showSignOutConfirm && (
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
          <View style={[styles.confirmCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.warningIconCircle, { backgroundColor: isDark ? 'rgba(255,59,48,0.15)' : '#FFEBEA' }]}>
              <MaterialIcons name="logout" size={32} color="#FF3B30" />
            </View>
            <ThemedText style={styles.confirmTitle}>Sign Out?</ThemedText>
            <ThemedText style={[styles.confirmSubtitle, { color: theme.icon }]}>
              Are you sure you want to sign out of PaceForge?
            </ThemedText>
            <View style={styles.confirmActions}>
              <Pressable 
                onPress={() => setShowSignOutConfirm(false)} 
                style={[styles.confirmBtn, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}
              >
                <ThemedText style={styles.confirmBtnText}>CANCEL</ThemedText>
              </Pressable>
              <Pressable 
                onPress={handleSignOut} 
                style={[styles.confirmBtn, { backgroundColor: '#FF3B30' }]}
              >
                <ThemedText style={[styles.confirmBtnText, { color: '#FFF' }]}>SIGN OUT</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <AlertComponent />
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    marginTop: 10,
    borderWidth: 1,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalOverlay: { 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 1000, 
    ...StyleSheet.absoluteFillObject 
  },
  confirmCard: { 
    width: '85%', 
    borderRadius: 32, 
    padding: 32, 
    alignItems: 'center', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 20 
  },
  warningIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  confirmSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 10 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmBtn: { flex: 1, height: 56, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
