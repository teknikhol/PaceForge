import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type RunData } from '@/lib/history-storage';
import { formatDistanceDisplay, formatDistanceUnit, formatDurationClock, formatPace, type UnitSystem } from '@/lib/run-formatting';

interface HistoryRunItemProps {
  item: RunData;
  unitSystem: UnitSystem;
  mapStyle: any; // 'standard' | 'satellite' | 'hybrid'
  styles: any; // The themed styles object from parent
  handleDeleteRun: (runId: string) => void;
}

export default function HistoryRunItem({ item, unitSystem, mapStyle, styles, handleDeleteRun }: HistoryRunItemProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric' 
  }).toUpperCase();
  
  const validCoords = item.routeCoordinates.filter(c => c.latitude !== 0 && c.longitude !== 0);
  const hasRouteData = validCoords.length >= 2;
  const paceStr = formatPace(item.distanceMeters, item.elapsedActiveSeconds, unitSystem);

  return (
    <View style={styles.runCard}>
      {/* 1. BACKGROUND LAYER */}
      <View style={StyleSheet.absoluteFill}>
        {hasRouteData ? (
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            liteMode={true}
            initialRegion={calculateInitialRegion(validCoords)}
            mapType={mapStyle}
          >
            <Polyline 
              coordinates={validCoords} 
              strokeColor={theme.tint} 
              strokeWidth={4} 
            />
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#1A1A1A' : '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialIcons name="route" size={32} color={theme.icon} />
          </View>
        )}
      </View>

      {/* 2. GRADIENT OVERLAY (Ensures text is readable) */}
      <LinearGradient 
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.9)']} 
        style={StyleSheet.absoluteFill}
      />

      {/* 3. FOREGROUND CONTENT */}
      <View style={localStyles.contentContainer}>
        {/* Top Row */}
        <View style={styles.topRow}>
          <ThemedText style={styles.dateText}>{dateStr}</ThemedText>
          <Pressable onPress={() => handleDeleteRun(item.id)}>
            <View style={styles.deleteButton}>
              <MaterialIcons name="delete" size={20} color="#FF3B30" />
            </View>
          </Pressable>
        </View>

        {/* Bottom Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statColumn}>
            <ThemedText style={styles.statLabel}>DISTANCE</ThemedText>
            <View style={styles.distanceRow}>
              <ThemedText style={[styles.statValue, { color: theme.tint }]}>
                {formatDistanceDisplay(item.distanceMeters, unitSystem)}
              </ThemedText>
              <ThemedText style={[styles.statUnit, { color: theme.tint }]}>
                {formatDistanceUnit(item.distanceMeters, unitSystem)}
              </ThemedText>
            </View>
          </View>
          
          <View style={[styles.statColumn, styles.statDivider]}>
            <ThemedText style={styles.statLabel}>TIME</ThemedText>
            <ThemedText style={styles.statValue}>{formatDurationClock(item.elapsedActiveSeconds)}</ThemedText>
          </View>
          
          <View style={[styles.statColumn, styles.statDivider]}>
            <ThemedText style={styles.statLabel}>PACE</ThemedText>
            <ThemedText style={styles.statValue}>{paceStr}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between',
  },
});

/**
 * Calculates a region that tightly fits the route coordinates
 */
const calculateInitialRegion = (coords: any[]) => {
  if (!coords.length) return undefined;

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  coords.forEach(c => {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  });

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;

  // Calculate the actual span of the route
  let latDelta = maxLat - minLat;
  let lngDelta = maxLng - minLng;

  // If the route is very small (point or very short distance), use a reasonable default zoom
  if (latDelta < 0.001) latDelta = 0.002;
  if (lngDelta < 0.001) lngDelta = 0.002;

  // Add 30% padding to ensure the route isn't touching the edges
  // This is more generous for the small map view
  latDelta *= 1.3;
  lngDelta *= 1.3;

  // Ensure minimum and maximum bounds for better UX
  const minDelta = 0.001;
  const maxDelta = 0.1;
  
  latDelta = Math.max(minDelta, Math.min(latDelta, maxDelta));
  lngDelta = Math.max(minDelta, Math.min(lngDelta, maxDelta));

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
};