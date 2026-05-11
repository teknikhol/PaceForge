import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HistoryStorage, type RunData } from '@/lib/history-storage';
import { formatDistanceDisplay, formatDistanceUnit, formatDurationClock, formatPace } from '@/lib/run-formatting';
import { RunStorage } from '@/lib/run-storage';

interface RunSummaryParams {
  distanceMeters?: string;
  elapsedActiveSeconds?: string;
}

export default function RunSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isSaved, setIsSaved] = React.useState(false);
  const [unitSystem, setUnitSystem] = React.useState<UnitSystem>('metric');
  const mapRef = useRef<MapView | null>(null);

  // Parse passed data from params
  const runData = useMemo(() => {
    const distanceMeters = parseFloat(params.distanceMeters || '0');
    const elapsedActiveSeconds = parseFloat(params.elapsedActiveSeconds || '0');
    const routeCoordinates = RunStorage.getLastRunRoute() || [];
    
    // Filter out 0,0 coordinates
    const validCoords = routeCoordinates.filter(c => c.latitude !== 0 && c.longitude !== 0);
    
    return {
      distanceMeters,
      elapsedActiveSeconds,
      routeCoordinates: validCoords,
    };
  }, [params]);
  
  // Calculate initial region from first valid coordinate
  const initialRegion = useMemo(() => {
    if (runData.routeCoordinates.length > 0) {
      const firstCoord = runData.routeCoordinates[0];
      return {
        latitude: firstCoord.latitude,
        longitude: firstCoord.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Return null to let MapView handle its own initial state
    return null;
  }, [runData.routeCoordinates]);
  
  // Use useEffect to fit map to coordinates when ready
  useEffect(() => {
    if (runData.routeCoordinates.length > 1) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(runData.routeCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [runData.routeCoordinates]);
  
  // Success haptic on mount and cleanup on unmount
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    
    // Cleanup function
    return () => {
      backHandler.remove();
      RunStorage.clearLastRunRoute();
    };
  }, []);

  const paceStr = useMemo(() => 
    formatPace(runData.distanceMeters, runData.elapsedActiveSeconds, unitSystem), 
    [runData.distanceMeters, runData.elapsedActiveSeconds, unitSystem]
  );
  
  const handleClose = () => {
    router.replace('/(tabs)');
  };

  const handleSaveRun = async () => {
    try {
      const runDataToSave: Omit<RunData, 'id'> = {
        distanceMeters: runData.distanceMeters,
        elapsedActiveSeconds: runData.elapsedActiveSeconds,
        routeCoordinates: runData.routeCoordinates,
        unitSystem,
        timestamp: Date.now(),
      };
      
      // Use HistoryStorage instance
      await HistoryStorage.saveRun(runDataToSave);
      
      // Show success feedback
      setIsSaved(true);
      
      // Navigate back to HISTORY tab
      setTimeout(() => {
        router.replace('/(tabs)/history' as any);
      }, 1500);
    } catch (error) {
      console.error('Error saving run:', error);
      Alert.alert('Error', 'Failed to save run. Please try again.');
    }
  };

  const [showDiscardModal, setShowDiscardModal] = React.useState(false);

  const handleDiscardRun = () => {
    setShowDiscardModal(true);
  };

  const confirmDiscardRun = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDiscardModal(false);
    handleClose();
  };

  const cancelDiscardRun = () => {
    setShowDiscardModal(false);
  };

  const DiscardModal = () => (
    <View style={styles.successmodalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1A1A1A' : '#FFF' }]}>
        <View style={styles.modalHeader}>
          <ThemedText style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>Discard Run?</ThemedText>
        </View>
        <ThemedText style={[styles.modalMessage, { color: isDark ? '#CCC' : '#666' }]}>
          Are you sure you want to discard this run? This action cannot be undone.
        </ThemedText>
        <View style={styles.modalActions}>
          <Pressable 
            onPress={cancelDiscardRun}
            style={({ pressed }) => [
              styles.modalButton, 
              styles.cancelButton, 
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
          >
            <ThemedText style={[styles.cancelButtonText, { color: isDark ? '#FFF' : '#000' }]}>Cancel</ThemedText>
          </Pressable>
          <Pressable 
            onPress={confirmDiscardRun}
            style={({ pressed }) => [
              styles.modalButton, 
              styles.discardButton,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
            ]}
          >
            <ThemedText style={styles.discardButtonText}>Discard</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* SUCCESS OVERLAY */}
      {isSaved && (
        <View style={styles.successOverlay}>
          <ThemedText style={[styles.successText, { color: theme.tint }]}>RUN SAVED!</ThemedText>
        </View>
      )}
      
      {/* HEADER WITH CLOSE ICON */}
      <View style={styles.headerContainer}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.text} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>
      
      {/* MAP CONTAINER */}
      <View style={styles.mapContainer}>
        {initialRegion ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onMapReady={() => {
              const timer = setTimeout(() => {
                mapRef.current?.fitToCoordinates(runData.routeCoordinates, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }, 1000);
              return () => clearTimeout(timer);
            }}
          >
            {runData.routeCoordinates.length > 1 && <Polyline coordinates={runData.routeCoordinates} strokeColor={theme.tint} strokeWidth={6} />}
          </MapView>
        ) : (
          <LinearGradient 
            colors={isDark ? ['#1A1A1A', '#000'] : ['#FFF', '#F9F9F9']} 
            style={styles.mapPlaceholder}
          >
            <MaterialIcons name="route" size={80} color={theme.icon} />
            <ThemedText style={styles.mapPlaceholderText}>GPS PATH UNAVAILABLE</ThemedText>
          </LinearGradient>
        )}
      </View>
      
      {/* STATS GRID */}
      <View style={[styles.statsContainer, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient 
          colors={isDark ? ['#1A1A1A', '#000'] : ['#FFF', '#F9F9F9']} 
          style={styles.statsCard}
        >
          {/* BIG 3 STATS GRID */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>DISTANCE</ThemedText>
              <View style={styles.statValueRow}>
                <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                  {formatDistanceDisplay(runData.distanceMeters, unitSystem)}
                </ThemedText>
                <ThemedText style={[styles.statUnit, { color: theme.tint }]}>
                  {formatDistanceUnit(runData.distanceMeters, unitSystem)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>TIME</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                {formatDurationClock(runData.elapsedActiveSeconds)}
              </ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>AVG PACE</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                {paceStr}
              </ThemedText>
            </View>
          </View>
          
          {/* ACTION BUTTONS */}
          <View style={styles.actionButtons}>
            <Pressable 
              onPress={handleSaveRun}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.tint },
                pressed && styles.saveButtonPressed,
              ]}
            >
              <ThemedText style={styles.saveButtonText}>SAVE RUN</ThemedText>
            </Pressable>
            
            <Pressable 
              onPress={handleDiscardRun}
              style={({ pressed }) => [
                styles.discardButton,
                pressed && styles.discardButtonPressed,
              ]}
            >
              <ThemedText style={styles.discardButtonText}>DISCARD RUN</ThemedText>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
      
      {showDiscardModal && <DiscardModal />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  discardButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  closeBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(150,150,150,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  mapSnapshotContainer: {
    marginHorizontal: 16,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 24,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  statLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#888', 
    letterSpacing: 1, 
    marginBottom: 8 
  },
  statValueRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    justifyContent: 'center' 
  },
  statValue: { 
    fontSize: 32, 
    fontWeight: '900', 
    includeFontPadding: false, 
    textAlignVertical: 'center' 
  },
  statUnit: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#888', 
    marginLeft: 4 
  },
  closeButton: { 
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  closeButtonPressed: { 
    transform: [{ scale: 0.98 }], 
    opacity: 0.9 
  },
  closeButtonText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#FFF', 
    letterSpacing: 1 
  },
  saveButton: { 
    flex: 1,
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonPressed: { 
    transform: [{ scale: 0.98 }], 
    opacity: 0.9 
  },
  saveButtonText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#FFF', 
    letterSpacing: 1 
  },
  discardButton: { 
    flex: 1,
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discardButtonText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#FFF', 
    letterSpacing: 1 
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  successmodalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  discardButton: { 
    flex: 1,
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discardButtonText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#FFF', 
    letterSpacing: 1 
  },
});
