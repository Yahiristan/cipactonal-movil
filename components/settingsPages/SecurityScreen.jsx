import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert } from
'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../ui/Header';


import { checkBiometricSupport } from '../../services/biometricservice';
import { getCredencialesByEmpleado } from '../../services/credencialesService';


import sqliteManager from '../../services/offline/sqliteManager.mjs';
import syncManager from '../../services/offline/syncManager.mjs';


const ESTADOS = {
  activo: {
    colorValor: '#16a34a',
    etiqueta: 'Habilitada'
  },
  inactivo: {
    colorValor: '#9ca3af',
    etiqueta: 'Sin registrar'
  },
  noDisponible: {
    colorValor: '#dc2626',
    etiqueta: 'No disponible'
  }
};

export const SecurityScreen = ({ darkMode, onBack, userData }) => {

  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [hasFacial, setHasFacial] = useState(false);
  const [hasPin, setHasPin] = useState(false);


  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);


  const [biometricSupport, setBiometricSupport] = useState(null);


  const [isOffline, setIsOffline] = useState(false);

  const styles = darkMode ? securityStylesDark : securityStyles;


  const handleEliminarDatos = () => {
    Alert.alert(
      'Eliminación de datos biométricos',
      'Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), tienes todo el derecho de solicitar la eliminación de tus datos biométricos registrados en el sistema.\n\nPara ejercer este derecho, comunícate con el área de Recursos Humanos o con el administrador del sistema, quien procesará tu solicitud conforme a los plazos y procedimientos establecidos por la ley.',
      [{ text: 'Entendido', style: 'default' }],
      { cancelable: true }
    );
  };

  useEffect(() => {
    initializeSecurity();
  }, []);


  const initializeSecurity = async () => {
    try {
      const support = await checkBiometricSupport();
      setBiometricSupport(support);

      const empleadoId =
      userData?.empleado?.id || userData?.empleado_id || userData?.id;

      if (!empleadoId) {
        setIsLoadingCredentials(false);
        return;
      }

      const token = await AsyncStorage.getItem('userToken');


      let onlineNow = false;
      try {
        onlineNow = await syncManager.isOnline();
      } catch (netErr) {
        (function () {})('[Security] No se pudo verificar red:', netErr.message);
      }

      let cargoOnline = false;


      if (onlineNow && token && !syncManager.getIsBackendDown()) {
        try {
          const credenciales = await getCredencialesByEmpleado(empleadoId, token);
          if (credenciales.success && credenciales.data) {
            setHasFingerprint(credenciales.data.tiene_dactilar || false);
            setHasFacial(credenciales.data.tiene_facial || false);
            setHasPin(credenciales.data.tiene_pin || false);
            cargoOnline = true;
          }
        } catch (e) {
          (function () {})('[Security] Error cargando credenciales online:', e.message);
        }
      }


      if (!cargoOnline) {
        try {
          const creds = await sqliteManager.getAllCredenciales();
          const misCreds = creds.filter((c) => c.empleado_id === empleadoId);

          setHasFingerprint(misCreds.some((c) => c.dactilar_template));
          setHasFacial(misCreds.some((c) => c.facial_descriptor));
          setHasPin(misCreds.some((c) => c.pin_hash));

          if (!onlineNow) setIsOffline(true);
        } catch (dbErr) {
          (function () {})('[Security] Error cargando credenciales offline:', dbErr.message);
          if (!onlineNow) setIsOffline(true);
        }
      }
    } catch (error) {
      (function () {})('[Security] Error en initializeSecurity:', error);
    } finally {
      setIsLoadingCredentials(false);
    }
  };


  const getEstado = (tipo) => {
    switch (tipo) {
      case 'dactilar':
        if (hasFingerprint) return 'activo';
        if (!biometricSupport?.hasFingerprint) return 'noDisponible';
        return 'inactivo';
      case 'facial':
        return hasFacial ? 'activo' : 'inactivo';
      case 'pin':
        return hasPin ? 'activo' : 'inactivo';
      default:
        return 'inactivo';
    }
  };


  if (isLoadingCredentials) {
    return (
      <View style={styles.container}>
        <Header
          darkMode={darkMode}
          title="Seguridad"
          leftComponent={
            <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
              <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>
            Cargando configuración de seguridad...
          </Text>
        </View>
      </View>);

  }


  const metodos = [
  {
    id: 'dactilar',
    nombre: 'Huella Digital',
    icono: 'finger-print',
    estado: getEstado('dactilar')
  },
  {
    id: 'facial',
    nombre: 'Facial',
    icono: 'scan',
    estado: getEstado('facial')
  },
  {
    id: 'pin',
    nombre: 'PIN',
    icono: 'keypad',
    estado: getEstado('pin')
  }];



  return (
    <View style={styles.container}>
      {}
      <Header
        darkMode={darkMode}
        title="Seguridad"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionLabel}>Mis Credenciales</Text>
        <View style={styles.sectionContainer}>
          {metodos.map((metodo, idx) => {
            const cfg = ESTADOS[metodo.estado];

            return (
              <View key={metodo.id}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name={metodo.icono} size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                    <Text style={styles.settingTitle}>{metodo.nombre}</Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={[styles.settingValue, { color: cfg.colorValor }]}>{cfg.etiqueta}</Text>
                  </View>
                </View>
                {idx < metodos.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Privacidad</Text>
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleEliminarDatos}
            activeOpacity={0.75}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: '#ef4444' }]}>Eliminación de datos biométricos</Text>
                <Text style={styles.settingSubtitle}>Conoce tus derechos · Ley ARCO</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>);

};


const securityStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280'
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
    letterSpacing: 1.2
  },
  sectionContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 28,
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingIcon: {
    marginRight: 14
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937'
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 18
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16
  }
});


const securityStylesDark = StyleSheet.create({
  ...securityStyles,
  container: {
    ...securityStyles.container,
    backgroundColor: '#0f172a'
  },
  sectionContainer: {
    ...securityStyles.sectionContainer,
    backgroundColor: '#1e293b',
    borderWidth: 0
  },
  settingTitle: {
    ...securityStyles.settingTitle,
    color: '#f9fafb'
  },
  settingSubtitle: {
    ...securityStyles.settingSubtitle,
    color: '#9ca3af'
  },
  divider: {
    ...securityStyles.divider,
    backgroundColor: '#334155'
  }
});