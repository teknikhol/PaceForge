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
import { MapStyleStorage, type MapStyle } from '@/lib/map-styles';
import { formatDistanceDisplay, formatDistanceUnit, formatDurationClock, formatPace, formatSpeed, type UnitSystem } from '@/lib/run-formatting';
import { RunStorage } from '@/lib/run-storage';

const getMapType = (style: MapStyle): 'standard' | 'satellite' | 'hybrid' => {
  switch (style) {
    case 'standard': return 'standard';
    case 'satellite': return 'satellite';
    case 'hybrid': return 'hybrid';
    default: return 'standard';
  }
};

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
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');

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
      latitude: currentCoord.latitude,
      longitude: currentCoord.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 1000);
  }, [currentCoord, followUser]);

  // Load and persist map style preference
  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        const savedStyle = await MapStyleStorage.loadMapStyle();
        if (savedStyle) {
          setMapStyle(savedStyle);
        }
      } catch (error) {
      }
    };

    loadMapStyle();
  }, []);

  useEffect(() => {
    const saveMapStyle = async () => {
      try {
        await MapStyleStorage.saveMapStyle(mapStyle);
      } catch (error) {
      }
    };

    saveMapStyle();
  }, [mapStyle]);

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
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={getMapType(mapStyle)}
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
          <View style={styles.headerLeft}>
            <Pressable onPress={handleRequestStop}>
              {({ pressed }) => (
                <View style={[styles.closeBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}>
                  <MaterialIcons name="close" size={24} color={theme.text} />
                </View>
              )}
            </Pressable>
            <View style={[styles.statusContainer, { backgroundColor: 'transparent' }]}>
              <View style={[styles.statusDot, phase === 'active' && styles.statusDotActive]} />
              <ThemedText style={styles.statusText}>
                {phase === 'active' ? 'RECORDING' : 'GET READY'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => setMapStyle('standard')}>
              {({ pressed }) => (
                <View style={[
                  styles.mapStyleButton,
                  mapStyle === 'standard' && styles.mapStyleButtonActive,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                ]}>
                  <MaterialIcons name="map" size={16} color={mapStyle === 'standard' ? theme.tint : 'rgba(255,255,255,0.6)'} />
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setMapStyle('satellite')}>
              {({ pressed }) => (
                <View style={[
                  styles.mapStyleButton,
                  mapStyle === 'satellite' && styles.mapStyleButtonActive,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                ]}>
                  <MaterialIcons name="satellite" size={16} color={mapStyle === 'satellite' ? theme.tint : 'rgba(255,255,255,0.6)'} />
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setMapStyle('hybrid')}>
              {({ pressed }) => (
                <View style={[
                  styles.mapStyleButton,
                  mapStyle === 'hybrid' && styles.mapStyleButtonActive,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                ]}>
                  <MaterialIcons name="layers" size={16} color={mapStyle === 'hybrid' ? theme.tint : 'rgba(255,255,255,0.6)'} />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* COUNTDOWN OVERLAY */}
      {phase === 'counting' && (
        <View style={[StyleSheet.absoluteFill, styles.countdownOverlay]}>
          <ThemedText style={styles.countdownText}>{count > 0 ? count : 'GO!'}</ThemedText>
          <Pressable onPress={() => router.back()}>
            {({ pressed }) => (
              <View style={[styles.cancelLink, pressed && { opacity: 0.7 }]}>
                <ThemedText style={styles.cancelText}>CANCEL</ThemedText>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* STATS DASHBOARD */}
      {(phase === 'active' || phase === 'paused') && (
        <View style={[styles.dashboardContainer, { paddingBottom: insets.bottom}]}>
          <LinearGradient 
            colors={isDark ? ['#1A1A1A', '#000'] : ['#FFF', '#F9F9F9']} 
            style={styles.dashboardCard}
          >
            {/* HERO DISTANCE METRIC */}
            <View style={styles.primaryMetric}>
              <ThemedText style={[styles.heroLabel, { color: 'rgba(255,255,255,0.6)' }]}>DISTANCE</ThemedText>
              <View style={styles.distanceRow}>
                <ThemedText style={[styles.heroDistance, { color: theme.tint }]}>
                  {formatDistanceDisplay(distanceMeters, unitSystem)}
                </ThemedText>
                <ThemedText style={[styles.heroUnit, { color: theme.tint }]}>
                  {formatDistanceUnit(distanceMeters, unitSystem)}
                </ThemedText>
              </View>
            </View>

            {/* SECONDARY METRICS GRID */}
            <View style={styles.secondaryMetricsGrid}>
              <View style={[styles.subMetric, styles.timeMetric]}>
                <ThemedText style={styles.label}>TIME</ThemedText>
                <ThemedText style={styles.subValue}>{formatDurationClock(elapsedActiveSeconds)}</ThemedText>
              </View>
              <View style={[styles.subMetric, styles.paceMetric]}>
                <ThemedText style={styles.label}>PACE</ThemedText>
                <ThemedText style={styles.subValue}>{paceStr}</ThemedText>
              </View>
              <View style={[styles.subMetric, styles.speedMetric]}>
                <ThemedText style={styles.label}>{unitSystem === 'metric' ? 'KM/H' : 'MPH'}</ThemedText>
                <ThemedText style={styles.subValue}>{formatSpeed(speedMps, unitSystem)}</ThemedText>
              </View>
            </View>
            <View style={[styles.unitToggleContainer, { position: 'absolute', top: 8, right: 16 }]}>
              <Pressable onPress={toggleUnits}>
                {({ pressed }) => (
                  <View style={[
                    styles.unitPill,
                    { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }
                  ]}>
                    <ThemedText style={styles.unitPillText}>
                      {unitSystem.toUpperCase()}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
            <View style={styles.actionRow}>
              <Pressable onPress={() => setFollowUser(true)}>
                {({ pressed }) => (
                  <View style={[
                    styles.secondaryAction,
                    pressed && styles.secondaryActionPressed
                  ]}>
                    <MaterialIcons name="my-location" size={35} color={theme.tint} />
                  </View>
                )}
              </Pressable>
              
              <Pressable onPress={() => phase === 'active' ? pauseRun() : resumeRun()}>
                {({ pressed }) => (
                  <View style={[
                    styles.mainFab,
                    phase === 'paused' ? styles.mainFabActive : styles.mainFabPaused,
                    pressed && styles.mainFabPressed,
                  ]}>
                    <MaterialIcons name={phase === 'paused' ? 'play-arrow' : 'pause'} size={60} color="white" />
                  </View>
                )}
              </Pressable>
              
              <Pressable onPress={handleRequestStop}>
                {({ pressed }) => (
                  <View style={[
                    styles.secondaryAction,
                    pressed && styles.stopActionPressed
                  ]}>
                    <MaterialIcons name="stop" size={35} color="#FF3B30" />
                  </View>
                )}
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
  map: { height: '60%' },
  centeredContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontWeight: '800', opacity: 0.6 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(150,150,150,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#76FF03', marginRight: 8 },
  statusDotActive: {
    backgroundColor: '#76FF03',
    shadowColor: '#76FF03',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownOverlay: { zIndex: 200, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', ...StyleSheet.absoluteFillObject },
  countdownText: { fontSize: 220, fontWeight: '900', color: '#76FF03', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 240, height: 250, textAlign: 'center' },
  cancelLink: { marginTop: 20, padding: 15 },
  cancelText: { color: '#FFF', fontWeight: '700', opacity: 0.6 },
  dashboardContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 150 },
  dashboardCard: { marginHorizontal: 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: 'rgba(10,10,10,0.98)', padding: 32, elevation: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 16 },
  primaryMetric: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  heroLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', minHeight: 120 },
  heroDistance: { fontSize: 120, fontWeight: '900', includeFontPadding: false, textAlignVertical: 'center', lineHeight: 130 },
  heroUnit: { fontSize: 18, fontWeight: '700', marginLeft: 8, marginBottom: 4 },
  secondaryMetricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 16, paddingHorizontal: 24, position: 'relative' },
  subMetric: { alignItems: 'center', flex: 1 },
  timeMetric: { alignItems: 'flex-start' },
  paceMetric: { alignItems: 'center' },
  speedMetric: { alignItems: 'flex-end' },
  label: { fontSize: 10, fontWeight: '800', color: '#666', letterSpacing: 1, marginBottom: 4 },
  subValue: { fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  mainFab: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  mainFabPressed: { transform: [{ scale: 0.95 }], opacity: 0.92 },
  mainFabActive: { backgroundColor: '#76FF03' },
  mainFabPaused: { backgroundColor: '#FF3B30', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  secondaryAction: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center' },
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
  mapStyleToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  unitPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  unitPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.8,
  },
  mapStyleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapStyleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
