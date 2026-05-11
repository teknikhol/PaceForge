import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type MapStyle = 'standard' | 'satellite' | 'hybrid';

interface MapStyleToggleProps {
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
  styles: any; // Now receives a style OBJECT, not a function
}

export default function MapStyleToggle({ mapStyle, setMapStyle, styles }: MapStyleToggleProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    // FIX: Access properties directly from the styles object
    <View style={styles.mapStyleToggle}>
      <Pressable onPress={() => setMapStyle('standard')}>
        {({ pressed }) => (
          <View style={[
            styles.mapStyleButton,
            mapStyle === 'standard' && styles.mapStyleButtonActive,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
          ]}>
            <MaterialIcons 
              name="map" 
              size={16} 
              color={mapStyle === 'standard' ? theme.tint : 'rgba(255,255,255,0.6)'} 
            />
          </View>
        )}
      </Pressable>

      <Pressable onPress={() => setMapStyle('hybrid')}>
        {({ pressed }) => (
          <View style={[
            styles.mapStyleButton,
            mapStyle === 'hybrid' && styles.mapStyleButtonActive,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
          ]}>
            <MaterialIcons 
              name="layers" 
              size={16} 
              color={mapStyle === 'hybrid' ? theme.tint : 'rgba(255,255,255,0.6)'} 
            />
          </View>
        )}
      </Pressable>

      <Pressable onPress={() => setMapStyle('satellite')}>
        {({ pressed }) => (
          <View style={[
            styles.mapStyleButton,
            mapStyle === 'satellite' && styles.mapStyleButtonActive,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
          ]}>
            <MaterialIcons 
              name="satellite" 
              size={16} 
              color={mapStyle === 'satellite' ? theme.tint : 'rgba(255,255,255,0.6)'} 
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}