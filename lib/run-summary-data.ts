/**
 * Mock data types and generator for the Post-Run Summary screen.
 */

export interface RunSummaryData {
  id: string;
  date: string;
  distance: number; // km
  duration: number; // minutes
  pace: string; // "6:09" format
  calories: number; // kcal
  routeCoordinates: [number, number][]; // [lat, lng] pairs for map
  elevationGain: number; // meters
}

/**
 * Generate realistic mock run summary data.
 */
export function generateMockRunSummary(): RunSummaryData {
  // Base coordinates around a park-like area (e.g., Griffith Park, LA)
  const baseLat = 34.1367;
  const baseLng = -118.2838;

  // Generate a loop route around the park
  const routeCoordinates: [number, number][] = [];
  const numPoints = 60;
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Create an oval/loop shape
    const latOffset = Math.sin(angle) * 0.015;
    const lngOffset = Math.cos(angle) * 0.012;
    routeCoordinates.push([baseLat + latOffset, baseLng + lngOffset]);
  }

  return {
    id: `run-${Date.now()}`,
    date: new Date().toISOString(),
    distance: 5.2,
    duration: 32,
    pace: '6:09',
    calories: 312,
    routeCoordinates,
    elevationGain: 45,
  };
}
