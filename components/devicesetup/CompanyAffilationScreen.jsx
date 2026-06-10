import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verificarEmpresa } from '../../services/solicitudMovilService';
import { getEmpresaPublicaById } from '../../services/empresaService';
import NetInfo from '@react-native-community/netinfo';
import syncManager from '../../services/offline/syncManager.mjs';
import { Modal, Linking, Image } from 'react-native';
import { StepIndicator } from './StepIndicator';
import getApiEndpoint from '../../config/api';

const obtenerUrlLogo = (logo) => {
  if (!logo) return null;
  if (logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://')) return logo;
  const cleanPath = logo.startsWith('/') ? logo.substring(1) : logo;
  return `${getApiEndpoint()}/${cleanPath}`;
};

const AFFILIATION_CONFIG = {
  title: "Afiliación a la Empresa",
  icon: "business",
  helpText: "¿Problemas con el registro?",
  supportText: "Opciones de contacto"
};

export const CompanyAffiliationScreen = ({ onNext, onPrevious, initialEmpresaId, initialEmpresaIdentificador, initialEmpresaLogo }) => {
  const insets = useSafeAreaInsets();
  const affiliation = AFFILIATION_CONFIG;
  const [companyCode, setCompanyCode] = useState(initialEmpresaIdentificador || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedCompanyName, setVerifiedCompanyName] = useState('');
  const [verifiedCompanyLogo, setVerifiedCompanyLogo] = useState(initialEmpresaLogo || null);

  const handleSupportPress = () => {
    Alert.alert(
      "Contacto Administrativo",
      "Comunícate con el administrador de tu empresa para obtener tu código de afiliación o recibir asistencia técnica con tu dispositivo."
    );
  };


  const handleNext = async () => {
    const trimmedCode = companyCode.trim();

    if (!trimmedCode) {
      Alert.alert('Error', 'Por favor ingresa el código de tu empresa');
      return;
    }

    setIsLoading(true);

    try {
      let currentIp = '127.0.0.1';
      try {
        const netState = await NetInfo.fetch();
        currentIp = netState?.details?.ipAddress || '127.0.0.1';
      } catch (e) {
        console.log('No se pudo obtener la IP local', e);
      }

      const empresaInfo = await verificarEmpresa(trimmedCode, currentIp);

      if (!empresaInfo.existe) {
        Alert.alert(
          'Empresa no encontrada',
          'El código de empresa ingresado no existe. Verifica con tu administrador.'
        );
        setIsLoading(false);
        return;
      }

      if (empresaInfo.activa === false) {
        Alert.alert(
          'Empresa Inactiva',
          'Esta empresa no está activa en el sistema. Contacta a tu administrador.'
        );
        setIsLoading(false);
        return;
      }

      if (empresaInfo.fueraDeRed) {
        Alert.alert(
          'Fuera de Red',
          'Tu dispositivo no se encuentra en una red permitida por la empresa. Conéctate a la red Wi-Fi autorizada e inténtalo de nuevo.'
        );
        setIsLoading(false);
        return;
      }

      if (empresaInfo.token) {
        syncManager.setAuthToken(empresaInfo.token);
      }

      let fetchedLogo = empresaInfo.logo;
      try {
        const publicData = await getEmpresaPublicaById(empresaInfo.id);
        if (publicData?.data?.logo) {
          fetchedLogo = publicData.data.logo;
        }
      } catch (e) {
        console.log("No se pudo obtener logo", e);
      }

      setIsVerified(true);
      setVerifiedCompanyName(empresaInfo.nombre);
      setVerifiedCompanyLogo(fetchedLogo);
      setIsLoading(false);

      setTimeout(() => {
        onNext({
          empresaId: empresaInfo.id,
          empresaCodigo: trimmedCode,
          empresaNombre: empresaInfo.nombre,
          empresaLogo: fetchedLogo
        });
      }, 1500);

    } catch (error) {
      Alert.alert(
        'Error de Conexión',
        error.message || 'No se pudo verificar el código de empresa. Por favor intenta nuevamente.'
      );
      setIsLoading(false);
    }
  };

  const codeLength = companyCode ? companyCode.length : 0;
  let dynamicFontSize = 28;
  let dynamicLetterSpacing = 4;
  
  if (codeLength > 15) {
    dynamicFontSize = 16;
    dynamicLetterSpacing = 1;
  } else if (codeLength > 10) {
    dynamicFontSize = 20;
    dynamicLetterSpacing = 2;
  } else if (codeLength > 7) {
    dynamicFontSize = 24;
    dynamicLetterSpacing = 3;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <StepIndicator currentStep={1} />
        <View style={styles.profileCard}>
          <View style={[styles.avatarPlaceholder, (verifiedCompanyLogo || initialEmpresaLogo) && { backgroundColor: '#ffffff' }]}>
            {verifiedCompanyLogo || initialEmpresaLogo ? (
              <Image source={{ uri: obtenerUrlLogo(verifiedCompanyLogo || initialEmpresaLogo) }} style={{ width: 46, height: 46, borderRadius: 23, resizeMode: 'contain' }} />
            ) : (
              <Ionicons name="business" size={24} color="#64748b" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={2}>{affiliation.title}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.content}>
            <Text style={styles.sectionLabel}>Identificador</Text>
            <View style={[styles.sectionContainer, { paddingVertical: 20 }]}>
              <View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'stretch', paddingHorizontal: 24 }]}>
                
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isVerified ? '#d1fae5' : '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="business" size={32} color={isVerified ? '#10b981' : '#64748b'} />
                  </View>
                  <Text style={{ fontSize: 15, color: '#4b5563', textAlign: 'center', fontWeight: '500' }}>
                    Ingresa el código único proporcionado por tu empresa
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.input, 
                    { fontSize: dynamicFontSize, letterSpacing: dynamicLetterSpacing, paddingVertical: 20, borderRadius: 20 },
                    isVerified && styles.inputVerified
                  ]}
                  placeholder="CÓDIGO"
                  placeholderTextColor="#cbd5e1"
                  value={companyCode}
                  onChangeText={(text) => {
                    setCompanyCode(text.replace(/\s/g, '').toUpperCase());
                    setIsVerified(false);
                  }}
                  autoCapitalize="characters"
                  editable={!isLoading && !isVerified && !initialEmpresaIdentificador} 
                />
                
                {isVerified &&
                  <View style={styles.verifiedContainer}>
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <Text style={[styles.verifiedText, { fontSize: 16 }]}>{verifiedCompanyName}</Text>
                  </View>
                }
              </View>
            </View>

            <Text style={styles.sectionLabel}>Ayuda</Text>
            <View style={styles.sectionContainer}>
              <TouchableOpacity style={styles.settingItem} onPress={handleSupportPress} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <Ionicons name="help-circle-outline" size={20} color="#4b5563" style={styles.settingIcon} />
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.settingTitle}>{affiliation.helpText}</Text>
                    <Text style={[styles.settingValue, { color: '#2563eb' }]}>{affiliation.supportText}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>


      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onPrevious}
            activeOpacity={0.7}
            disabled={isLoading}>
            <Ionicons name="arrow-back" size={20} color="#4b5563" />
            <Text style={styles.backButtonText}>Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (!companyCode || isLoading || isVerified) && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!companyCode || isLoading || isVerified}
            activeOpacity={0.7}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>Verificando...</Text>
              </>
            ) : isVerified ? (
              <>
                <Text style={styles.nextButtonText}>Ingresando</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Verificar</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
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
  keyboardAvoid: {
    flex: 1
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
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    color: '#1f2937',
    width: '100%'
  },
  inputVerified: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4'
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6
  },
  verifiedText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14
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
  backButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  backButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '700'
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  nextButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  closeButton: {
    padding: 4
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  modalTextContainer: {
    flex: 1
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2
  },
  modalOptionSubtitle: {
    fontSize: 14,
    color: '#64748b'
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 64
  }
});