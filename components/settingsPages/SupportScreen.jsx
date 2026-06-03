import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMiEmpresa } from '../../services/empresaService';
import sqliteManager from '../../services/offline/sqliteManager.mjs';
import syncManager from '../../services/offline/syncManager.mjs';
import getApiEndpoint from '../../config/api.js';

const obtenerUrlLogo = (logo) => {
  if (!logo) {
    return null;
  }
  if (logo.startsWith('data:image/')) {
    return logo;
  }
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }
  const cleanPath = logo.startsWith('/') ? logo.substring(1) : logo;
  return getApiEndpoint(`/${cleanPath}`);
};

export const SupportScreen = ({ darkMode, onBack, userData }) => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [empresaData, setEmpresaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const styles = darkMode ? supportStylesDark : supportStyles;

  useEffect(() => {
    cargarDatosEmpresa();
  }, []);

  const cargarDatosEmpresa = async () => {
    try {
      setIsLoading(true);

      const empresaId = userData?.empresa_id ||
        userData?.empresa?.id ||
        userData?.empleado?.empresa_id ||
        null;

      if (!empresaId) {
        setIsLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('userToken');


      let cargoOnline = false;
      if (token && !syncManager.getIsBackendDown()) {
        try {
          const response = await getMiEmpresa(token);
          if (response.success && response.data) {
            setEmpresaData(response.data);
            cargoOnline = true;

            await sqliteManager.upsertEmpresa(response.data).catch((e) =>
              function () { }('️ No se pudo cachear empresa:', e.message)
            );
          }
        } catch (e) {
          (function () { })('️ No se pudo cargar empresa online:', e.message);
        }
      }


      if (!cargoOnline) {
        try {
          const empresaLocal = await sqliteManager.getEmpresaLocal(empresaId);
          if (empresaLocal) {
            setEmpresaData(empresaLocal);
            (function () { })(' [Offline] Empresa cargada desde caché local');
          }
        } catch (e) {
          (function () { })('️ Error cargando empresa desde SQLite:', e.message);
        }
      }

    } catch (error) {
      (function () { })('Error en cargarDatosEmpresa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const faqs = [
    {
      id: 1,
      pregunta: "¿Cómo registro mi entrada?",
      respuesta: "Para registrar tu entrada, ve a la pantalla de Inicio y asegurate que el boton indique Registrar Entrada. Asegúrate de tener tu GPS activo a la app, estar dentro de una area permitida, estar dentro del horario permitido y tener una credencial de autentificación registrada.",
      icon: "log-in"
    },
    {
      id: 2,
      pregunta: "¿Por qué no funciona mi ubicación?",
      respuesta: "Verifica que tengas el GPS activado en tu dispositivo. También asegúrate de que la app tenga permisos de ubicación.",
      icon: "location"
    },
    {
      id: 3,
      pregunta: "¿Como configuro el metodo de autentificacion?",
      respuesta: "Contácta algun personal administrativo y solicitale que te asigne una credencial de autentificación.",
      icon: "scan"
    },
    {
      id: 4,
      pregunta: "¿Cómo veo mi historial de registros?",
      respuesta: "Ve a la opcion de Historial para ver todos tus registros de entrada y salida.",
      icon: "time"
    },
    {
      id: 5,
      pregunta: "La app se cierra inesperadamente",
      respuesta: "Intenta cerrar completamente la app y volver a abrirla. Si el problema persiste, verifica que tengas la última versión instalada o contacta a FASITLAC.",
      icon: "alert-circle"
    }];


  const getContactOptions = () => {
    const options = [];

    if (empresaData?.telefono) {
      const phoneClean = empresaData.telefono.replace(/[\s()-]/g, '');

      options.push({
        id: 1,
        title: "WhatsApp",
        subtitle: `Chat con ${empresaData.nombre || 'Soporte'}`,
        displayPhone: empresaData.telefono,
        icon: "logo-whatsapp",
        color: "#25D366",
        action: async () => {
          const message = `Hola, soy ${userData?.nombre || 'Usuario'}, necesito ayuda con la App de Asistencia.`;
          // En Android 11+, canOpenURL para 'whatsapp://' falla si no está en el AndroidManifest.
          // La forma más robusta es probar el protocolo y hacer fallback al enlace web.
          const waProtocol = `whatsapp://send?phone=${phoneClean}&text=${encodeURIComponent(message)}`;
          const waWeb = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;

          try {
            await Linking.openURL(waProtocol);
          } catch (e) {
            try {
              await Linking.openURL(waWeb);
            } catch (fallbackError) {
              Alert.alert(
                "WhatsApp no disponible",
                "No se pudo abrir WhatsApp en este dispositivo. Verifica que lo tengas instalado."
              );
            }
          }
        }
      });
    }

    if (empresaData?.correo) {
      options.push({
        id: 2,
        title: "Correo Electrónico",
        subtitle: empresaData.correo,
        icon: "mail",
        color: "#2563eb",
        action: () => {
          const subject = `Solicitud de Soporte - ${empresaData.nombre || 'App Asistencia'}`;
          const body = `Hola,\n\nSoy ${userData?.nombre || 'Usuario'} (${userData?.correo || 'correo@ejemplo.com'}).\n\nNecesito ayuda con:\n\n`;
          const url = `mailto:${empresaData.correo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

          Linking.openURL(url).catch(() => {
            Alert.alert("Error", "No se pudo abrir el cliente de correo");
          });
        }
      });
    }

    if (empresaData?.telefono) {
      const phoneClean = empresaData.telefono.replace(/[\s()-]/g, '');

      options.push({
        id: 3,
        title: "Teléfono",
        subtitle: empresaData.telefono,
        icon: "call",
        color: "#3b82f6",
        action: () => {
          Alert.alert(
            "Llamar a Soporte",
            `¿Deseas llamar a ${empresaData.telefono}?`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Llamar",
                onPress: () => {
                  Linking.openURL(`tel:${phoneClean}`).catch(() => {
                    Alert.alert("Error", "No se pudo realizar la llamada");
                  });
                }
              }]

          );
        }
      });
    }

    return options;
  };

  const contactOptions = getContactOptions();

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={darkMode ? "#1e40af" : "#2563eb"} />


        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
              <Text style={styles.headerSubtitle}>Cargando...</Text>
            </View>
            <View style={styles.headerPlaceholder} />
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </View>);

  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={darkMode ? "#1e40af" : "#2563eb"} />


      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
            <Text style={styles.headerSubtitle}>
              {empresaData?.nombre || 'Estamos aquí'}
            </Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.quickHelpSection}>
          <View style={styles.quickHelpIconContainer}>
            {empresaData?.logo ?
              <Image
                source={{ uri: obtenerUrlLogo(empresaData.logo) }}
                style={styles.empresaLogo}
                resizeMode="contain" /> :
              <Ionicons
                name="help-circle"
                size={48}
                color={darkMode ? '#93c5fd' : '#2563eb'} />
            }
          </View>
          <Text style={[styles.quickHelpTitle, { color: darkMode ? '#f9fafb' : '#1f2937' }]}>
            ¿Necesitas ayuda inmediata?
          </Text>
          <Text style={styles.quickHelpText}>
            Encuentra respuestas rápidas en nuestras preguntas frecuentes o contáctanos directamente.
          </Text>
        </View>

        {contactOptions.length > 0 ?
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contácta a la empresa</Text>
            </View>

            {contactOptions.map((option, index) =>
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.listItem,
                  index === contactOptions.length - 1 && styles.listItemLast]
                }
                onPress={option.action}
                activeOpacity={0.7}>
                <Ionicons name={option.icon} size={24} color={darkMode ? '#60a5fa' : '#2563eb'} style={{ marginRight: 16 }} />
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={darkMode ? '#4b5563' : '#9ca3af'} />
              </TouchableOpacity>
            )}
          </View> :

          <View style={styles.listSection}>
            <View style={styles.noContactCard}>
              <Ionicons name="information-circle" size={48} color="#f59e0b" />
              <Text style={styles.noContactTitle}>
                Información de contacto no disponible
              </Text>
              <Text style={styles.noContactText}>
                Consulta las preguntas frecuentes o contacta a tu administrador.
              </Text>
            </View>
          </View>
        }

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          </View>

          {faqs.map((faq, index) =>
            <TouchableOpacity
              key={faq.id}
              style={[
                styles.faqItem,
                index === faqs.length - 1 && styles.faqItemLast]
              }
              onPress={() => toggleFaq(faq.id)}
              activeOpacity={0.7}>
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, expandedFaq === faq.id && styles.faqQuestionActive]}>{faq.pregunta}</Text>
                <Ionicons
                  name={expandedFaq === faq.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={darkMode ? '#4b5563' : '#9ca3af'} />
              </View>

              {expandedFaq === faq.id &&
                <View style={styles.faqAnswerContainer}>
                  <Text style={styles.faqAnswer}>{faq.respuesta}</Text>
                </View>
              }
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>);

};

const supportStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: Platform.OS === 'android' ? 16 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 2
  },
  headerPlaceholder: {
    width: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90
  },
  quickHelpSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16
  },
  quickHelpIconContainer: {
    marginBottom: 16
  },
  empresaLogo: {
    width: 60,
    height: 60
  },
  quickHelpTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center'
  },
  quickHelpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22
  },
  listSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  listItemLast: {
  },
  contactTextContainer: {
    flex: 1
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6b7280'
  },
  noContactCard: {
    padding: 32,
    alignItems: 'center'
  },
  noContactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center'
  },
  noContactText: {
    fontSize: 14,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 20
  },
  faqItem: {
    paddingVertical: 14,
    paddingHorizontal: 20
  },
  faqItemLast: {
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    paddingRight: 16
  },
  faqQuestionActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingRight: 32
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22
  },
  bottomSpacer: {
    height: 100
  }
});

const supportStylesDark = StyleSheet.create({
  ...supportStyles,
  container: {
    ...supportStyles.container,
    backgroundColor: '#0f172a'
  },
  header: {
    ...supportStyles.header,
    backgroundColor: '#1e40af'
  },
  loadingText: {
    ...supportStyles.loadingText,
    color: '#9ca3af'
  },
  quickHelpSection: {
    ...supportStyles.quickHelpSection,
    backgroundColor: '#1e293b'
  },
  quickHelpTitle: {
    ...supportStyles.quickHelpTitle,
    color: '#f9fafb'
  },
  quickHelpText: {
    ...supportStyles.quickHelpText,
    color: '#9ca3af'
  },
  listSection: {
    ...supportStyles.listSection,
    backgroundColor: '#1e293b'
  },
  sectionHeader: {
    ...supportStyles.sectionHeader
  },
  sectionTitle: {
    ...supportStyles.sectionTitle,
    color: '#60a5fa'
  },
  listItem: {
    ...supportStyles.listItem
  },
  contactTitle: {
    ...supportStyles.contactTitle,
    color: '#f9fafb'
  },
  contactSubtitle: {
    ...supportStyles.contactSubtitle,
    color: '#9ca3af'
  },
  faqItem: {
    ...supportStyles.faqItem
  },
  faqQuestion: {
    ...supportStyles.faqQuestion,
    color: '#f9fafb'
  },
  faqQuestionActive: {
    ...supportStyles.faqQuestionActive,
    color: '#60a5fa'
  },
  faqAnswer: {
    ...supportStyles.faqAnswer,
    color: '#d1d5db'
  }
});

export default SupportScreen;