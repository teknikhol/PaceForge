import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ThemedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'success' | 'info';
}

export function ThemedAlert({ visible, title, message, onClose, type = 'info' }: ThemedAlertProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];

  const getIconName = () => {
    switch (type) {
      case 'error': return 'warning';
      case 'success': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error': return '#FF3B30';
      case 'success': return '#34C759';
      default: return theme.tint;
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.alertContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getIconName()} 
              size={32} 
              color={getIconColor()} 
            />
          </View>
          
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {title}
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: theme.icon }]}>
            {message}
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.tint }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
              OK
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alertContainer: {
    width: width - 80,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.8,
  },
  button: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

// Hook for using the alert
export function useThemedAlert() {
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'error' | 'success' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type?: 'error' | 'success' | 'info') => {
    setAlert({
      visible: true,
      title,
      message,
      type: type || 'info',
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <ThemedAlert
      visible={alert.visible}
      title={alert.title}
      message={alert.message}
      onClose={hideAlert}
      type={alert.type}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
}
