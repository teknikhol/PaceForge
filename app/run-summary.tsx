import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HistoryStorage, type RunData } from '@/lib/history-storage';
import { formatDistanceDisplay, formatDistanceUnit, formatDurationClock, formatPace, type UnitSystem } from '@/lib/run-formatting';
import { RunStorage } from '@/lib/run-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RunSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const [isSaved, setIsSaved] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const runData = useMemo(() => {
    const distanceMeters = parseFloat(params.distanceMeters || '0');
    const elapsedActiveSeconds = parseFloat(params.elapsedActiveSeconds || '0');
    const routeCoordinates = RunStorage.getLastRunRoute();
    const validCoords = routeCoordinates.filter(c => c.latitude !== 0 && c.longitude !== 0);
    
    return { distanceMeters, elapsedActiveSeconds, routeCoordinates: validCoords };
  }, [params]);

  const [unitSystem] = useState<UnitSystem>('metric');

  // Fit map to route
  useEffect(() => {
    if (runData.routeCoordinates.length > 1) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(runData.routeCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [runData.routeCoordinates]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => {
      backHandler.remove();
      RunStorage.clearLastRunRoute();
    };
  }, []);

  const handleClose = () => router.replace('/(tabs)');

  const handleSaveRun = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const runDataToSave: Omit<RunData, 'id'> = {
        distanceMeters: runData.distanceMeters,
        elapsedActiveSeconds: runData.elapsedActiveSeconds,
        routeCoordinates: RunStorage.getLastRunRoute(),
        unitSystem,
        timestamp: Date.now(),
      };
      await HistoryStorage.saveRun(runDataToSave);
      setIsSaved(true);
      setTimeout(() => router.replace('/(tabs)/history' as any), 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save run.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>RUN COMPLETE</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* MAP SECTION (Fixed Height) */}
      <View style={styles.mapSection}>
        {runData.routeCoordinates.length > 0 ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: runData.routeCoordinates[0].latitude,
              longitude: runData.routeCoordinates[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Polyline coordinates={runData.routeCoordinates} strokeColor={theme.tint} strokeWidth={6} />
          </MapView>
        ) : (
          <View style={[styles.mapPlaceholder, { backgroundColor: isDark ? '#111' : '#EEE' }]}>
            <MaterialIcons name="map" size={48} color={theme.icon} />
            <ThemedText>Map data unavailable</ThemedText>
          </View>
        )}
      </View>

      {/* STATS SECTION */}
      <View style={styles.bottomSection}>
        <LinearGradient 
          colors={isDark ? ['#1A1A1A', '#000'] : ['#FFF', '#F2F2F2']} 
          style={[styles.statsCard, { paddingBottom: insets.bottom + 40 }]}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>DISTANCE</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                {formatDistanceDisplay(runData.distanceMeters, unitSystem)}
                <ThemedText style={styles.statUnit}> {formatDistanceUnit(runData.distanceMeters, unitSystem)}</ThemedText>
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>TIME</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                {formatDurationClock(runData.elapsedActiveSeconds)}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>PACE</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                {formatPace(runData.distanceMeters, runData.elapsedActiveSeconds, unitSystem)}
              </ThemedText>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtons}>
            <Pressable onPress={() => setShowDiscardModal(true)} style={styles.flex1}>
              <View style={[styles.btn, styles.discardBtn]}>
                <ThemedText style={styles.btnText}>DISCARD</ThemedText>
              </View>
            </Pressable>
            
            <Pressable onPress={handleSaveRun} style={styles.flex1}>
              <View style={[styles.btn, { backgroundColor: theme.tint }]}>
                <ThemedText style={styles.btnText}>SAVE RUN</ThemedText>
              </View>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* OVERLAYS */}
      {isSaved && (
        <View style={styles.fullOverlay}>
          <ThemedText style={styles.successText}>RUN SAVED!</ThemedText>
        </View>
      )}

      {showDiscardModal && (
        <View style={styles.fullOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.modalTitle}>Discard Run?</ThemedText>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowDiscardModal(false)} style={styles.flex1}>
                <View style={[styles.btn, { backgroundColor: '#333' }]}><ThemedText style={styles.btnText}>CANCEL</ThemedText></View>
              </Pressable>
              <Pressable onPress={handleClose} style={styles.flex1}>
                <View style={[styles.btn, styles.discardBtn]}><ThemedText style={styles.btnText}>DISCARD</ThemedText></View>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  flex1: { flex: 1 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(150,150,150,0.15)', justifyContent: 'center', alignItems: 'center' },
  
  mapSection: { height: SCREEN_HEIGHT * 0.35, marginHorizontal: 20, borderRadius: 24, overflow: 'hidden' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  bottomSection: { flex: 1, justifyContent: 'flex-end' },
  statsCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 40 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#888', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statUnit: { fontSize: 12, color: '#888' },
  
  actionButtons: { flexDirection: 'row', gap: 12 },
  btn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  discardBtn: { backgroundColor: '#FF3B30' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  
  fullOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 },
  successText: { fontSize: 24, fontWeight: '900', color: '#76FF03' },
  modal: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
});