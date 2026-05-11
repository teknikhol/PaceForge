import * as Haptics from 'expo-haptics'; // Added this import
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LatLng } from '@/lib/geo';
import { haversineMeters } from '@/lib/geo';
import { emptySpeedSampleState, type SpeedSampleState, updateSpeedFromGpsFix } from '@/lib/run-speed';

export type ActiveRunPhase = 'loading' | 'denied' | 'ready' | 'counting' | 'active' | 'paused';

export function useActiveRunTracking() {
  const [phase, setPhase] = useState<ActiveRunPhase>('loading');
  const [currentCoord, setCurrentCoord] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [elapsedActiveSeconds, setElapsedActiveSeconds] = useState(0);
  const [speedMps, setSpeedMps] = useState<number | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const phaseRef = useRef<ActiveRunPhase>('loading');
  const lastRoutePointRef = useRef<LatLng | null>(null);
  const currentCoordRef = useRef<LatLng | null>(null);
  const speedSampleRef = useRef<SpeedSampleState>(emptySpeedSampleState());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const onLocation = useCallback((loc: Location.LocationObject) => {
    const { latitude, longitude, accuracy, speed } = loc.coords;
    const pt: LatLng = { latitude, longitude };
    
    currentCoordRef.current = pt;
    setCurrentCoord(pt);

    // Filter drift
    const filteredSpeed = (speed && speed > 0.22) ? speed : 0;
    const speedOut = updateSpeedFromGpsFix(speedSampleRef.current, pt, loc.timestamp, accuracy ?? null, filteredSpeed, 0);

    speedSampleRef.current = speedOut.state;
    const finalSpeed = speedOut.displayMps ?? 0;
    setSpeedMps(finalSpeed < 0.3 ? 0 : finalSpeed);

    if (phaseRef.current !== 'active') return;

    const last = lastRoutePointRef.current;
    if (!last) {
      lastRoutePointRef.current = pt;
      return; 
    }

    const d = haversineMeters(last, pt);
    // Ignore jumps/jitter
    if (d > 2 && d < 80 && (accuracy || 100) < 25) {
      setDistanceMeters((prev) => prev + d);
      setRoute((r) => [...r, pt]);
      lastRoutePointRef.current = pt;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPhase('denied'); return; }
      
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentCoord({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
      setPhase('ready');

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
        onLocation
      );
      watchRef.current = sub;
    })();
    return () => { watchRef.current?.remove(); };
  }, [onLocation]);

  useEffect(() => {
    if (phase !== 'active') return;
    const id = setInterval(() => setElapsedActiveSeconds((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startCountdown = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('counting');
  };
  
  const cancelCountdown = () => setPhase('ready');
  
  const beginTracking = useCallback(() => {
    setDistanceMeters(0);
    setElapsedActiveSeconds(0);
    setRoute([]);
    // Anchor the route to current GPS point immediately
    lastRoutePointRef.current = currentCoordRef.current;
    setPhase('active');
  }, []);

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  return {
    phase, 
    currentCoord, 
    route, 
    distanceMeters, 
    elapsedActiveSeconds, 
    speedMps,
    startCountdown, 
    cancelCountdown, 
    beginTracking,
    pauseRun: () => setPhase('paused'), 
    resumeRun: () => setPhase('active'),
    stopWatch
  };
}