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

export const ApprovedScreen = ({ email, empresaNombre, deviceInfo, onComplete }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>¡Aprobado!</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>Configuración Completada</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Detalles de la vinculación</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="business-outline" size={20} color="#10b981" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Empresa</Text>
                <Text style={styles.settingValue}>{empresaNombre || 'Empresa vinculada'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={20} color="#10b981" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Correo Verificado</Text>
                <Text style={styles.settingValue}>{email}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color="#10b981" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Dispositivo</Text>
                <Text style={styles.settingValue}>{deviceInfo?.model || 'Dispositivo móvil'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Información</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#4b5563" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.settingValue, { lineHeight: 18 }]}>Tu dispositivo ha sido vinculado exitosamente y está listo para usarse.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onComplete}
          activeOpacity={0.7}>
          <Text style={styles.startButtonText}>Comenzar a Usar</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
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
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});