import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WELCOME_CONFIG = {
  title: "Afiliación de Dispositivo",
  subtitle: "Vincula tu dispositivo a tu empresa en 3 simples pasos",
  steps: [
    {
      number: 1,
      icon: "business-outline",
      title: "Valida tu empresa",
      description: "Prepara tu código de empresa"
    },
    {
      number: 2,
      icon: "phone-portrait-outline",
      title: "Registra tu Dispositivo",
      description: "Envía la información de tu dispositivo"
    },
    {
      number: 3,
      icon: "checkmark-circle-outline",
      title: "Recibe Aprobación",
      description: "Espera la autorización del administrador"
    }
  ],
  note: "IMPORTANTE: Para el registro, es obligatorio estar conectado a una red Wi-Fi y NO usar datos móviles. Esto garantiza que el sistema recolecte la dirección MAC e IP verdaderas de tu dispositivo."
};

export const WelcomeScreen = ({ onNext, onCancel }) => {
  const insets = useSafeAreaInsets();
  const welcome = WELCOME_CONFIG;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <Image source={require('../../assets/icon.png')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={2}>{welcome.title}</Text>
            <Text style={styles.profileEmail} numberOfLines={2}>{welcome.subtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Pasos de Configuración</Text>
        <View style={styles.sectionContainer}>
          {welcome.steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={step.icon} size={20} color="#4b5563" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.settingTitle}>{step.title}</Text>
                    <Text style={styles.settingValue}>{step.description}</Text>
                  </View>
                </View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step.number}</Text>
                </View>
              </View>
              {index < welcome.steps.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Información</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#4b5563" style={styles.settingIcon} />
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.settingValue, { marginRight: 0, lineHeight: 18 }]}>{welcome.note}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#4b5563" />
            <Text style={styles.backButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startButton}
            onPress={onNext}
            activeOpacity={0.7}>
            <Text style={styles.startButtonText}>Comenzar</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  stepContent: {
    flex: 1,
    paddingRight: 10
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
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepBadgeText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16
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
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563'
  },
  startButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  }
});