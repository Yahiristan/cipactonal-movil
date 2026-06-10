import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const RejectedScreen = ({ motivoRechazo, onRetry, onCancel }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="close-circle" size={32} color="#ef4444" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>Solicitud Rechazada</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>Tu solicitud no fue aprobada</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Motivo del rechazo</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#ef4444" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Detalles</Text>
                <Text style={[styles.settingValue, { color: '#ef4444', lineHeight: 18 }]}>{motivoRechazo || 'No se especificó un motivo'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Verifica lo siguiente</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="business-outline" size={20} color="#4b5563" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Código de empresa</Text>
                <Text style={styles.settingValue}>Asegúrate de que sea correcto.</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={20} color="#4b5563" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Correo electrónico</Text>
                <Text style={styles.settingValue}>Debe ser tu correo corporativo válido.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Salir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 20,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.5
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  sectionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 24
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingIcon: {
    marginRight: 14
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.2,
    marginBottom: 2
  },
  settingValue: {
    fontSize: 13,
    color: '#9ca3af'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '700'
  },
  retryButton: {
    flex: 2,
    backgroundColor: '#ef4444',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  }
});