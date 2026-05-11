export type UnitSystem = 'metric' | 'imperial';

export function formatDistanceDisplay(meters: number, system: UnitSystem): string {
  if (system === 'metric') {
    if (meters < 1000) return `${Math.max(0, Math.round(meters))}`;
    return (meters / 1000).toFixed(2);
  } else {
    // Imperial: Feet if under 0.1 miles, else Miles
    const miles = meters / 1609.34;
    if (miles < 0.1) return `${Math.max(0, Math.round(meters * 3.28084))}`;
    return miles.toFixed(2);
  }
}

export function formatDistanceUnit(meters: number, system: UnitSystem): string {
  if (system === 'metric') {
    return meters < 1000 ? 'm' : 'km';
  } else {
    const miles = meters / 1609.34;
    return miles < 0.1 ? 'ft' : 'mi';
  }
}

export function formatDurationClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatPace(distanceMeters: number, elapsedSeconds: number, system: UnitSystem): string {
  if (distanceMeters < 25 || elapsedSeconds < 1) return '—';
  
  const distance = system === 'metric' ? distanceMeters / 1000 : distanceMeters / 1609.34;
  const pacePerUnit = (elapsedSeconds / 60) / distance;
  
  if (!Number.isFinite(pacePerUnit) || pacePerUnit > 99) return '—';
  
  const mins = Math.floor(pacePerUnit);
  const secs = Math.min(59, Math.round((pacePerUnit - mins) * 60));
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatSpeed(speedMps: number | null | undefined, system: UnitSystem): string {
  if (speedMps == null || speedMps < 0.12) return '0.0';
  const multiplier = system === 'metric' ? 3.6 : 2.23694;
  return (speedMps * multiplier).toFixed(1);
}