import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDistanceDisplay, formatDistanceUnit, formatDurationClock, formatPace, type UnitSystem } from '@/lib/run-formatting';
import { RunStorage } from '@/lib/run-storage';

interface RunSummaryParams {
  distanceMeters?: string;
  elapsedActiveSeconds?: string;
}

export default function RunSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const mapRef = useRef<MapView | null>(null);
  
  const params = useLocalSearchParams() as RunSummaryParams;
  
  // Parse the passed data from params
  const runData = useMemo(() => {
    const distanceMeters = parseFloat(params.distanceMeters || '0');
    const elapsedActiveSeconds = parseFloat(params.elapsedActiveSeconds || '0');
    const routeCoordinates = RunStorage.getLastRunRoute();
    
    // Filter out 0,0 coordinates
    const validCoords = routeCoordinates.filter(c => c.latitude !== 0 && c.longitude !== 0);
    
    // Debug logging
    console.log('Summary Route Data:', validCoords.length);
    console.log('Raw Route Data:', routeCoordinates.length);
    console.log('Distance:', distanceMeters, 'Time:', elapsedActiveSeconds);
    
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
      console.log('Using first coordinate for initial region:', firstCoord);
      return {
        latitude: firstCoord.latitude,
        longitude: firstCoord.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Return null to let MapView handle its own initial state
    console.log('No valid coordinates for initial region');
    return null;
  }, [runData.routeCoordinates]);
  
  const [unitSystem] = useState<UnitSystem>('metric');
  
  // Use useEffect to fit map to coordinates when ready
  useEffect(() => {
    if (runData.routeCoordinates.length > 1) {
      console.log('Fitting map to', runData.routeCoordinates.length, 'coordinates');
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(runData.routeCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 1000); // Increased to 1s for slower devices
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
  
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* HEADER WITH CLOSE ICON */}
      <View style={styles.headerContainer}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>RUN COMPLETE</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      
      {/* MAP SNAPSHOT */}
      <View style={styles.mapSnapshotContainer}>
        <MapView
          ref={mapRef}
          style={styles.mapSnapshot}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion || undefined}
          showsUserLocation={false}
          showsMyLocationButton={false}
          zoomEnabled={false}
          scrollEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {runData.routeCoordinates.length > 1 && (
            <Polyline 
              coordinates={runData.routeCoordinates} 
              strokeColor={theme.tint} 
              strokeWidth={4} 
            />
          )}
        </MapView>
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
                <ThemedText style={styles.statUnit}>
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
          
          {/* CLOSE BUTTON */}
          <Pressable 
            onPress={handleClose} 
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: theme.tint },
              pressed && styles.closeButtonPressed,
            ]}
          >
            <ThemedText style={styles.closeButtonText}>CLOSE</ThemedText>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#000' 
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
  mapSnapshot: {
    flex: 1,
    borderRadius: 24,
  },
  statsContainer: { 
    flex: 1,
    justifyContent: 'flex-end',
  },
  statsCard: { 
    marginHorizontal: 16, 
    borderRadius: 32, 
    padding: 24, 
    elevation: 10 
  },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 32 
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
});
