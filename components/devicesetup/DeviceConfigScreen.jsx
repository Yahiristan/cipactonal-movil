import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepIndicator } from './StepIndicator';
import { crearSolicitudMovil, reabrirSolicitudMovil, verificarCorreoEnEmpresa } from '../../services/solicitudMovilService';
import { detectDeviceInfo } from '../../services/deviceUtils';
import getApiEndpoint from '../../config/api';

const obtenerUrlLogo = (logo) => {
  if (!logo) return null;
  if (logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://')) return logo;
  const cleanPath = logo.startsWith('/') ? logo.substring(1) : logo;
  return `${getApiEndpoint()}/${cleanPath}`;
};

const DEVICE_CONFIG = {
  title: "Configuración del Dispositivo",
  fields: [
    {
      id: "email",
      label: "Correo Electrónico",
      placeholder: "tu@email.com",
      icon: "mail-outline",
      type: "email",
      required: true,
      readonly: false,
      helpText: "Usa tu correo institucional"
    },

    {
      id: "macAddress",
      label: "Dirección MAC",
      placeholder: "AA:BB:CC:DD:EE:FF",
      icon: "hardware-chip-outline",
      type: "text",
      required: true,
      readonly: false,
      helpText: "Formato: XX:XX:XX:XX:XX:XX"
    },
    {
      id: "ipAddress",
      label: "Dirección IP",
      placeholder: "192.168.1.1",
      icon: "globe-outline",
      type: "text",
      required: true,
      readonly: true,
      helpText: "IP de la red actual"
    }
  ],
  deviceInfo: {
    title: "Información del Dispositivo"
  }
};

export const DeviceConfigScreen = ({ empresaId, empresaNombre, empresaLogo, onNext, onPrevious, initialEmail, userData }) => {
  const insets = useSafeAreaInsets();
  const deviceConfig = DEVICE_CONFIG;

  const [formData, setFormData] = useState({
    email: '',
    registrationDate: '',
    macAddress: '',
    ipAddress: '',
    deviceModel: '',
    os: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [solicitudExistente, setSolicitudExistente] = useState(null);
  const [showMacHelp, setShowMacHelp] = useState(false);

  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState({
    isValid: null,
    message: '',
    checked: false,
    usuario: null,
    empleadoId: null
  });

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (formData.email && !emailValidation.checked && !isDetecting) {
      const timer = setTimeout(() => {
        handleEmailBlur();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.email, isDetecting]);

  const initializeScreen = async () => {
    try {
      setIsDetecting(true);

      const solicitudRechazadaId = await AsyncStorage.getItem('@solicitud_rechazada_id');
      const solicitudRechazadaToken = await AsyncStorage.getItem('@solicitud_rechazada_token');

      if (solicitudRechazadaId && solicitudRechazadaToken) {
        setSolicitudExistente({ id: solicitudRechazadaId, token: solicitudRechazadaToken });
      }

      await detectDevice();

      let emailToUse = '';

      if (userData?.correo) {
        emailToUse = userData.correo;
      } else if (initialEmail) {
        emailToUse = initialEmail;
      } else {
        const savedEmail = await AsyncStorage.getItem('@user_email');
        if (savedEmail) {
          emailToUse = savedEmail;
        }
      }

      if (emailToUse) {
        setFormData((prev) => ({ ...prev, email: emailToUse }));
      } else {
        Alert.alert(
          'Error de Configuración',
          'No se pudo obtener tu correo electrónico. Por favor, cierra sesión e intenta nuevamente.',
          [{ text: 'Entendido' }]
        );
      }

    } catch (error) {
      Alert.alert('Error', 'No se pudo inicializar la configuración del dispositivo');
    } finally {
      setIsDetecting(false);
    }
  };

  const detectDevice = async () => {
    try {
      const deviceData = await detectDeviceInfo();

      if (!deviceData) {
        throw new Error('No se pudo detectar la información del dispositivo');
      }

      setFormData((prev) => ({
        ...prev,
        registrationDate: deviceData.registrationDate,
        ipAddress: deviceData.ipAddress,
        deviceModel: deviceData.deviceInfo.model,
        os: deviceData.deviceInfo.os
      }));

    } catch (error) {
      Alert.alert('Error', 'No se pudo detectar la información del dispositivo');
    }
  };

  const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = async () => {
    const emailTrimmed = formData.email.trim();

    if (!emailTrimmed) {
      setEmailValidation({
        isValid: null,
        message: '',
        checked: false,
        usuario: null,
        empleadoId: null
      });
      return;
    }

    if (!isValidEmailFormat(emailTrimmed)) {
      setEmailValidation({
        isValid: false,
        message: '✗ Formato de correo inválido',
        checked: true,
        usuario: null,
        empleadoId: null
      });
      return;
    }

    setIsValidatingEmail(true);

    try {
      if (userData?.correo && emailTrimmed === userData.correo.trim().toLowerCase()) {
        setEmailValidation({
          isValid: true,
          message: `Verificado: ${userData.nombre || emailTrimmed.split('@')[0]}`,
          checked: true,
          usuario: { id: userData.id, nombre: userData.nombre, correo: emailTrimmed },
          empleadoId: userData.empleado_id || null
        });
        setIsValidatingEmail(false);
        return;
      }

      const tokenParaVerificar = userData?.token || null;
      const result = await verificarCorreoEnEmpresa(emailTrimmed, empresaId, tokenParaVerificar);

      const esValido = result.existe && result.activo && (result.usuario || result.pendienteValidacion);

      if (esValido) {
        let mensaje = result.usuario ?
          `Verificado: ${result.usuario.nombre}` :
          `[Atención] ${result.mensaje || 'Pendiente de verificación'}`;
        setEmailValidation({
          isValid: true,
          message: mensaje,
          checked: true,
          usuario: result.usuario || { nombre: emailTrimmed.split('@')[0], correo: emailTrimmed },
          empleadoId: result.empleadoId
        });
      } else if (result.existe && !result.activo) {
        setEmailValidation({
          isValid: false,
          message: '✗ Usuario inactivo',
          checked: true,
          usuario: null,
          empleadoId: null
        });
      } else {
        setEmailValidation({
          isValid: false,
          message: result.mensaje || `✗ Correo no registrado`,
          checked: true,
          usuario: null,
          empleadoId: null
        });
      }
    } catch (error) {
      setEmailValidation({
        isValid: false,
        message: 'Error de red',
        checked: true,
        usuario: null,
        empleadoId: null
      });
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const isValidMacFormat = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    return macRegex.test(mac);
  };

  const handleNext = async () => {
    const emailTrimmed = formData.email.trim().toLowerCase();

    if (!emailTrimmed) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!emailValidation.checked || !emailValidation.isValid) {
      Alert.alert(
        'Validación Requerida',
        'Por favor verifica tu correo electrónico antes de continuar',
        [{ text: 'Validar ahora', onPress: handleEmailBlur }]
      );
      return;
    }

    const macTrimmed = formData.macAddress.trim().toUpperCase();
    if (!macTrimmed) {
      Alert.alert('Error', 'Por favor ingresa la dirección MAC de tu dispositivo');
      return;
    }
    if (!isValidMacFormat(macTrimmed)) {
      Alert.alert('Formato Inválido', 'La dirección MAC debe tener el formato XX:XX:XX:XX:XX:XX');
      return;
    }

    if (!empresaId) {
      Alert.alert('Error', 'No se encontró el ID de la empresa');
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (solicitudExistente?.id) {
        const observaciones = `Reintento desde app móvil el ${formData.registrationDate}. Email: ${emailTrimmed}, SO: ${formData.os}`;
        response = await reabrirSolicitudMovil(solicitudExistente.id, observaciones);

        response.id = solicitudExistente.id;
        response.token_solicitud = solicitudExistente.token;

        await AsyncStorage.removeItem('@solicitud_rechazada_id');
        await AsyncStorage.removeItem('@solicitud_rechazada_token');

      } else {
        const solicitudData = {
          nombre: formData.deviceModel,
          correo: emailTrimmed,
          descripcion: `Dispositivo ${Platform.OS === 'ios' ? 'iOS' : 'Android'} - ${formData.deviceModel}`,
          ip: formData.ipAddress,
          mac: formData.macAddress,
          sistema_operativo: Platform.OS === 'ios' ? 'iOS' : 'Android',
          observaciones: `Registro desde app móvil el ${formData.registrationDate}. SO: ${formData.os}`,
          empresa_id: empresaId
        };

        response = await crearSolicitudMovil(solicitudData);
      }

      if (!response.token_solicitud) {
        throw new Error('No se recibió token de solicitud del servidor');
      }

      Alert.alert(
        solicitudExistente?.id ? '¡Solicitud Reabierta!' : '¡Solicitud Enviada!',
        solicitudExistente?.id ?
          'Tu solicitud ha sido reabierta y está pendiente de aprobación nuevamente.' :
          'Tu solicitud ha sido enviada correctamente. Recibirás una notificación cuando sea aprobada.',
        [{
          text: 'Continuar',
          onPress: () => {
            onNext({
              email: emailTrimmed,
              empresaId: empresaId,
              empresaNombre: empresaNombre,
              deviceInfo: {
                model: formData.deviceModel,
                os: formData.os,
                ip: formData.ipAddress,
                mac: formData.macAddress,
                registrationDate: formData.registrationDate
              },
              tokenSolicitud: response.token_solicitud,
              idSolicitud: response.id,
              nombreUsuario: emailValidation.usuario?.nombre || emailTrimmed.split('@')[0],
              empleadoId: emailValidation.empleadoId
            });
          }
        }]
      );

    } catch (error) {
      Alert.alert(
        'Error al Enviar',
        error.message || 'No se pudo enviar la solicitud. Por favor intenta nuevamente.',
        [
          { text: 'Reintentar', onPress: handleNext },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field, index) => {
    const isReadonly = field.readonly;
    const isEmailField = field.id === 'email';
    const isMacField = field.id === 'macAddress';

    const fieldIsReadonly = isReadonly || isEmailField;

    return (
      <React.Fragment key={field.id}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name={field.icon}
              size={18}
              color={fieldIsReadonly ? '#9ca3af' : '#4b5563'}
              style={styles.settingIcon} 
            />
            <View style={{ flex: 1 }}>
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.settingTitle}>
                  {field.label} {field.required && <Text style={{color: '#ef4444'}}>*</Text>}
                </Text>
              </View>
              
              <View style={[
                styles.inputWrapper,
                fieldIsReadonly && styles.inputWrapperReadonly,
                isEmailField && emailValidation.checked && emailValidation.isValid && styles.inputWrapperValid,
                isEmailField && emailValidation.checked && !emailValidation.isValid && styles.inputWrapperInvalid]
              }>
                <TextInput
                  style={[styles.input, fieldIsReadonly && styles.inputReadonly]}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9ca3af"
                  value={formData[field.id]}
                  onChangeText={(text) => {
                    if (isMacField) {
                      const clean = text.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 12);
                      let formatted = '';
                      for (let i = 0; i < clean.length; i++) {
                        if (i > 0 && i % 2 === 0) formatted += ':';
                        formatted += clean[i];
                      }
                      setFormData((prev) => ({ ...prev, [field.id]: formatted }));
                    } else {
                      setFormData((prev) => ({ ...prev, [field.id]: text }));
                    }
                  }}
                  keyboardType={isMacField ? 'default' : field.type === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={isMacField ? 'characters' : field.type === 'email' ? 'none' : 'sentences'}
                  editable={isMacField ? true : false} 
                />

                {fieldIsReadonly &&
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                }
                {isEmailField && isValidatingEmail &&
                  <ActivityIndicator size="small" color="#2563eb" style={{ marginLeft: 6 }} />
                }
                {isMacField && (
                  <TouchableOpacity onPress={() => setShowMacHelp(true)} style={{ paddingLeft: 8 }}>
                    <Ionicons name="help-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.validationRow}>
                {isEmailField && isValidatingEmail &&
                  <Text style={styles.validatingText}>Verificando...</Text>
                }
                {isEmailField && emailValidation.checked && emailValidation.message &&
                  <Text style={[
                    styles.validationMessage,
                    emailValidation.isValid ? styles.validMessage : styles.invalidMessage]
                  }>
                    {emailValidation.message}
                  </Text>
                }

                {isEmailField && !emailValidation.checked &&
                  <Text style={styles.helpText}>✓ Detectado automáticamente</Text>
                }

              </View>
            </View>
          </View>
        </View>
        {index < deviceConfig.fields.length - 1 && <View style={styles.divider} />}
      </React.Fragment>
    );
  };

  if (isDetecting) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Detectando información del dispositivo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <StepIndicator currentStep={2} />
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="hardware-chip" size={32} color="#64748b" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={2}>{deviceConfig.title}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.contentArea}>
            
            <Text style={styles.sectionLabel}>Empresa Vinculada</Text>
            <View style={styles.sectionContainer}>
              <View style={styles.settingItem}>
                <View style={[styles.settingLeft, { alignItems: 'center' }]}>
                  {empresaLogo ? (
                    <Image source={{ uri: obtenerUrlLogo(empresaLogo) }} style={[styles.iconCircle, { backgroundColor: '#ffffff', resizeMode: 'contain' }]} />
                  ) : (
                    <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                      <Ionicons name="business" size={20} color="#4b5563" />
                    </View>
                  )}
                  <View style={{ flex: 1, paddingRight: 10, paddingLeft: 14, justifyContent: 'center' }}>
                    <Text style={[styles.settingTitle, { marginBottom: 0 }]} numberOfLines={1}>{empresaNombre || 'Empresa'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Dispositivo Detectado</Text>
            <View style={styles.sectionContainer}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                    <Ionicons name={Platform.OS === 'ios' ? "logo-apple" : "logo-android"} size={20} color="#4b5563" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 10, paddingLeft: 14 }}>
                    <Text style={styles.settingTitle} numberOfLines={1}>{formData.deviceModel}</Text>
                    <Text style={styles.settingValue} numberOfLines={1}>Sistema: {formData.os}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Configuración</Text>
            <View style={styles.sectionContainer}>
              {deviceConfig.fields.map((field, index) => renderField(field, index))}
            </View>

            {solicitudExistente &&
              <View style={styles.retryBadge}>
                <Ionicons name="refresh-circle" size={16} color="#f59e0b" />
                <Text style={styles.retryText}>Reintentando solicitud anterior</Text>
              </View>
            }

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom + 8 }]}>
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
            style={[
              styles.nextButton,
              (!emailValidation.isValid || isLoading || isValidatingEmail || !formData.macAddress.trim()) && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!emailValidation.isValid || isLoading || isValidatingEmail || !formData.macAddress.trim()}
            activeOpacity={0.7}>

            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>
                  {solicitudExistente ? 'Reabriendo...' : 'Enviando...'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {solicitudExistente ? 'Reabrir' : 'Enviar'}
                </Text>
                <Ionicons name="send" size={16} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showMacHelp}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMacHelp(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="hardware-chip" size={24} color="#64748b" />
              </View>
              <Text style={styles.modalTitle}>Buscar MAC Wi-Fi</Text>
              <TouchableOpacity onPress={() => setShowMacHelp(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {Platform.OS === 'android' ?
                <>
                  <View style={styles.stepItem}>
                    <Ionicons name="wifi-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Abre <Text style={{fontWeight: 'bold'}}>Ajustes {'>'} Wi-Fi</Text> (o Internet y redes)</Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="settings-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Toca el engranaje junto a tu red conectada (o ve a opciones Avanzadas)</Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="search-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Busca <Text style={{fontWeight: 'bold'}}>"Dirección MAC"</Text></Text>
                  </View>
                </> :
                <>
                  <View style={styles.stepItem}>
                    <Ionicons name="settings-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Abre la aplicación de <Text style={{fontWeight: 'bold'}}>Configuración</Text></Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="cog-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Toca en <Text style={{fontWeight: 'bold'}}>"General"</Text></Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="information-circle-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Toca en <Text style={{fontWeight: 'bold'}}>"Información"</Text></Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="wifi-outline" size={22} color="#4b5563" />
                    <Text style={styles.stepText}>Busca la fila <Text style={{fontWeight: 'bold'}}>"Dirección Wi-Fi"</Text> (esa es tu MAC)</Text>
                  </View>
                </>
              }

              <View style={styles.macFormatNote}>
                <Ionicons name="alert-circle-outline" size={16} color="#047857" />
                <Text style={styles.macFormatText}>El formato se ve como: A1:B2:C3:D4:E5:F6</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              {Platform.OS === 'android' &&
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    Linking.sendIntent('android.settings.WIFI_SETTINGS').catch(() => {
                      Linking.sendIntent('android.settings.SETTINGS').catch(() => {
                        Alert.alert("Aviso", "No se pudo abrir la configuración de Wi-Fi automáticamente, por favor hazlo manualmente.");
                      });
                    });
                  }}>
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.modalPrimaryButtonText}>Abrir Ajustes de Wi-Fi</Text>
                </TouchableOpacity>
              }

              <TouchableOpacity
                style={[styles.modalSecondaryButton, Platform.OS !== 'android' && { width: '100%' }]}
                onPress={() => setShowMacHelp(false)}>
                <Text style={styles.modalSecondaryButtonText}>Cerrar Ayuda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280'
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
    borderRadius: 22,
    padding: 14,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 3,
    letterSpacing: -0.5
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10
  },
  sectionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 22,
    paddingVertical: 4,
    marginBottom: 10
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1
  },
  settingIcon: {
    marginRight: 14,
    marginTop: 2
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.2,
    marginBottom: 3
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    height: 34
  },
  inputWrapperReadonly: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db'
  },
  inputWrapperValid: {
    borderColor: '#10b981',
    borderWidth: 1,
    backgroundColor: '#f0fdf4'
  },
  inputWrapperInvalid: {
    borderColor: '#ef4444',
    borderWidth: 1,
    backgroundColor: '#fef2f2'
  },
  input: {
    flex: 1,
    height: 34,
    fontSize: 13,
    color: '#374151',
    paddingVertical: 0
  },
  inputReadonly: {
    color: '#6b7280'
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4
  },
  helpText: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 2
  },
  validatingText: {
    fontSize: 10,
    color: '#2563eb',
    marginLeft: 2
  },
  validationMessage: {
    fontSize: 10,
    marginLeft: 2
  },
  validMessage: {
    color: '#10b981'
  },
  invalidMessage: {
    color: '#ef4444'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16
  },
  deviceInfoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16
  },
  deviceInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  deviceInfoChipText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '500'
  },
  retryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignSelf: 'flex-start'
  },
  retryText: {
    fontSize: 11,
    color: '#92400e',
    marginLeft: 6,
    fontWeight: '600'
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 14,
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  nextButtonDisabled: {
    backgroundColor: '#94a3b8'
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  macHelpInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2
  },
  macHelpInlineTxt: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1
  },
  closeModalButton: {
    padding: 4
  },
  modalScroll: {
    maxHeight: 300
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20
  },
  macFormatNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  macFormatText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '500',
    flex: 1
  },
  modalActions: {
    gap: 10,
    marginTop: 10
  },
  modalPrimaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  modalSecondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  modalSecondaryButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '700'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  }
});