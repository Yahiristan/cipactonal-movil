import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform } from
'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../ui/Header';

const STORAGE_KEY = '@notificaciones_config';

const DEFAULTS = {
  incidencias: true,
  asistencia_entrada: true,
  asistencia_salida: true,
  asistencia_proxima: true,
  avisos: true
};

export const NotificationsScreen = ({ darkMode, onBack }) => {
  const [config, setConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const styles = darkMode ? notifStylesDark : notifStyles;


  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setConfig({ ...DEFAULTS, ...JSON.parse(saved) });
      } catch (e) {
        (function () {})('[Notifications] Error cargando config:', e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  const toggle = async (key) => {
    const next = { ...config, [key]: !config[key] };
    setConfig(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      (function () {})('[Notifications] Error guardando config:', e.message);
    }
  };


  const grupos = [
  {
    id: 'incidencias',
    titulo: 'Incidencias',
    icono: 'warning',
    colorIcono: darkMode ? '#fbbf24' : '#d97706',
    bgIcono: darkMode ? '#78350f' : '#fef3c7',
    opciones: [
    {
      key: 'incidencias',
      titulo: 'Estado de incidencias',
      subtitulo: 'Cuando un retardo, permiso o justificante sea aprobado o rechazado'
    }]

  },
  {
    id: 'asistencia',
    titulo: 'Asistencia',
    icono: 'finger-print',
    colorIcono: darkMode ? '#60a5fa' : '#2563eb',
    bgIcono: darkMode ? '#1e3a8a' : '#dbeafe',
    opciones: [
    {
      key: 'asistencia_entrada',
      titulo: 'Confirmación de entrada',
      subtitulo: 'Notificación al registrar tu entrada (puntual, retardo, etc.)'
    },
    {
      key: 'asistencia_salida',
      titulo: 'Confirmación de salida',
      subtitulo: 'Notificación al registrar tu salida del turno'
    },
    {
      key: 'asistencia_proxima',
      titulo: 'Recordatorio de asistencia',
      subtitulo: 'Aviso 5 minutos antes de tu hora de entrada o salida'
    }]

  },
  {
    id: 'avisos',
    titulo: 'Avisos',
    icono: 'megaphone',
    colorIcono: darkMode ? '#2dd4bf' : '#0d9488',
    bgIcono: darkMode ? '#134e4a' : '#ccfbf1',
    opciones: [
    {
      key: 'avisos',
      titulo: 'Avisos generales',
      subtitulo: 'Comunicados y anuncios nuevos publicados en el sistema'
    }]

  }];



  return (
    <View style={styles.container}>
            {}
            <Header
              darkMode={darkMode}
              title="Notificaciones"
              leftComponent={
                <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }} activeOpacity={0.6}>
                  <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
              }
            />

            <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {grupos.map((grupo) => (
          <View key={grupo.id}>
            <Text style={styles.sectionLabel}>{grupo.titulo}</Text>
            <View style={styles.sectionContainer}>
              {grupo.opciones.map((op, oi) => (
                <View key={op.key}>
                  <View style={styles.settingItem}>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>{op.titulo}</Text>
                      {op.subtitulo && <Text style={styles.settingSubtitle}>{op.subtitulo}</Text>}
                    </View>
                    <Switch
                      value={config[op.key]}
                      onValueChange={() => toggle(op.key)}
                      trackColor={{ false: darkMode ? '#374151' : '#d1d5db', true: '#2563eb' }}
                      thumbColor={config[op.key] ? '#fff' : darkMode ? '#9ca3af' : '#f3f4f6'}
                      ios_backgroundColor={darkMode ? '#374151' : '#d1d5db'}
                    />
                  </View>
                  {oi < grupo.opciones.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}
            </ScrollView>
        </View>);

};


const notifStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 90
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 10
  },
  sectionContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16
  }
});


const notifStylesDark = StyleSheet.create({
  ...notifStyles,
  container: {
    ...notifStyles.container,
    backgroundColor: '#0f172a'
  },
  sectionContainer: {
    ...notifStyles.sectionContainer,
    backgroundColor: '#1e293b',
    borderWidth: 0
  },
  settingTitle: {
    ...notifStyles.settingTitle,
    color: '#f9fafb'
  },
  settingSubtitle: {
    ...notifStyles.settingSubtitle,
    color: '#9ca3af'
  },
  divider: {
    ...notifStyles.divider,
    backgroundColor: '#334155'
  }
});