import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSolicitudPorToken } from '../../services/solicitudMovilService';
import { StepIndicator } from './StepIndicator';

export const PendingApprovalScreen = ({ tokenSolicitud, idSolicitud, onApproved, onRejected }) => {
  const insets = useSafeAreaInsets();
  const [solicitudStatus, setSolicitudStatus] = useState('pendiente');
  const intervalRef = useRef(null);
  const onApprovedRef = useRef(onApproved);
  const onRejectedRef = useRef(onRejected);

  useEffect(() => {
    onApprovedRef.current = onApproved;
    onRejectedRef.current = onRejected;
  }, [onApproved, onRejected]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await getSolicitudPorToken(tokenSolicitud);

        const estadoLower = response.estado?.toLowerCase();
        setSolicitudStatus(estadoLower);

        if (estadoLower === 'aceptado') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setTimeout(() => {
            onApprovedRef.current({
              idDispositivo: response.id_escritorio || response.id,
              idSolicitud: response.id,
              fechaAprobacion: response.fecha_respuesta
            });
          }, 500);
        }

        if (estadoLower === 'rechazado') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setTimeout(() => {
            onRejectedRef.current(response);
          }, 500);
        }
      } catch (error) {
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tokenSolicitud]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <StepIndicator currentStep={3} />
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="time" size={32} color="#64748b" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>Solicitud Enviada</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>Esperando aprobación</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Estado Actual</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="sync-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.settingTitle}>En Revisión</Text>
                <Text style={styles.settingValue}>El administrador revisará pronto.</Text>
              </View>
            </View>
            <View style={{ paddingRight: 8 }}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>¿Qué sigue?</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color="#4b5563" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>Notificación</Text>
                <Text style={[styles.settingValue, { lineHeight: 18 }]}>Recibirás una respuesta cuando sea procesada.</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="hand-left-outline" size={20} color="#4b5563" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingTitle}>No cierres</Text>
                <Text style={[styles.settingValue, { lineHeight: 18 }]}>Esta pantalla se actualizará automáticamente.</Text>
              </View>
            </View>
          </View>
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
    backgroundColor: '#e2e8f0',
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  stepContent: {
    flex: 1,
    paddingRight: 10
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
  }
});