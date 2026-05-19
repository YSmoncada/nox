import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NoxColors } from '../constants/theme';


interface NoxAlertProps {
  visible: boolean;
  type?: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function NoxAlert({ 
  visible, 
  type = 'info', 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'ACEPTAR',
  cancelText = 'CANCELAR'
}: NoxAlertProps) {

  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle-outline', color: NoxColors.emerald, bg: 'rgba(16,185,129,0.1)' };
      case 'error':   return { name: 'close-circle-outline', color: NoxColors.rose, bg: 'rgba(239,68,68,0.1)' };
      case 'warning': return { name: 'warning-outline', color: NoxColors.amber, bg: 'rgba(245,158,11,0.1)' };
      default:        return { name: 'information-circle-outline', color: NoxColors.aura, bg: 'rgba(169,68,255,0.1)' };
    }
  };

  const iconConfig = getIcon();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: `${iconConfig.color}40` }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.name as any} size={44} color={iconConfig.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actions}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: iconConfig.color }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  card: {
    backgroundColor: NoxColors.card,
    width: '100%',
    maxWidth: 340,
    borderRadius: 35,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: NoxColors.deep,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: NoxColors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  message: {
    color: NoxColors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    fontWeight: '500'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NoxColors.border
  },
  cancelText: {
    color: NoxColors.subtext,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  confirmText: {
    color: NoxColors.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
