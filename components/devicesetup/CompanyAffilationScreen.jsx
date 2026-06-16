import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Image,
  Animated,
  useColorScheme,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verificarEmpresa } from '../../services/solicitudMovilService';
import { getEmpresaPublicaById } from '../../services/empresaService';
import NetInfo from '@react-native-community/netinfo';
import syncManager from '../../services/offline/syncManager.mjs';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? dark : light;

  const affiliation = AFFILIATION_CONFIG;
  const [companyCode, setCompanyCode] = useState(initialEmpresaIdentificador || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedCompanyName, setVerifiedCompanyName] = useState('');
  const [verifiedCompanyLogo, setVerifiedCompanyLogo] = useState(initialEmpresaLogo || null);
  const [retryStatus, setRetryStatus] = useState('');

  // Modal personalizado
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ icon: 'alert-circle', iconColor: '#ef4444', title: '', message: '' });
  const modalAnim = useRef(new Animated.Value(0)).current;

  const showModal = (icon, iconColor, title, message) => {
    setModalConfig({ icon, iconColor, title, message });
    setModalVisible(true);
    Animated.spring(modalAnim, { toValue: 1, tension: 120, friction: 12, useNativeDriver: true }).start();
  };

  const hideModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setModalVisible(false));
  };

  const handleSupportPress = () => {
    showModal(
      'headset',
      '#2563eb',
      'Contacto Administrativo',
      'Comunícate con el administrador de tu empresa para obtener tu código de afiliación o recibir asistencia técnica con tu dispositivo.'
    );
  };

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

  const handleNext = async () => {
    const trimmedCode = companyCode.trim();

    if (!trimmedCode) {
      showModal('alert-circle', '#ef4444', 'Campo requerido', 'Por favor ingresa el código de tu empresa.');
      return;
    }

    setIsLoading(true);
    setRetryStatus('');

    const MAX_RETRIES = 8;
    // Delays en ms: 2s, 3s, 4s, 5s, 6s, 7s, 8s entre intentos
    const getDelay = (attempt) => Math.min(2000 + (attempt - 1) * 1000, 8000);

    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
          setRetryStatus(`Intentando conectar... (${attempt}/${MAX_RETRIES})`);
        }

        let currentIp = '127.0.0.1';
        try {
          const netState = await NetInfo.fetch();
          currentIp = netState?.details?.ipAddress || '127.0.0.1';
        } catch (e) {
          // no se pudo obtener la IP local
        }

        const empresaInfo = await verificarEmpresa(trimmedCode, currentIp);

        // Éxito — limpiar estado de reintentos
        setRetryStatus('');

        if (!empresaInfo.existe) {
          showModal('business', '#f59e0b', 'Empresa no encontrada', 'El código de empresa ingresado no existe. Verifica con tu administrador.');
          setIsLoading(false);
          return;
        }

        if (empresaInfo.activa === false) {
          showModal('ban', '#ef4444', 'Empresa Inactiva', 'Esta empresa no está activa en el sistema. Contacta a tu administrador.');
          setIsLoading(false);
          return;
        }

        if (empresaInfo.fueraDeRed) {
          showModal('wifi', '#f59e0b', 'Fuera de Red', 'Tu dispositivo no se encuentra en una red permitida por la empresa. Conéctate a la red Wi-Fi autorizada e inténtalo de nuevo.');
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
          // no se pudo obtener el logo
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

        return; // ✔ Salir del loop

      } catch (error) {
        lastError = error;

        // Si el error NO es de conexión (ej. empresa no encontrada, 404, etc.)
        // no tiene sentido reintentar — mostrar error inmediatamente
        if (!isConnectionError(error)) {
          showModal('alert-circle', '#ef4444', 'Error de verificación', error.message || 'No se pudo verificar el código de empresa.');
          setIsLoading(false);
          setRetryStatus('');
          return;
        }

        // Es un error de conexión — reintentar si quedan intentos
        if (attempt < MAX_RETRIES) {
          const delay = getDelay(attempt);
          setRetryStatus(`Despertando servidor... (${attempt}/${MAX_RETRIES})`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }

    // Todos los intentos fallaron
    setRetryStatus('');
    setIsLoading(false);
    showModal('cloud-offline', '#ef4444', 'Sin conexión', 'No se pudo conectar con el servidor después de varios intentos.\n\nVerifica tu conexión a internet e inténtalo de nuevo.');
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
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.bg, paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <StepIndicator currentStep={1} />
        <View style={[styles.profileCard, { backgroundColor: t.card }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: (verifiedCompanyLogo || initialEmpresaLogo) ? (isDark ? '#1e293b' : '#f8fafc') : t.avatarBg, overflow: 'hidden' }]}>
            {verifiedCompanyLogo || initialEmpresaLogo ? (
              <Image
                source={{ uri: obtenerUrlLogo(verifiedCompanyLogo || initialEmpresaLogo) }}
                style={{ width: '100%', height: '100%', borderRadius: 30, resizeMode: 'cover' }}
              />
            ) : (
              <Ionicons name="business" size={24} color={t.iconColor} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.textPrimary }]} numberOfLines={2}>{affiliation.title}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.content}>
              <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Identificador</Text>
              <View style={[styles.sectionContainer, { backgroundColor: t.card, paddingVertical: 20 }]}>
                <View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'stretch', paddingHorizontal: 24 }]}>

                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isVerified ? (isDark ? '#064e3b' : '#d1fae5') : t.iconCircleBg, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' }}>
                      {isVerified && (verifiedCompanyLogo || initialEmpresaLogo) ? (
                        <Image
                          source={{ uri: obtenerUrlLogo(verifiedCompanyLogo || initialEmpresaLogo) }}
                          style={{ width: '100%', height: '100%', borderRadius: 32, resizeMode: 'cover' }}
                        />
                      ) : (
                        <Ionicons name="business" size={32} color={isVerified ? '#10b981' : t.iconColor} />
                      )}
                    </View>
                    <Text style={{ fontSize: 15, color: t.textSecondary, textAlign: 'center', fontWeight: '500' }}>
                      Ingresa el código único proporcionado por tu empresa
                    </Text>
                  </View>

                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          fontSize: dynamicFontSize,
                          letterSpacing: dynamicLetterSpacing,
                          paddingVertical: 20,
                          paddingRight: initialEmpresaIdentificador && !isVerified ? 52 : 16,
                          borderRadius: 20,
                          backgroundColor: isVerified ? (isDark ? '#064e3b' : '#f0fdf4') : t.inputBg,
                          borderColor: isVerified ? '#10b981' : t.inputBorder,
                          color: t.textPrimary,
                        }
                      ]}
                      placeholder="CÓDIGO"
                      placeholderTextColor={t.placeholder}
                      value={companyCode}
                      onChangeText={(text) => {
                        setCompanyCode(text.replace(/\s/g, ''));
                        setIsVerified(false);
                      }}
                      autoCapitalize="none"
                      editable={!isLoading && !isVerified && !initialEmpresaIdentificador}
                    />
                    {initialEmpresaIdentificador && !isVerified &&
                      <View style={{ position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' }}>
                        <Ionicons name="lock-closed" size={18} color={t.textMuted} />
                      </View>
                    }
                  </View>

                  {isVerified &&
                    <View style={styles.verifiedContainer}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={[styles.verifiedText, { fontSize: 16 }]}>{verifiedCompanyName}</Text>
                    </View>
                  }
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Ayuda</Text>
              <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
                <TouchableOpacity style={styles.settingItem} onPress={handleSupportPress} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="help-circle-outline" size={20} color={t.iconColor} style={styles.settingIcon} />
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[styles.settingTitle, { color: t.textPrimary }]}>{affiliation.helpText}</Text>
                      <Text style={[styles.settingValue, { color: t.accentBlue }]}>{affiliation.supportText}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: t.bg, paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>

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
              { backgroundColor: (isLoading || isVerified) ? t.btnDisabled : t.accentBlue }
            ]}
            onPress={handleNext}
            disabled={isLoading || isVerified}
            activeOpacity={0.7}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.nextButtonText}>{retryStatus ? 'Reintentando...' : 'Verificando...'}</Text>
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

      {/* ── Modal personalizado ─────────────────────────────────────── */}
      <Modal transparent animationType="none" visible={modalVisible} onRequestClose={hideModal} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={hideModal}>
          <View style={mStyles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View style={[
                mStyles.card,
                { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' },
                {
                  opacity: modalAnim,
                  transform: [{ scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }]
                }
              ]}>
                {/* Franja de color superior */}
                <View style={[mStyles.topStripe, { backgroundColor: modalConfig.iconColor }]} />

                <View style={mStyles.body}>
                  {/* Icono */}
                  <View style={[mStyles.iconCircle, { backgroundColor: modalConfig.iconColor + '1A' }]}>
                    <Ionicons name={modalConfig.icon} size={32} color={modalConfig.iconColor} />
                  </View>

                  {/* Título */}
                  <Text style={[mStyles.title, { color: isDark ? '#f1f5f9' : '#111827' }]}>
                    {modalConfig.title}
                  </Text>

                  {/* Mensaje */}
                  <Text style={[mStyles.message, { color: isDark ? '#94a3b8' : '#4b5563' }]}>
                    {modalConfig.message}
                  </Text>

                  {/* Botón cerrar */}
                  <TouchableOpacity
                    style={[mStyles.btn, { backgroundColor: modalConfig.iconColor }]}
                    onPress={hideModal}
                    activeOpacity={0.85}>
                    <Text style={mStyles.btnText}>Entendido</Text>
                  </TouchableOpacity>
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
  bg:               '#ffffff',
  card:             '#f9fafb',
  avatarBg:         '#e2e8f0',
  textPrimary:      '#1f2937',
  textSecondary:    '#4b5563',
  textMuted:        '#9ca3af',
  sectionLabel:     '#94a3b8',
  iconColor:        '#4b5563',
  iconCircleBg:     '#f1f5f9',
  inputBg:          '#ffffff',
  inputBorder:      '#e2e8f0',
  placeholder:      '#cbd5e1',
  accentBlue:       '#2563eb',
  btnSecondaryBg:   '#f1f5f9',
  btnSecondaryText: '#4b5563',
  btnDisabled:      '#94a3b8',
};

const dark = {
  bg:               '#0f172a',
  card:             '#1e293b',
  avatarBg:         '#334155',
  textPrimary:      '#ffffff',
  textSecondary:    '#94a3b8',
  textMuted:        '#94a3b8',
  sectionLabel:     '#ffffff',
  iconColor:        '#94a3b8',
  iconCircleBg:     '#334155',
  inputBg:          '#0f172a',
  inputBorder:      '#334155',
  placeholder:      '#475569',
  accentBlue:       '#3b82f6',
  btnSecondaryBg:   '#1e293b',
  btnSecondaryText: '#94a3b8',
  btnDisabled:      '#334155',
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
  keyboardAvoid: {
    flex: 1,
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
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1.5,
    padding: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  verifiedText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

// ─── Estilos del Modal personalizado ─────────────────────────────────────────
const mStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
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
  topStripe: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});