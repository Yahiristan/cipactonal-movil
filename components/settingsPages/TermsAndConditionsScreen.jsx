import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../ui/Header';

const TERMS_ACCEPTED_KEY = '@terms_accepted';

export const TermsAndConditionsScreen = ({ darkMode, onBack }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);


  useEffect(() => {
    const cargarEstado = async () => {
      try {
        const savedState = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
        if (savedState === 'true') {
          setAcceptedTerms(true);
        }
      } catch (error) {
      }
    };
    cargarEstado();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const onAccept = async () => {
    try {
      await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
      setAcceptedTerms(true);
    } catch (error) {
    }
    onBack();
  };

  const onDecline = async () => {
    try {
      await AsyncStorage.removeItem(TERMS_ACCEPTED_KEY);
      setAcceptedTerms(false);
    } catch (error) {
    }
    BackHandler.exitApp();
  };

  const styles = darkMode ? termsStylesDark : termsStyles;

  const sections = [
  {
    id: 'acceptance',
    icon: 'checkmark-circle-outline',
    color: '#10b981',
    bg: '#d1fae5',
    title: 'Aceptación de Términos',
    content: 'Al utilizar esta aplicación de control de asistencia, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la aplicación.'
  },
  {
    id: 'data',
    icon: 'shield-checkmark-outline',
    color: '#3b82f6',
    bg: '#dbeafe',
    title: 'Recopilación de Datos',
    content: 'La aplicación recopila información necesaria para el control de asistencia laboral, incluyendo:\n\n• Datos de identificación del empleado\n• Registros de entrada y salida\n• Ubicación geográfica durante el registro (cuando aplique)\n• Fotografías para verificación de identidad\n• Información de horarios laborales\n\nTodos los datos son tratados conforme a la legislación vigente de protección de datos personales.'
  },
  {
    id: 'usage',
    icon: 'phone-portrait-outline',
    color: '#8b5cf6',
    bg: '#ede9fe',
    title: 'Uso de la Aplicación',
    content: 'Usted se compromete a:\n\n• Utilizar la aplicación únicamente para registrar su propia asistencia\n• No compartir sus credenciales de acceso\n• Mantener la información de su cuenta segura\n• No intentar vulnerar los sistemas de seguridad\n• Reportar cualquier mal funcionamiento o error\n\nEl uso indebido de la aplicación puede resultar en la suspensión de acceso y sanciones laborales.'
  },
  {
    id: 'location',
    icon: 'location-outline',
    color: '#ef4444',
    bg: '#fee2e2',
    title: 'Servicios de Ubicación',
    content: 'La aplicación puede solicitar acceso a su ubicación geográfica para:\n\n• Verificar que el registro se realiza desde ubicaciones autorizadas\n• Generar reportes de asistencia con datos de ubicación\n• Cumplir con requisitos de auditoría laboral\n\nPuede desactivar los servicios de ubicación en la configuración de su dispositivo, aunque esto puede limitar algunas funcionalidades.'
  },
  {
    id: 'privacy',
    icon: 'lock-closed-outline',
    color: '#f59e0b',
    bg: '#fef3c7',
    title: 'Privacidad y Seguridad',
    content: 'Nos comprometemos a:\n\n• Proteger su información personal con medidas de seguridad apropiadas\n• No compartir sus datos con terceros sin su consentimiento\n• Utilizar la información únicamente para fines laborales autorizados\n• Mantener la confidencialidad de sus registros\n• Cumplir con todas las leyes de protección de datos aplicables'
  },
  {
    id: 'photos',
    icon: 'camera-outline',
    color: '#06b6d4',
    bg: '#cffafe',
    title: 'Uso de Fotografías',
    content: 'Las fotografías capturadas durante el registro de asistencia:\n\n• Se utilizan exclusivamente para verificación de identidad\n• Son almacenadas de forma segura en nuestros servidores\n• No serán compartidas públicamente ni con terceros no autorizados\n• Pueden ser revisadas por personal de recursos humanos\n• Serán eliminadas conforme a las políticas de retención de datos'
  },
  {
    id: 'modifications',
    icon: 'create-outline',
    color: '#ec4899',
    bg: '#fce7f3',
    title: 'Modificaciones',
    content: 'Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios significativos serán notificados a través de la aplicación. El uso continuado de la aplicación después de las modificaciones constituye la aceptación de los nuevos términos.'
  },
  {
    id: 'liability',
    icon: 'warning-outline',
    color: '#f97316',
    bg: '#ffedd5',
    title: 'Limitación de Responsabilidad',
    content: 'La empresa no será responsable por:\n\n• Pérdida de datos debido a fallas técnicas\n• Interrupciones en el servicio por mantenimiento\n• Problemas de conectividad del dispositivo\n• Uso no autorizado de credenciales por terceros\n\nLa aplicación se proporciona "tal cual" sin garantías de ningún tipo.'
  },
  {
    id: 'rights',
    icon: 'person-outline',
    color: '#6366f1',
    bg: '#e0e7ff',
    title: 'Derechos del Usuario',
    content: 'Como usuario, tiene derecho a:\n\n• Acceder a sus datos personales almacenados\n• Solicitar corrección de información incorrecta\n• Solicitar la eliminación de sus datos (conforme a políticas de retención)\n• Recibir una copia de su información\n• Presentar quejas ante autoridades de protección de datos\n\nPara ejercer estos derechos, contacte a recursos humanos.'
  },
  {
    id: 'contact',
    icon: 'mail-outline',
    color: '#5c9c42',
    bg: '#ccfbf1',
    title: 'Contacto',
    content: 'Para cualquier queja o sugerencia de la aplicación, puede contactar al grupo FASITLAC'
  }];


  return (
    <View style={styles.container}>
      
      
      
      {}
      <Header
        darkMode={darkMode}
        title="Términos y condiciones"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        
        <View style={styles.sectionContainer}>
          {sections.map((section, index) => (
            <View key={section.id}>
              <TouchableOpacity style={styles.settingItem} onPress={() => toggleSection(section.id)} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <Ionicons name={section.icon} size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{section.title}</Text>
                    {expandedSections[section.id] && (
                      <Text style={[styles.settingSubtitle, { marginTop: 8 }]}>{section.content}</Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name={expandedSections[section.id] ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
              {index < sections.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Botones de acción o estado de aceptado */}
        {!acceptedTerms ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.85}>
              
              <View style={styles.buttonGradient}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.buttonTitle}>Aceptar y Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
              activeOpacity={0.7}>
              
              <View style={styles.declineContent}>
                <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
                <Text style={styles.declineButtonText}>Rechazar</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <View style={[styles.acceptButton, { backgroundColor: '#10b981', opacity: 0.9 }]}>
              <View style={styles.buttonGradient}>
                <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
                <Text style={styles.buttonTitle}>Términos Aceptados</Text>
              </View>
            </View>
          </View>
        )}

        {}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al aceptar estos términos, confirma que ha leído y comprendido todos los puntos mencionados.
          </Text>
        </View>
      </ScrollView>
    </View>);

};

const termsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120
  },
  sectionContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 20
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16
  },

  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
    gap: 12
  },
  acceptButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2563eb',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10
  },
  buttonTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3
  },

  declineButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    overflow: 'hidden'
  },
  declineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10
  },
  declineButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700'
  },
  footer: {
    padding: 16,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center'
  }
});

const termsStylesDark = StyleSheet.create({
  ...termsStyles,
  container: {
    ...termsStyles.container,
    backgroundColor: '#0f172a'
  },
  sectionContainer: {
    ...termsStyles.sectionContainer,
    backgroundColor: '#1e293b',
    borderWidth: 0
  },
  settingTitle: {
    ...termsStyles.settingTitle,
    color: '#f9fafb'
  },
  settingSubtitle: {
    ...termsStyles.settingSubtitle,
    color: '#d1d5db'
  },
  divider: {
    ...termsStyles.divider,
    backgroundColor: '#334155'
  },

  declineButton: {
    ...termsStyles.declineButton,
    backgroundColor: '#0f172a',
    borderColor: '#ef4444'
  },
  declineButtonText: {
    ...termsStyles.declineButtonText,
    color: '#ef4444'
  },
  footer: {
    ...termsStyles.footer
  },
  footerText: {
    ...termsStyles.footerText,
    color: '#94a3b8'
  }
});

export default TermsAndConditionsScreen;