import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  useColorScheme
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? dark : light;
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
  const [retryStatus, setRetryStatus] = useState('');
  const [isDetecting, setIsDetecting] = useState(true);
  const [solicitudExistente, setSolicitudExistente] = useState(null);
  const [showMacHelp, setShowMacHelp] = useState(false);

  const isConnectionError = (err) => {
    const msg = (err?.message || '').toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('connection') ||
      msg.includes('timeout') ||
      msg.includes('abort') ||
      msg.includes('conectar') ||
      msg.includes('servidor')
    );
  };

  // Modal de alerta personalizado
  const [alertModal, setAlertModal] = useState({ visible: false, icon: 'alert-circle', iconColor: '#ef4444', title: '', message: '', actions: [] });
  const alertAnim = useRef(new Animated.Value(0)).current;

  const showAlert = (icon, iconColor, title, message, actions = [{ label: 'Entendido', onPress: null }]) => {
    setAlertModal({ visible: true, icon, iconColor, title, message, actions });
    Animated.spring(alertAnim, { toValue: 1, tension: 120, friction: 12, useNativeDriver: true }).start();
  };

  const hideAlert = (cb) => {
    Animated.timing(alertAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setAlertModal(prev => ({ ...prev, visible: false }));
      cb?.();
    });
  };

  // Animación para el modal de ayuda MAC
  const macHelpAnim = useRef(new Animated.Value(0)).current;

  const openMacHelp = () => {
    setShowMacHelp(true);
    Animated.spring(macHelpAnim, { toValue: 1, tension: 120, friction: 12, useNativeDriver: true }).start();
  };

  const closeMacHelp = () => {
    Animated.timing(macHelpAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setShowMacHelp(false));
  };

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
        showAlert('mail', '#ef4444', 'Error de Configuración', 'No se pudo obtener tu correo electrónico. Por favor, cierra sesión e intenta nuevamente.');
      }

    } catch (error) {
      showAlert('alert-circle', '#ef4444', 'Error', 'No se pudo inicializar la configuración del dispositivo.');
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
      showAlert('hardware-chip-outline', '#f59e0b', 'Sin información', 'No se pudo detectar la información del dispositivo.');
    }
  };

  const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = async () => {
    const emailTrimmed = formData.email.trim();

    if (!emailTrimmed) {
      setEmailValidation({ isValid: null, message: '', checked: false, usuario: null, empleadoId: null });
      return;
    }

    if (!isValidEmailFormat(emailTrimmed)) {
      setEmailValidation({ isValid: false, message: 'Formato de correo inválido', checked: true, usuario: null, empleadoId: null });
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
        setEmailValidation({ isValid: false, message: 'Usuario inactivo', checked: true, usuario: null, empleadoId: null });
      } else {
        setEmailValidation({ isValid: false, message: result.mensaje || 'Correo no registrado', checked: true, usuario: null, empleadoId: null });
      }
    } catch (error) {
      setEmailValidation({ isValid: false, message: 'Error de red', checked: true, usuario: null, empleadoId: null });
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
      showAlert('mail', '#ef4444', 'Campo requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!emailValidation.checked || !emailValidation.isValid) {
      showAlert('checkmark-circle', '#f59e0b', 'Validación requerida', 'Por favor verifica tu correo electrónico antes de continuar.', [
        { label: 'Validar ahora', onPress: handleEmailBlur },
        { label: 'Cancelar', onPress: null }
      ]);
      return;
    }

    const macTrimmed = formData.macAddress.trim().toUpperCase();
    if (!macTrimmed) {
      showAlert('hardware-chip-outline', '#ef4444', 'Campo requerido', 'Por favor ingresa la dirección MAC de tu dispositivo.');
      return;
    }
    if (!isValidMacFormat(macTrimmed)) {
      showAlert('hardware-chip-outline', '#f59e0b', 'Formato inválido', 'La dirección MAC debe tener el formato XX:XX:XX:XX:XX:XX.');
      return;
    }

    if (!empresaId) {
      showAlert('business', '#ef4444', 'Error', 'No se encontró el ID de la empresa.');
      return;
    }

    setIsLoading(true);
    setRetryStatus('');

    const MAX_RETRIES = 8;
    const getDelay = (attempt) => Math.min(2000 + (attempt - 1) * 1000, 8000);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          setRetryStatus(`Intentando enviar... (${attempt}/${MAX_RETRIES})`);
        }

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

        setRetryStatus('');
        setIsLoading(false);

        showAlert(
          solicitudExistente?.id ? 'checkmark-circle' : 'send',
          '#10b981',
          solicitudExistente?.id ? '¡Solicitud Reabierta!' : '¡Solicitud Enviada!',
          solicitudExistente?.id
            ? 'Tu solicitud ha sido reabierta y está pendiente de aprobación nuevamente.'
            : 'Tu solicitud ha sido enviada correctamente. Recibirás una notificación cuando sea aprobada.',
          [{
            label: 'Continuar',
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

        return; // Salir exitosamente

      } catch (error) {
        if (!isConnectionError(error)) {
          showAlert(
            'alert-circle', '#ef4444',
            'Error al Enviar',
            error.message || 'No se pudo enviar la solicitud. Por favor intenta nuevamente.',
            [
              { label: 'Reintentar', onPress: handleNext },
              { label: 'Cancelar', onPress: null }
            ]
          );
          setIsLoading(false);
          setRetryStatus('');
          return;
        }

        if (attempt < MAX_RETRIES) {
          const delay = getDelay(attempt);
          setRetryStatus(`Despertando servidor... (${attempt}/${MAX_RETRIES})`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }

    setRetryStatus('');
    setIsLoading(false);
    showAlert('cloud-offline', '#ef4444', 'Sin conexión', 'No se pudo conectar con el servidor después de varios intentos.\n\nVerifica tu conexión a internet e inténtalo de nuevo.');
  };

  const renderField = (field, index) => {
    const isReadonly = field.readonly;
    const isEmailField = field.id === 'email';
    const isMacField = field.id === 'macAddress';
    const fieldIsReadonly = isReadonly || isEmailField;

    // Determine input wrapper background and border color
    let wrapperBg = t.inputBg;
    let wrapperBorder = t.inputBorder;
    if (fieldIsReadonly) {
      wrapperBg = t.inputReadonlyBg;
      wrapperBorder = t.inputReadonlyBorder;
    }
    if (isEmailField && emailValidation.checked && emailValidation.isValid) {
      wrapperBg = isDark ? '#064e3b' : '#f0fdf4';
      wrapperBorder = '#10b981';
    }
    if (isEmailField && emailValidation.checked && !emailValidation.isValid) {
      wrapperBg = isDark ? '#450a0a' : '#fef2f2';
      wrapperBorder = '#ef4444';
    }

    return (
      <React.Fragment key={field.id}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name={field.icon}
              size={18}
              color={t.iconColor}
              style={styles.settingIcon}
            />
            <View style={{ flex: 1 }}>
              <View style={{ marginBottom: 4 }}>
                <Text style={[styles.settingTitle, { color: t.textPrimary }]}>
                  {field.label} {field.required && <Text style={{ color: '#ef4444' }}>*</Text>}
                </Text>
              </View>

              <View style={[
                styles.inputWrapper,
                { backgroundColor: wrapperBg, borderColor: wrapperBorder }
              ]}>
                <TextInput
                  style={[styles.input, { color: t.textPrimary }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={t.placeholder}
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
                  <ActivityIndicator size="small" color={t.accentBlue} style={{ marginLeft: 6 }} />
                }
                {isMacField && (
                  <TouchableOpacity onPress={openMacHelp} style={{ paddingLeft: 8 }}>
                    <Ionicons name="help-circle" size={20} color={t.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.validationRow}>
                {isEmailField && isValidatingEmail &&
                  <Text style={[styles.validatingText, { color: t.accentBlue }]}>Verificando...</Text>
                }
                {isEmailField && emailValidation.checked && emailValidation.message &&
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons
                      name={emailValidation.isValid ? 'checkmark-circle' : 'close-circle'}
                      size={12}
                      color={emailValidation.isValid ? '#10b981' : '#ef4444'}
                    />
                    <Text style={[
                      styles.validationMessage,
                      emailValidation.isValid ? { color: '#10b981' } : { color: '#ef4444' }
                    ]}>
                      {emailValidation.message}
                    </Text>
                  </View>
                }
                {isEmailField && !emailValidation.checked &&
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="checkmark-circle-outline" size={12} color={t.textMuted} />
                    <Text style={[styles.helpText, { color: t.textMuted }]}>Detectado automáticamente</Text>
                  </View>
                }
              </View>
            </View>
          </View>
        </View>
        {index < deviceConfig.fields.length - 1 && <View style={[styles.divider, { backgroundColor: t.divider }]} />}
      </React.Fragment>
    );
  };

  if (isDetecting) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accentBlue} />
        <Text style={[styles.loadingText, { color: t.textSecondary }]}>Detectando información del dispositivo...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.bg, paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <StepIndicator currentStep={2} />
        <View style={[styles.profileCard, { backgroundColor: t.card }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: t.avatarBg }]}>
            <Ionicons name="hardware-chip" size={32} color={t.iconColor} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.textPrimary }]} numberOfLines={2}>{deviceConfig.title}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.contentArea}>

              <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Empresa Vinculada</Text>
              <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
                <View style={styles.settingItem}>
                  <View style={[styles.settingLeft, { alignItems: 'center' }]}>
                    {empresaLogo ? (
                      <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1e293b' : '#ffffff', overflow: 'hidden' }]}>
                        <Image source={{ uri: obtenerUrlLogo(empresaLogo) }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                      </View>
                    ) : (
                      <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                        <Ionicons name="business" size={20} color={t.iconColor} />
                      </View>
                    )}
                    <View style={{ flex: 1, paddingRight: 10, paddingLeft: 14, justifyContent: 'center' }}>
                      <Text style={[styles.settingTitle, { marginBottom: 0, color: t.textPrimary }]} numberOfLines={1}>{empresaNombre || 'Empresa'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Dispositivo Detectado</Text>
              <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                      <Ionicons name={Platform.OS === 'ios' ? "logo-apple" : "logo-android"} size={20} color={Platform.OS === 'android' ? '#22c55e' : t.textPrimary} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 10, paddingLeft: 14 }}>
                      <Text style={[styles.settingTitle, { color: t.textPrimary }]} numberOfLines={1}>{formData.deviceModel}</Text>
                      <Text style={[styles.settingValue, { color: t.textMuted }]} numberOfLines={1}>Sistema: {formData.os}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Configuración</Text>
              <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
                {deviceConfig.fields.map((field, index) => renderField(field, index))}
              </View>

              {solicitudExistente &&
                <View style={[styles.retryBadge, { backgroundColor: isDark ? '#422006' : '#fef3c7', borderColor: isDark ? '#78350f' : '#fde68a' }]}>
                  <Ionicons name="refresh-circle" size={16} color="#f59e0b" />
                  <Text style={[styles.retryText, { color: isDark ? '#fbbf24' : '#92400e' }]}>Reintentando solicitud anterior</Text>
                </View>
              }

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: t.bg, borderTopColor: t.divider, paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom + 8 }]}>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: t.btnSecondaryBg }]}
            onPress={onPrevious}
            activeOpacity={0.7}
            disabled={isLoading}>
            <Ionicons name="arrow-back" size={20} color={t.btnSecondaryText} />
            <Text style={[styles.backButtonText, { color: t.btnSecondaryText }]}>Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: isLoading ? t.btnDisabled : t.accentBlue }
            ]}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.7}>

            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.nextButtonText, { marginLeft: 8 }]}>
                  {retryStatus ? 'Reintentando...' : (solicitudExistente ? 'Reabriendo...' : 'Enviando...')}
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

      {/* Modal: Ayuda dirección MAC — diseño premium */}
      <Modal visible={showMacHelp} animationType="none" transparent onRequestClose={closeMacHelp} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={closeMacHelp}>
          <View style={mStyles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View style={[
                mStyles.macCard,
                { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' },
                {
                  opacity: macHelpAnim,
                  transform: [{ scale: macHelpAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }]
                }
              ]}>
                <View style={[mStyles.topStripe, { backgroundColor: '#2563eb' }]} />

                {/* Cabecera */}
                <View style={mStyles.macHeader}>
                  <View style={[mStyles.iconCircle, { backgroundColor: '#2563eb1A' }]}>
                    <Ionicons name="hardware-chip" size={26} color="#2563eb" />
                  </View>
                  <Text style={[mStyles.macTitle, { color: isDark ? '#f1f5f9' : '#111827' }]}>Buscar MAC Wi-Fi</Text>
                  <TouchableOpacity onPress={closeMacHelp} style={mStyles.closeBtn}>
                    <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#6b7280'} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 8 }}>
                  {Platform.OS === 'android' ? (
                    <>
                      <View style={mStyles.stepItem}>
                        <View style={[mStyles.stepBadge, { backgroundColor: '#2563eb' }]}><Text style={mStyles.stepNum}>1</Text></View>
                        <Text style={[mStyles.stepText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Abre <Text style={{ fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>Ajustes {'>'} Wi-Fi</Text> (o Internet y redes)</Text>
                      </View>
                      <View style={mStyles.stepItem}>
                        <View style={[mStyles.stepBadge, { backgroundColor: '#2563eb' }]}><Text style={mStyles.stepNum}>2</Text></View>
                        <Text style={[mStyles.stepText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Toca el <Text style={{ fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>engranaje</Text> junto a tu red conectada</Text>
                      </View>
                      <View style={mStyles.stepItem}>
                        <View style={[mStyles.stepBadge, { backgroundColor: '#2563eb' }]}><Text style={mStyles.stepNum}>3</Text></View>
                        <Text style={[mStyles.stepText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Busca <Text style={{ fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>"Dirección MAC"</Text></Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={mStyles.stepItem}>
                        <View style={[mStyles.stepBadge, { backgroundColor: '#2563eb' }]}><Text style={mStyles.stepNum}>1</Text></View>
                        <Text style={[mStyles.stepText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Abre <Text style={{ fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>Configuración</Text></Text>
                      </View>
                      <View style={mStyles.stepItem}>
                        <View style={[mStyles.stepBadge, { backgroundColor: '#2563eb' }]}><Text style={mStyles.stepNum}>2</Text></View>
                        <Text style={[mStyles.stepText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Toca en <Text style={{ fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>General {'>'} Información</Text></Text>
                      </View>
                      <View style={mStyles.stepItem}>
                        <View style={[mStyles.stepBadge, { backgroundColor: '#2563eb' }]}><Text style={mStyles.stepNum}>3</Text></View>
                        <Text style={[mStyles.stepText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Busca la fila <Text style={{ fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>"Dirección Wi-Fi"</Text></Text>
                      </View>
                    </>
                  )}

                  <View style={[mStyles.formatNote, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#065f46' : '#a7f3d0' }]}>
                    <Ionicons name="information-circle" size={16} color="#047857" />
                    <Text style={[mStyles.formatText, { color: isDark ? '#6ee7b7' : '#065f46' }]}>Formato: A1:B2:C3:D4:E5:F6</Text>
                  </View>
                </ScrollView>

                {/* Botones */}
                <View style={mStyles.macActions}>
                  {Platform.OS === 'android' && (
                    <TouchableOpacity
                      style={[mStyles.macPrimaryBtn, { backgroundColor: '#2563eb' }]}
                      onPress={() => {
                        Linking.sendIntent('android.settings.WIFI_SETTINGS').catch(() =>
                          Linking.sendIntent('android.settings.SETTINGS').catch(() =>
                            showAlert('wifi', '#f59e0b', 'Aviso', 'No se pudo abrir la configuración de Wi-Fi automáticamente, por favor hazlo manualmente.')
                          )
                        );
                      }}
                      activeOpacity={0.85}>
                      <Ionicons name="open-outline" size={16} color="#fff" />
                      <Text style={mStyles.macPrimaryBtnText}>Abrir Ajustes Wi-Fi</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[mStyles.macSecondaryBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }, Platform.OS !== 'android' && { width: '100%' }]}
                    onPress={closeMacHelp}
                    activeOpacity={0.8}>
                    <Text style={[mStyles.macSecondaryBtnText, { color: isDark ? '#94a3b8' : '#4b5563' }]}>Cerrar ayuda</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal: Alertas personalizadas */}
      <Modal transparent animationType="none" visible={alertModal.visible} onRequestClose={() => hideAlert()} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => hideAlert()}>
          <View style={mStyles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View style={[
                mStyles.alertCard,
                { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' },
                {
                  opacity: alertAnim,
                  transform: [{ scale: alertAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }]
                }
              ]}>
                <View style={[mStyles.topStripe, { backgroundColor: alertModal.iconColor }]} />
                <View style={mStyles.alertBody}>
                  <View style={[mStyles.iconCircle, { backgroundColor: alertModal.iconColor + '1A' }]}>
                    <Ionicons name={alertModal.icon} size={32} color={alertModal.iconColor} />
                  </View>
                  <Text style={[mStyles.alertTitle, { color: isDark ? '#f1f5f9' : '#111827' }]}>{alertModal.title}</Text>
                  <Text style={[mStyles.alertMessage, { color: isDark ? '#94a3b8' : '#4b5563' }]}>{alertModal.message}</Text>
                  <View style={mStyles.alertActions}>
                    {alertModal.actions.map((action, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          mStyles.alertBtn,
                          i === 0 ? { backgroundColor: alertModal.iconColor } : { backgroundColor: isDark ? '#334155' : '#f1f5f9' }
                        ]}
                        onPress={() => hideAlert(action.onPress)}
                        activeOpacity={0.85}>
                        <Text style={[mStyles.alertBtnText, i !== 0 && { color: isDark ? '#94a3b8' : '#4b5563' }]}>
                          {action.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
};

// ─── Paletas ──────────────────────────────────────────────────────────────────
const light = {
  bg:                 '#ffffff',
  card:               '#f9fafb',
  modalBg:            '#ffffff',
  avatarBg:           '#e2e8f0',
  textPrimary:        '#1f2937',
  textSecondary:      '#4b5563',
  textMuted:          '#9ca3af',
  sectionLabel:       '#94a3b8',
  iconColor:          '#4b5563',
  iconCircleBg:       '#f1f5f9',
  inputBg:            '#ffffff',
  inputBorder:        '#e5e7eb',
  inputReadonlyBg:    '#f3f4f6',
  inputReadonlyBorder:'#d1d5db',
  placeholder:        '#9ca3af',
  divider:            '#f1f5f9',
  accentBlue:         '#2563eb',
  btnSecondaryBg:     '#f1f5f9',
  btnSecondaryText:   '#4b5563',
  btnDisabled:        '#94a3b8',
};

const dark = {
  bg:                 '#0f172a',
  card:               '#1e293b',
  modalBg:            '#1e293b',
  avatarBg:           '#334155',
  textPrimary:        '#ffffff',
  textSecondary:      '#94a3b8',
  textMuted:          '#94a3b8',
  sectionLabel:       '#ffffff',
  iconColor:          '#94a3b8',
  iconCircleBg:       '#334155',
  inputBg:            '#0f172a',
  inputBorder:        '#334155',
  inputReadonlyBg:    '#0f172a',
  inputReadonlyBorder:'#334155',
  placeholder:        '#475569',
  divider:            '#1e293b',
  accentBlue:         '#3b82f6',
  btnSecondaryBg:     '#1e293b',
  btnSecondaryText:   '#94a3b8',
  btnDisabled:        '#334155',
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 14,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
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
    borderRadius: 22,
    paddingVertical: 4,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  settingIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  settingValue: {
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 34,
  },
  input: {
    flex: 1,
    height: 34,
    fontSize: 13,
    paddingVertical: 0,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  helpText: {
    fontSize: 10,
    marginLeft: 2,
  },
  validatingText: {
    fontSize: 10,
    marginLeft: 2,
  },
  validationMessage: {
    fontSize: 10,
    marginLeft: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  retryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeModalButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 300,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  macFormatNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
  },
  macFormatText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  modalActions: {
    gap: 10,
    marginTop: 10,
  },
  modalPrimaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalSecondaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

// ─── Estilos de modales premium ───────────────────────────────────────────────
const mStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topStripe: {
    height: 4,
    width: '100%',
  },

  // ── MAC Help Modal ──
  macCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  macHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNum: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formatNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  formatText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  macActions: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    width: '100%',
  },
  macPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  macPrimaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  macSecondaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  macSecondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Alert Modal ──
  alertCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  alertBody: {
    padding: 28,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  alertActions: {
    width: '100%',
    gap: 10,
  },
  alertBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});