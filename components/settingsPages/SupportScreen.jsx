import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
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
import { Header } from '../ui/Header';

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
        


        <Header
          darkMode={darkMode}
          title="Ayuda y Soporte"
          leftComponent={
            <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
              <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>
          }
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </View>);

  }

  return (
    <View style={styles.container}>
      


      <Header
        darkMode={darkMode}
        title="Ayuda y Soporte"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Contácta a la empresa</Text>
        <View style={styles.sectionContainer}>
          {contactOptions.length > 0 ? (
            contactOptions.map((option, index) => (
              <View key={option.id}>
                <TouchableOpacity style={styles.settingItem} onPress={option.action} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <Ionicons name={option.icon} size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>{option.title}</Text>
                      <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
                {index < contactOptions.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          ) : (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={20} color="#f59e0b" style={styles.settingIcon} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: '#f59e0b' }]}>Sin información de contacto</Text>
                  <Text style={styles.settingSubtitle}>Consulta a tu administrador.</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Preguntas Frecuentes</Text>
        <View style={styles.sectionContainer}>
          {faqs.map((faq, index) => (
            <View key={faq.id}>
              <TouchableOpacity style={styles.settingItem} onPress={() => toggleFaq(faq.id)} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <Ionicons name={faq.icon || "help-circle-outline"} size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{faq.pregunta}</Text>
                    {expandedFaq === faq.id && (
                      <Text style={[styles.settingSubtitle, { marginTop: 6 }]}>{faq.respuesta}</Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name={expandedFaq === faq.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
              {index < faqs.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
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
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 20
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16
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
  loadingText: {
    ...supportStyles.loadingText,
    color: '#9ca3af'
  },
  sectionContainer: {
    ...supportStyles.sectionContainer,
    backgroundColor: '#1e293b',
    borderWidth: 0
  },
  settingTitle: {
    ...supportStyles.settingTitle,
    color: '#f9fafb'
  },
  settingSubtitle: {
    ...supportStyles.settingSubtitle,
    color: '#9ca3af'
  },
  divider: {
    ...supportStyles.divider,
    backgroundColor: '#334155'
  }
});

export default SupportScreen;