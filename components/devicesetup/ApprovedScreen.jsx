import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ApprovedScreen = ({ email, empresaNombre, deviceInfo, onComplete }) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? dark : light;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.bg, paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 8 }]}>
        <View style={[styles.profileCard, { backgroundColor: t.card }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#064e3b' : '#d1fae5' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.textPrimary }]} numberOfLines={1}>¡Aprobado!</Text>
            <Text style={[styles.profileEmail, { color: t.textSecondary }]} numberOfLines={1}>Configuración Completada</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true}>
        <View style={styles.content}>
          <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Detalles de la vinculación</Text>
          <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="business-outline" size={20} color="#10b981" style={styles.settingIcon} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.settingTitle, { color: t.textPrimary }]}>Empresa</Text>
                  <Text style={[styles.settingValue, { color: t.textMuted }]}>{empresaNombre || 'Empresa vinculada'}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: t.divider }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={20} color="#10b981" style={styles.settingIcon} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.settingTitle, { color: t.textPrimary }]}>Correo Verificado</Text>
                  <Text style={[styles.settingValue, { color: t.textMuted }]}>{email}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: t.divider }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color="#10b981" style={styles.settingIcon} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.settingTitle, { color: t.textPrimary }]}>Dispositivo</Text>
                  <Text style={[styles.settingValue, { color: t.textMuted }]}>{deviceInfo?.model || 'Dispositivo móvil'}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: t.sectionLabel }]}>Información</Text>
          <View style={[styles.sectionContainer, { backgroundColor: t.card }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={20} color={t.iconColor} style={styles.settingIcon} />
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.settingValue, { lineHeight: 18, color: t.textMuted }]}>Tu dispositivo ha sido vinculado exitosamente y está listo para usarse.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.bg, paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: isDark ? '#3b82f6' : '#2563eb' }]}
          onPress={onComplete}
          activeOpacity={0.7}>
          <Text style={styles.startButtonText}>Comenzar a Usar</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Paletas ──────────────────────────────────────────────────────────────────
const light = {
  bg:            '#ffffff',
  card:          '#f9fafb',
  textPrimary:   '#1f2937',
  textSecondary: '#64748b',
  textMuted:     '#9ca3af',
  sectionLabel:  '#94a3b8',
  iconColor:     '#4b5563',
  divider:       '#f1f5f9',
};

const dark = {
  bg:            '#0f172a',
  card:          '#1e293b',
  textPrimary:   '#ffffff',
  textSecondary: '#94a3b8',
  textMuted:     '#94a3b8',
  sectionLabel:  '#ffffff',
  iconColor:     '#94a3b8',
  divider:       '#1e293b',
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
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  startButton: {
    borderRadius: 24,
    padding: 16,
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