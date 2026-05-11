import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DeleteModal from '@/components/DeleteModal';
import HistoryRunItem from '@/components/HistoryRunItem';
import MapStyleToggle from '@/components/MapStyleToggle';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HistoryStorage, type RunData } from '@/lib/history-storage';
import { type UnitSystem } from '@/lib/run-formatting';

type MapStyle = 'standard' | 'satellite' | 'hybrid';

export default function HistoryScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [runs, setRuns] = useState<RunData[]>([]);
  const [unitSystem] = useState<UnitSystem>('metric');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [runToDelete, setRunToDelete] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');

  // Generate the style object ONCE based on the theme
  const themedStyles = useMemo(() => styles(theme), [theme]);

  const loadRuns = useCallback(async () => {
    try {
      const historyRuns = await HistoryStorage.getAllRuns();
      setRuns(historyRuns || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRuns();
    }, [loadRuns])
  );

  const handleDeleteRun = useCallback((runId: string) => {
    setRunToDelete(runId);
    setShowDeleteModal(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const confirmDeleteRun = useCallback(async () => {
    if (runToDelete) {
      await HistoryStorage.deleteRun(runToDelete);
      setRuns(prev => prev.filter(run => run.id !== runToDelete));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowDeleteModal(false);
    setRunToDelete(null);
  }, [runToDelete]);

  const cancelDeleteRun = useCallback(() => {
    setShowDeleteModal(false);
    setRunToDelete(null);
  }, []);

  const renderRunItem = useCallback(({ item }: { item: RunData }) => (
    <HistoryRunItem
      item={item}
      unitSystem={unitSystem}
      mapStyle={mapStyle}
      styles={themedStyles} // Passing Object
      handleDeleteRun={handleDeleteRun}
    />
  ), [unitSystem, mapStyle, themedStyles, handleDeleteRun]);

  return (
    <View style={[themedStyles.container, { paddingTop: insets.top }]}>
      <View style={themedStyles.header}>
        <ThemedText style={themedStyles.headerTitle}>HISTORY</ThemedText>
      </View>
      
      <MapStyleToggle 
        mapStyle={mapStyle}
        setMapStyle={setMapStyle}
        styles={themedStyles} // Passing Object
      />
      
      <FlatList
        data={runs}
        renderItem={renderRunItem}
        keyExtractor={(item) => item.id}
        style={themedStyles.list}
        contentContainerStyle={themedStyles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <DeleteModal
        show={showDeleteModal}
        onCancel={cancelDeleteRun}
        onConfirm={confirmDeleteRun}
        styles={themedStyles} // Passing Object
      />
    </View>
  );
}

// Keep the styles generator at the bottom
const styles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingVertical: 8 },
  // ... all other styles remain the same as previous block
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContainer: { 
    backgroundColor: '#1A1A1A', 
    borderRadius: 24, 
    padding: 24, 
    width: '85%', // Slightly wider
    maxWidth: 400,
    alignSelf: 'center',
    overflow: 'visible', // Ensure buttons aren't clipped
  },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  modalMessage: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24 },
  // Inside your styles constant in HistoryScreen.tsx
  modalActions: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 20, // Increased spacing
    width: '100%',
    height: 50, // Explicit height for the row
  },
  modalButton: { 
    flex: 1, 
    height: 50, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10, // Ensure they are on top
  },
  cancelButton: { backgroundColor: '#333' },
  cancelButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFF' 
  },
  deleteConfirmButton: { backgroundColor: '#FF3B30' },
  deleteConfirmButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFF' 
  },
  mapStyleToggle: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  mapStyleButton: { padding: 8, borderRadius: 8 },
  mapStyleButtonActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  runCard: {
  height: 180, // MUST HAVE HEIGHT
  marginBottom: 16,
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: '#1A1A1A', // Fallback color
},
topRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
dateText: {
  fontSize: 14,
  fontWeight: '700',
  color: 'rgba(255,255,255,0.7)',
  letterSpacing: 1,
},
statsGrid: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flex: 1,
},
statColumn: {
  flex: 1,
  alignItems: 'center',
  paddingHorizontal: 4,
},
statDivider: {
  borderLeftWidth: 1,
  borderLeftColor: 'rgba(255,255,255,0.1)',
},
statLabel: {
  fontSize: 10,
  fontWeight: '800',
  color: '#FFF',
  letterSpacing: 1,
  marginBottom: 4,
},
statValue: {
  fontSize: 18,
  fontWeight: '900',
  color: '#FFF',
  textAlign: 'center',
},
distanceRow: {
  flexDirection: 'row',
  alignItems: 'baseline',
  justifyContent: 'center',
},
statUnit: {
  fontSize: 12,
  fontWeight: '600',
  color: 'rgba(255,255,255,0.8)',
  marginLeft: 4,
},
deleteButton: {
  padding: 8,
  borderRadius: 12,
  alignItems: 'center',
},
});