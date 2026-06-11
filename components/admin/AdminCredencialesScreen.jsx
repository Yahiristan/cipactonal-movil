import React, { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getCredencialesByEmpleado,
  guardarPin,
  guardarDactilar,
  guardarFacial,
  eliminarCredencial
} from '../../services/credencialesService';
import { checkBiometricSupport } from '../../services/biometricservice';
import { PinInputModal } from '../settingsPages/PinModal';
import { Header } from '../ui/Header';
import getApiEndpoint from '../../config/api';
import { Image } from 'react-native';

const obtenerUrlFotoPerfil = (foto) => {
  if (!foto) return null;
  if (foto.startsWith('data:image/') || foto.startsWith('http')) return foto;
  const BASE_URL = getApiEndpoint('');
  return `${BASE_URL}${foto.startsWith('/') ? '' : '/'}${foto}`;
};


const ESTADOS = {
  activo: {
    bg: '#16a34a', texto: '#fff', etiqueta: 'Habilitada', icono: 'checkmark-circle'
  },
  inactivo: {
    bg: '#6b7280', texto: '#fff', etiqueta: 'Sin registrar', icono: 'ellipse-outline'
  }
};


export const AdminCredencialesScreen = ({ empleado, userData, darkMode, onBack }) => {
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [hasFacial, setHasFacial] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [biometricSupport, setBiometricSupport] = useState(null);


  const [procesandoHuella, setProcesandoHuella] = useState(false);
  const [procesandoFacial, setProcesandoFacial] = useState(false);
  const [procesandoPin, setProcesandoPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showFacialCapture, setShowFacialCapture] = useState(false);

  const styles = darkMode ? darkStyles : lightStyles;
  const fotoUrl = empleado.foto ? obtenerUrlFotoPerfil(empleado.foto) : null;

  const cargarCredenciales = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await getCredencialesByEmpleado(empleado.id, token);
      setHasFingerprint(res.data?.tiene_dactilar || false);
      setHasFacial(res.data?.tiene_facial || false);
      setHasPin(res.data?.tiene_pin || false);
    } catch {

    } finally {
      setLoading(false);
    }
  }, [empleado.id]);

  useEffect(() => {
    const init = async () => {
      try {
        const support = await checkBiometricSupport();
        setBiometricSupport(support);
      } catch { }
      await cargarCredenciales();
    };
    init();
  }, [cargarCredenciales]);

  const getEstado = (tiene) => tiene ? ESTADOS.activo : ESTADOS.inactivo;



  const handleRegistrarHuella = async () => {
    Alert.alert(
      hasFingerprint ? 'Actualizar Huella' : 'Registro de Huella',
      'Las huellas dactilares únicamente se administran de forma segura desde la aplicación de Computadora (Desktop).\n\nEn la aplicación móvil solo se utiliza para validación biométrica local.'
    );
  };

  const handleRegistrarFacial = () => {
    Alert.alert(
      hasFacial ? 'Actualizar Facial' : 'Registro Facial',
      'El registro o actualización facial únicamente puede realizarse de forma segura desde la aplicación de Escritorio/Computadora o Web.\n\nEn la aplicación móvil solo se utiliza para validación biométrica local al checar.'
    );
  };

  const handleRegistrarPin = () => {
    setShowPinModal(true);
  };

  const handleConfirmarPin = async (pin) => {
    setShowPinModal(false);
    setProcesandoPin(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await guardarPin(empleado.id, pin, token);
      Alert.alert('Éxito', 'PIN registrado correctamente.');
      await cargarCredenciales();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo guardar el PIN.');
    } finally {
      setProcesandoPin(false);
    }
  };

  const handleEliminar = (tipo, label) => {
    Alert.alert(
      `Eliminar ${label}`,
      `¿Eliminar la credencial de ${label.toLowerCase()} de ${empleado.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await eliminarCredencial(empleado.id, tipo, token);
              Alert.alert('Eliminado', `${label} eliminada correctamente.`);
              await cargarCredenciales();
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo eliminar la credencial.');
            }
          }
        }]

    );
  };


  const CredencialCard = ({ tipo, label, icono, tiene, onRegistrar, onEliminar, procesando }) => {
    const estado = getEstado(tiene);
    return (
      <View style={styles.credCard}>
        <View style={styles.credHeader}>
          <View style={styles.credIconWrap}>
            <Ionicons name={icono} size={28} color={tiene ? '#16a34a' : darkMode ? '#9ca3af' : '#2563eb'} />
          </View>
          <View style={styles.credInfo}>
            <Text style={styles.credLabel}>{label}</Text>
            <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
              <Ionicons name={estado.icono} size={11} color={estado.texto} />
              <Text style={[styles.estadoText, { color: estado.texto }]}>{estado.etiqueta}</Text>
            </View>
          </View>
          {procesando && <ActivityIndicator size="small" color="#2563eb" />}
        </View>

        <View style={styles.credActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={onRegistrar}
            disabled={procesando}>

            <Ionicons name={tiene ? 'refresh' : 'add'} size={15} color="#fff" />
            <Text style={styles.actionBtnTextPrimary}>{tiene ? 'Actualizar' : 'Registrar'}</Text>
          </TouchableOpacity>

          {tiene &&
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => onEliminar(tipo, label)}
              disabled={procesando}>

              <Ionicons name="trash-outline" size={15} color="#dc2626" />
              <Text style={styles.actionBtnTextDanger}>Eliminar</Text>
            </TouchableOpacity>
          }
        </View>
      </View>);

  };

  return (
    <View style={styles.container}>
      

      {/* Header unificado */}
      <Header
        darkMode={darkMode}
        title="Credenciales"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={cargarCredenciales} style={{ padding: 8, marginRight: -8 }}>
            <Ionicons name="refresh" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
      />

      {loading ?
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando credenciales...</Text>
        </View> :

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.profileCard}>
            <View style={styles.profileGradient}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {fotoUrl ?
                  <Image source={{ uri: fotoUrl }} style={styles.avatarImage} /> :
                  <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color="#fff" />
                    </View>
                  }
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>{empleado.nombre}</Text>
                  <Text style={styles.profileUsername} numberOfLines={1}>{empleado.correo || 'No registrado'}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Credenciales registradas</Text>

          <View style={styles.sectionContainer}>
            { }
            <CredencialCard
              tipo="dactilar"
              label="Huella Dactilar"
              icono="finger-print"
              tiene={hasFingerprint}
              procesando={procesandoHuella}
              onRegistrar={handleRegistrarHuella}
              onEliminar={handleEliminar} />

            <View style={styles.divider} />

            { }
            <CredencialCard
              tipo="facial"
              label="Facial"
              icono="scan"
              tiene={hasFacial}
              procesando={procesandoFacial}
              onRegistrar={handleRegistrarFacial}
              onEliminar={handleEliminar} />

            <View style={styles.divider} />

            { }
            <CredencialCard
              tipo="pin"
              label="PIN"
              icono="keypad"
              tiene={hasPin}
              procesando={procesandoPin}
              onRegistrar={handleRegistrarPin}
              onEliminar={handleEliminar} />
          </View>
        </ScrollView>
      }

      { }
      <PinInputModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={handleConfirmarPin}
        darkMode={darkMode} />


      { }
    </View>);

};


const baseStyles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 80 },
  profileCard: {
    borderRadius: 24,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9'
  },
  profileGradient: {
    padding: 20
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    marginRight: 16
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9'
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4
  },
  profileUsername: {
    fontSize: 13,
    color: '#6b7280'
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: 8, marginLeft: 12
  },
  sectionContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16
  },
  credCard: {
    padding: 16
  },
  credHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  credIconWrap: {
    width: 46, height: 46,
    justifyContent: 'center', alignItems: 'center'
  },
  credInfo: { flex: 1 },
  credLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2
  },
  estadoText: { fontSize: 11, fontWeight: '600' },
  credActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flex: 1,
    justifyContent: 'center'
  },
  actionBtnPrimary: { backgroundColor: '#2563eb' },
  actionBtnTextPrimary: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actionBtnDanger: { backgroundColor: '#fee2e2' },
  actionBtnTextDanger: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, padding: 14,
    borderWidth: 1, marginTop: 4
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 }
});

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#f8fafc' },
  sectionLabel: { ...baseStyles.sectionLabel, color: '#94a3b8' },
  sectionContainer: { ...baseStyles.sectionContainer, backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  divider: { ...baseStyles.divider, backgroundColor: '#e2e8f0' },
  profileCard: { ...baseStyles.profileCard, backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  profileName: { ...baseStyles.profileName, color: '#1f2937' },
  profileUsername: { ...baseStyles.profileUsername, color: '#6b7280' },
  credLabel: { ...baseStyles.credLabel, color: '#111827' },
  infoBox: { ...baseStyles.infoBox, backgroundColor: '#ffffff', borderColor: '#e5e7eb' },
  infoText: { ...baseStyles.infoText, color: '#4b5563' },
  loadingText: { ...baseStyles.loadingText, color: '#6b7280' }
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#0f172a' },
  sectionLabel: { ...baseStyles.sectionLabel, color: '#9ca3af' },
  sectionContainer: { ...baseStyles.sectionContainer, backgroundColor: '#1e293b', borderWidth: 0 },
  divider: { ...baseStyles.divider, backgroundColor: '#334155' },
  profileCard: { ...baseStyles.profileCard, backgroundColor: '#1e293b', borderWidth: 0 },
  profileName: { ...baseStyles.profileName, color: '#f9fafb' },
  profileUsername: { ...baseStyles.profileUsername, color: '#9ca3af' },
  credLabel: { ...baseStyles.credLabel, color: '#f9fafb' },
  actionBtnDanger: { ...baseStyles.actionBtnDanger, backgroundColor: '#3b1a1a' },
  infoBox: { ...baseStyles.infoBox, backgroundColor: '#1e293b', borderColor: '#334155' },
  infoText: { ...baseStyles.infoText, color: '#94a3b8' },
  loadingText: { ...baseStyles.loadingText, color: '#9ca3af' }
});