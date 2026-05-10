export interface RunData {
  id: string;
  date: string;
  distance: number;
  duration: number;
  pace: string;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const dashboardMockUser = { name: 'Alex' };

export const dashboardMockTodayStats = { distance: 5.2, duration: 32, pace: '6:09' };

export const dashboardMockWeekStats = { distance: 28.5, runs: 4, streak: 12 };

export const dashboardMockInsight =
  "You're 8% faster than last week! 🔥 Keep crushing it";

export const dashboardMockRecentRuns: RunData[] = [
  { id: '1', date: 'Today', distance: 5.2, duration: 32, pace: '6:09' },
  { id: '2', date: 'May 8', distance: 7.3, duration: 46, pace: '6:18' },
  { id: '3', date: 'May 7', distance: 8.1, duration: 51, pace: '6:19' },
];

export const dashboardMockTrendData = [
  { value: 20 },
  { value: 35 },
  { value: 45 },
  { value: 55 },
  { value: 40 },
  { value: 65 },
];
