import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { ThemedText } from './themed-text';

interface DeleteModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  styles: any;
}

export default function DeleteModal({ show, onCancel, onConfirm, styles }: DeleteModalProps) {
  return (
    <Modal
      transparent
      visible={show}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { minHeight: 200, justifyContent: 'space-between' }]}>
          <View>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>DELETE RUN?</ThemedText>
            </View>
            
            <ThemedText style={styles.modalMessage}>
              This action cannot be undone. Are you sure you want to remove this run?
            </ThemedText>
          </View>

          {/* Explicitly check if modalActions exists in passed styles */}
          <View style={styles.modalActions}>
            <Pressable 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable 
              style={[styles.modalButton, styles.deleteConfirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.deleteConfirmButtonText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}