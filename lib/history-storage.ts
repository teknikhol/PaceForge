import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RunData {
  id: string;
  uid?: string; // For future Firebase sync
  timestamp: number;
  distanceMeters: number;
  elapsedActiveSeconds: number;
  routeCoordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  unitSystem: 'metric' | 'imperial';
}

const STORAGE_KEY = '@paceforge_run_history';

export class HistoryStorageManager {
  async saveRun(runData: Omit<RunData, 'id'>): Promise<void> {
    try {
      const existingRuns = await this.getAllRuns();
      const newRun: RunData = {
        ...runData,
        id: Date.now().toString(), // Simple timestamp-based ID
        timestamp: Date.now(),
      };
      
      const updatedRuns = [...existingRuns, newRun];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRuns));
    } catch (error) {
      console.error('Error saving run to history:', error);
      throw error;
    }
  }

  async getAllRuns(): Promise<RunData[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      // Add JSON safety check
      if (typeof data !== 'string') return [];
      
      const runs = data ? JSON.parse(data) : [];
      return runs.sort((a: RunData, b: RunData) => b.timestamp - a.timestamp); // Newest first
    } catch (error) {
      console.error('Error loading run history:', error);
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing run history:', error);
      throw error;
    }
  }

  async deleteRun(runId: string): Promise<void> {
    try {
      const existingRuns = await this.getAllRuns();
      const updatedRuns = existingRuns.filter(run => run.id !== runId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRuns));
      console.log('Run deleted from history:', runId);
    } catch (error) {
      console.error('Error deleting run from history:', error);
      throw error;
    }
  }
}

export const HistoryStorage = new HistoryStorageManager();
