import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  useColorScheme,
  ScrollView
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? dark : light;
  const welcome = WELCOME_CONFIG;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
        <View style={[styles.header, { backgroundColor: t.bg, paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
          <View style={[styles.profileCard, { backgroundColor: t.card }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: t.avatarBg }]}>
              <Image source={require('../../assets/icon.png')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: t.textPrimary }]} numberOfLines={2}>{welcome.title}</Text>
              <Text style={[styles.profileEmail, { color: t.textSecondary }]} numberOfLines={2}>{welcome.subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Pasos de Configuración</Text>
          <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
            {welcome.steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                      <Ionicons name={step.icon} size={20} color={t.iconColor} />
                    </View>
                    <View style={stepContent}>
                      <Text style={[styles.settingTitle, { color: t.textPrimary }]}>{step.title}</Text>
                      <Text style={[styles.settingValue, { color: t.textMuted }]}>{step.description}</Text>
                    </View>
                  </View>
                  <View style={[styles.stepBadge, { backgroundColor: t.badgeBg }]}>
                    <Text style={[styles.stepBadgeText, { color: t.textPrimary }]}>{step.number}</Text>
                  </View>
                </View>
                {index < welcome.steps.length - 1 && <View style={[styles.divider, { backgroundColor: t.divider }]} />}
              </React.Fragment>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Información</Text>
          <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={20} color={t.iconColor} style={styles.settingIcon} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.settingValue, { marginRight: 0, lineHeight: 18, color: t.textMuted }]}>{welcome.note}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.bg, paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: t.btnSecondaryBg }]}
            onPress={onCancel}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={t.btnSecondaryText} />
            <Text style={[styles.backButtonText, { color: t.btnSecondaryText }]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: t.accent }]}
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

// ─── Paletas ──────────────────────────────────────────────────────────────────
const light = {
  bg:               '#ffffff',
  card:             '#f9fafb',
  avatarBg:         '#e2e8f0',
  textPrimary:      '#1f2937',
  textSecondary:    '#64748b',
  textMuted:        '#9ca3af',
  sectionLabel:     '#94a3b8',
  iconColor:        '#4b5563',
  iconCircleBg:     '#e2e8f0',
  badgeBg:          '#e2e8f0',
  divider:          '#f1f5f9',
  accent:           '#2563eb',
  btnSecondaryBg:   '#f1f5f9',
  btnSecondaryText: '#4b5563',
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
  badgeBg:          '#334155',
  divider:          '#1e293b',
  accent:           '#3b82f6',
  btnSecondaryBg:   '#1e293b',
  btnSecondaryText: '#94a3b8',
};

// ─── Estilos (layout sin color) ───────────────────────────────────────────────
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
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
    paddingRight: 10,
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
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});