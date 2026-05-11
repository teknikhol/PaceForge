import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useActiveRunTracking } from '@/hooks/use-active-run-tracking';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDistanceDisplay, formatDistanceUnit, formatDurationClock, formatPace, formatSpeed, type UnitSystem } from '@/lib/run-formatting';
import { RunStorage } from '@/lib/run-storage';

export default function ActiveRunScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const mapRef = useRef<MapView | null>(null);
  const [followUser, setFollowUser] = useState(true);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [count, setCount] = useState(3);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const {
    phase, currentCoord, route, distanceMeters, elapsedActiveSeconds, speedMps,
    startCountdown, beginTracking, pauseRun, resumeRun, stopWatch,
  } = useActiveRunTracking();

  // Unified Themed Stop Handler
  const handleRequestStop = () => {
    pauseRun(); 
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowStopConfirm(true);
  };

  const confirmEndRun = () => {
    setShowStopConfirm(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stopWatch();
    
    // Debug logging before saving
    console.log('ActiveRun - Saving route with', route.length, 'coordinates');
    console.log('ActiveRun - Distance:', distanceMeters, 'Time:', elapsedActiveSeconds);
    
    // Save route to storage and navigate with only distance/time as params
    RunStorage.setLastRunRoute(route);
    router.push({
      pathname: '/run-summary',
      params: {
        distanceMeters: distanceMeters.toString(),
        elapsedActiveSeconds: elapsedActiveSeconds.toString(),
      },
    });
  };

  const cancelEndRun = () => {
    setShowStopConfirm(false);
    resumeRun();
  };

  const toggleUnits = () => {
    setUnitSystem(s => s === 'metric' ? 'imperial' : 'metric');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Auto-start countdown when GPS ready
  useEffect(() => {
    if (phase === 'ready') startCountdown();
  }, [phase]);

  // Stable Countdown Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'counting') {
      if (count > 0) {
        timer = setTimeout(() => {
          setCount(prev => prev - 1);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 1000);
      } else {
        beginTracking();
      }
    } else {
      setCount(3);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [phase, count, beginTracking]);

  const paceStr = useMemo(() => 
    formatPace(distanceMeters, elapsedActiveSeconds, unitSystem), 
    [distanceMeters, elapsedActiveSeconds, unitSystem]
  );

  useEffect(() => {
    if (!currentCoord || !followUser) return;
    mapRef.current?.animateToRegion({
      latitude: currentCoord.latitude - 0.0012,
      longitude: currentCoord.longitude,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    }, 1000);
  }, [currentCoord, followUser]);

  if (phase === 'loading') {
    return (
      <View style={[styles.root, styles.centeredContent]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <ThemedText style={styles.loadingText}>SYNCING GPS...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        onPanDrag={() => setFollowUser(false)}
      >
        {route.length > 1 && <Polyline coordinates={route} strokeColor={theme.tint} strokeWidth={6} />}
      </MapView>

      {/* HEADER */}
      <LinearGradient 
        colors={[isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)', 'transparent']} 
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={handleRequestStop} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable>
          <View style={[styles.statusPill, { backgroundColor: phase === 'paused' ? '#FF9500' : theme.tint }]}>
            <ThemedText style={styles.statusText}>
              {phase === 'active' ? 'RECORDING' : 'GET READY'}
            </ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* COUNTDOWN OVERLAY */}
      {phase === 'counting' && (
        <View style={[StyleSheet.absoluteFill, styles.countdownOverlay]}>
          <ThemedText style={styles.countdownText}>{count > 0 ? count : 'GO!'}</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.cancelLink}>
            <ThemedText style={styles.cancelText}>CANCEL</ThemedText>
          </Pressable>
        </View>
      )}

      {/* STATS DASHBOARD */}
      {(phase === 'active' || phase === 'paused') && (
        <View style={[styles.dashboardContainer, { paddingBottom: insets.bottom + 20 }]}>
          <LinearGradient 
            colors={isDark ? ['#1A1A1A', '#000'] : ['#FFF', '#F9F9F9']} 
            style={styles.dashboardCard}
          >
            <View style={styles.primaryMetric}>
              {/* Tactile Unit Switcher */}
              <Pressable onPress={toggleUnits} style={styles.unitToggleContainer}>
                <View style={[styles.unitPill, unitSystem === 'metric' && { backgroundColor: theme.tint }]}>
                  <ThemedText style={[styles.unitPillText, unitSystem === 'metric' && styles.unitPillTextActive]}>KM</ThemedText>
                </View>
                <View style={[styles.unitPill, unitSystem === 'imperial' && { backgroundColor: theme.tint }]}>
                  <ThemedText style={[styles.unitPillText, unitSystem === 'imperial' && styles.unitPillTextActive]}>MI</ThemedText>
                </View>
              </Pressable>

              <View style={styles.valueRow}>
                <ThemedText style={[styles.heroValue, { color: theme.tint }]}>
                  {formatDistanceDisplay(distanceMeters, unitSystem)}
                </ThemedText>
                <ThemedText style={styles.heroUnit}>
                  {formatDistanceUnit(distanceMeters, unitSystem)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.secondaryMetricsGrid}>
              <View style={styles.subMetric}>
                <ThemedText style={styles.label}>TIME</ThemedText>
                <ThemedText style={styles.subValue}>{formatDurationClock(elapsedActiveSeconds)}</ThemedText>
              </View>
              <View style={styles.subMetric}>
                <ThemedText style={styles.label}>PACE</ThemedText>
                <ThemedText style={styles.subValue}>{paceStr}</ThemedText>
              </View>
              <View style={styles.subMetric}>
                <ThemedText style={styles.label}>{unitSystem === 'metric' ? 'KM/H' : 'MPH'}</ThemedText>
                <ThemedText style={styles.subValue}>{formatSpeed(speedMps, unitSystem)}</ThemedText>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => setFollowUser(true)}
                style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
              >
                <MaterialIcons name="my-location" size={24} color={theme.tint} />
              </Pressable>
              
              <Pressable 
                onPress={() => { 
                  phase === 'active' ? pauseRun() : resumeRun(); 
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                }} 
                style={({ pressed }) => [
                  styles.mainFab,
                  { backgroundColor: phase === 'paused' ? theme.tint : '#FF3B30' },
                  pressed && styles.mainFabPressed,
                ]}
              >
                <MaterialIcons name={phase === 'paused' ? 'play-arrow' : 'pause'} size={40} color="white" />
              </Pressable>
              
              <Pressable 
                onPress={handleRequestStop}
                style={({ pressed }) => [styles.secondaryAction, pressed && styles.stopActionPressed]}
              >
                <MaterialIcons name="stop" size={24} color="#FF3B30" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* THEMED CONFIRMATION MODAL */}
      {showStopConfirm && (
        <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
          <View style={[styles.confirmCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.warningIconCircle, { backgroundColor: isDark ? 'rgba(255,59,48,0.15)' : '#FFEBEA' }]}>
              <MaterialIcons name="warning" size={32} color="#FF3B30" />
            </View>
            <ThemedText style={styles.confirmTitle}>End current run?</ThemedText>
            <ThemedText style={[styles.confirmSubtitle, { color: theme.icon }]}>
              Your progress will be saved to your activity history.
            </ThemedText>
            <View style={styles.confirmActions}>
              <Pressable onPress={cancelEndRun} style={[styles.confirmBtn, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                <ThemedText style={styles.confirmBtnText}>RESUME</ThemedText>
              </Pressable>
              <Pressable onPress={confirmEndRun} style={[styles.confirmBtn, { backgroundColor: '#FF3B30' }]}>
                <ThemedText style={[styles.confirmBtnText, { color: '#FFF' }]}>END RUN</ThemedText>
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
  centeredContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontWeight: '800', opacity: 0.6 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(150,150,150,0.2)', justifyContent: 'center', alignItems: 'center' },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  countdownOverlay: { zIndex: 200, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', ...StyleSheet.absoluteFillObject },
  countdownText: { fontSize: 220, fontWeight: '900', color: '#FFF', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 240, height: 250, textAlign: 'center' },
  cancelLink: { marginTop: 20, padding: 15 },
  cancelText: { color: '#FFF', fontWeight: '700', opacity: 0.6 },
  dashboardContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 150 },
  dashboardCard: { marginHorizontal: 16, borderRadius: 32, padding: 24, elevation: 10 },
  primaryMetric: { alignItems: 'center', paddingTop: 10 },
  unitToggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(150,150,150,0.15)', padding: 3, borderRadius: 12, marginBottom: 8, width: 100 },
  unitPill: { flex: 1, paddingVertical: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  unitPillText: { fontSize: 10, fontWeight: '800', color: '#888' },
  unitPillTextActive: { color: '#FFF' },
  label: { fontSize: 10, fontWeight: '800', color: '#888', letterSpacing: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginVertical: 5, minHeight: 90 },
  heroValue: { fontSize: 80, fontWeight: '900', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 90 },
  heroUnit: { fontSize: 22, fontWeight: '700', marginLeft: 6, color: '#888', marginBottom: 12 },
  secondaryMetricsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  subMetric: { alignItems: 'center' },
  subValue: { fontSize: 20, fontWeight: '800' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  mainFab: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  mainFabPressed: { transform: [{ scale: 0.95 }], opacity: 0.92 },
  secondaryAction: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center' },
  secondaryActionPressed: { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(150,150,150,0.2)' },
  stopActionPressed: { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(255,59,48,0.2)' },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 },
  confirmCard: { width: '100%', borderRadius: 32, padding: 32, alignItems: 'center', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  warningIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  confirmSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 10 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  confirmBtn: { flex: 1, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});