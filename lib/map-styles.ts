export type MapStyle = 'standard' | 'satellite' | 'hybrid';

// Map style persistence for user preferences
export interface MapStylePreferences {
  defaultMapStyle: MapStyle;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export const MapStyleStorage = {
  // Save user's preferred map style
  saveMapStyle: async (style: MapStyle): Promise<void> => {
    try {
      await AsyncStorage.setItem('paceforge_mapStyle', style);
    } catch (error) {
      console.error('Failed to save map style:', error);
    }
  },

  // Load user's preferred map style
  loadMapStyle: async (): Promise<MapStyle> => {
    try {
      const saved = await AsyncStorage.getItem('paceforge_mapStyle') as MapStyle;
      return saved || 'standard';
    } catch (error) {
      console.error('Failed to load map style:', error);
      return 'standard';
    }
  },

  // Clear stored map style (useful for testing)
  clearMapStyle: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('paceforge_mapStyle');
    } catch (error) {
      console.error('Failed to clear map style:', error);
    }
  },
};
