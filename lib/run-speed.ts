// lib/run-speed.ts
import type { LatLng } from '@/lib/geo';
import { haversineMeters } from '@/lib/geo';

const MAX_REASONABLE_MPS = 10; // ~36 km/h, plenty for running
const INSTANT_WINDOW_MAX = 8; // Slightly larger for better smoothing

export type SpeedSampleState = {
  last: { pt: LatLng; tMs: number } | null;
  emaMps: number | null;
  instantWindow: number[];
  isMoving: boolean;
};

export const emptySpeedSampleState = (): SpeedSampleState => ({
  last: null,
  emaMps: null,
  instantWindow: [],
  isMoving: false,
});

export function updateSpeedFromGpsFix(
  state: SpeedSampleState,
  pt: LatLng,
  timestampMs: number,
  accuracyM: number | null,
  nativeSpeedMps: number | null, // Added native speed
  recentSteps: number // Added steps for fusion
): { state: SpeedSampleState; displayMps: number | null } {
  const prev = state.last;
  if (!prev) {
    return {
      state: { ...state, last: { pt, tMs: timestampMs } },
      displayMps: null,
    };
  }

  const dtS = (timestampMs - prev.tMs) / 1000;
  const distM = haversineMeters(prev.pt, pt);

  // 1. SENSOR FUSION: Validate movement via Pedometer
  // If we haven't taken steps but GPS moved > 3m, it's likely drift
  const hasStepActivity = recentSteps > 0;
  
  // 2. DETERMINING INSTANT SPEED
  let instant: number;
  if (nativeSpeedMps !== null && nativeSpeedMps >= 0) {
    // Native speed is calculated via Doppler shift; much more stable
    instant = nativeSpeedMps;
  } else {
    // Fallback to haversine if native is unavailable
    instant = dtS > 0 ? distM / dtS : 0;
  }

  // 3. DRIFT REJECTION
  // If speed is low or accuracy is bad, and no steps are detected: zero it out.
  if (!hasStepActivity && (instant < 0.8 || (accuracyM ?? 0) > 15)) {
    instant = 0;
  }

  if (instant > MAX_REASONABLE_MPS) instant = MAX_REASONABLE_MPS;

  // 4. WINDOWED MEDIAN (Removes Spikes)
  let window = [...state.instantWindow, instant].slice(-INSTANT_WINDOW_MAX);
  const sorted = [...window].sort((a, b) => a - b);
  const core = sorted[Math.floor(sorted.length / 2)];

  // 5. DYNAMIC EMA (Alpha based on certainty)
  // Trust the GPS more if accuracy is under 5 meters
  const alpha = (accuracyM ?? 30) < 6 ? 0.7 : 0.4;
  let ema = state.emaMps === null ? core : alpha * core + (1 - alpha) * state.emaMps;

  // Final floor for UI cleanliness
  if (ema < 0.2) ema = 0;

  return {
    state: {
      last: { pt, tMs: timestampMs },
      emaMps: ema,
      instantWindow: window,
      isMoving: ema > 0.3,
    },
    displayMps: ema,
  };
}