import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSolicitudPorToken } from '../../services/solicitudMovilService';
import { StepIndicator } from './StepIndicator';

export const PendingApprovalScreen = ({ tokenSolicitud, idSolicitud, onApproved, onRejected }) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? dark : light;

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
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => {
            onApprovedRef.current({
              idDispositivo: response.id_escritorio || response.id,
              idSolicitud: response.id,
              fechaAprobacion: response.fecha_respuesta
            });
          }, 500);
        }

        if (estadoLower === 'rechazado') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => {
            onRejectedRef.current(response);
          }, 500);
        }
      } catch (error) {
        // silently ignore polling errors
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tokenSolicitud]);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.bg, paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <StepIndicator currentStep={3} />
        <View style={[styles.profileCard, { backgroundColor: t.card }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: t.avatarBg }]}>
            <Ionicons name="time" size={32} color={t.iconColor} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.textPrimary }]} numberOfLines={1}>Solicitud Enviada</Text>
            <Text style={[styles.profileEmail, { color: t.textSecondary }]} numberOfLines={1}>Esperando aprobación</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Estado Actual</Text>
        <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
                <Ionicons name="sync-outline" size={20} color={t.accentBlue} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.settingTitle, { color: t.textPrimary }]}>En Revisión</Text>
                <Text style={[styles.settingValue, { color: t.textMuted }]}>El administrador revisará pronto.</Text>
              </View>
            </View>
            <View style={{ paddingRight: 8 }}>
              <ActivityIndicator size="small" color={t.accentBlue} />
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>¿Qué sigue?</Text>
        <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={t.iconColor} style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.settingTitle, { color: t.textPrimary }]}>Notificación</Text>
                <Text style={[styles.settingValue, { lineHeight: 18, color: t.textMuted }]}>Recibirás una respuesta cuando sea procesada.</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: t.divider }]} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="hand-left-outline" size={20} color={t.iconColor} style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.settingTitle, { color: t.textPrimary }]}>No cierres</Text>
                <Text style={[styles.settingValue, { lineHeight: 18, color: t.textMuted }]}>Esta pantalla se actualizará automáticamente.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Paletas ──────────────────────────────────────────────────────────────────
const light = {
  bg:            '#ffffff',
  card:          '#f9fafb',
  avatarBg:      '#e2e8f0',
  textPrimary:   '#1f2937',
  textSecondary: '#64748b',
  textMuted:     '#9ca3af',
  sectionLabel:  '#94a3b8',
  iconColor:     '#4b5563',
  divider:       '#f1f5f9',
  accentBlue:    '#2563eb',
};

const dark = {
  bg:            '#0f172a',
  card:          '#1e293b',
  avatarBg:      '#334155',
  textPrimary:   '#ffffff',
  textSecondary: '#94a3b8',
  textMuted:     '#94a3b8',
  sectionLabel:  '#ffffff',
  iconColor:     '#94a3b8',
  divider:       '#1e293b',
  accentBlue:    '#3b82f6',
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 20,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionContainer: {
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});