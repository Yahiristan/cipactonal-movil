import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PersonalInfoScreen } from './personalinfo';
import { TermsAndConditionsScreen } from './TermsAndConditionsScreen';
import { SupportScreen } from './SupportScreen';
import { SecurityScreen } from './SecurityScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { getApiEndpoint } from '../../services/api';
import appConfig from '../../app.json';

const obtenerUrlFotoPerfil = (foto) => {
  if (!foto) {
    return null;
  }
  if (foto.startsWith('data:image/')) {
    return foto;
  }
  if (foto.startsWith('http://') || foto.startsWith('https://')) {
    return foto;
  }
  const BASE_URL = getApiEndpoint('');
  const url = `${BASE_URL}${foto.startsWith('/') ? '' : '/'}${foto}`;
  return url;
};

export const SettingsScreen = ({
  userData,
  email,
  darkMode,
  onToggleDarkMode,
  onLogout,
  initialSection,
  setNavVisible
}) => {
  const [showPersonalInfo, setShowPersonalInfo] = useState(initialSection === 'personalinfo');
  const [showTerms, setShowTerms] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const styles = darkMode ? settingsStylesDark : settingsStyles;

  const fotoUrl = userData.foto ? obtenerUrlFotoPerfil(userData.foto) : null;
  const emailMostrar = userData.correo || email || 'usuario@correo.com';

  if (showPersonalInfo) return <PersonalInfoScreen userData={userData} darkMode={darkMode} onBack={() => setShowPersonalInfo(false)} />;
  if (showTerms) return <TermsAndConditionsScreen darkMode={darkMode} onBack={() => setShowTerms(false)} />;
  if (showSupport) return <SupportScreen userData={userData} darkMode={darkMode} onBack={() => setShowSupport(false)} />;
  if (showSecurity) return <SecurityScreen darkMode={darkMode} onBack={() => setShowSecurity(false)} userData={userData} />;
  if (showNotifications) return <NotificationsScreen darkMode={darkMode} onBack={() => setShowNotifications(false)} />;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Tarjeta de Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={darkMode ? '#9ca3af' : '#64748b'} />
              </View>
            )}
            <View style={[
              styles.statusIndicator,
              { backgroundColor: '#10b981', borderColor: darkMode ? '#1e293b' : '#f9fafb' }
            ]} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{userData.nombre}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{emailMostrar}</Text>
          </View>
        </View>

        {/* Sección: Cuenta */}
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => setShowPersonalInfo(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Información Personal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowSecurity(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Contraseña y Seguridad</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Sección: Preferencias */}
        <Text style={styles.sectionLabel}>Preferencias</Text>
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => setShowNotifications(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name={darkMode ? "moon-outline" : "sunny-outline"} size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Tema</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{darkMode ? 'Oscuro' : 'Claro'}</Text>
              <Switch
                value={darkMode}
                onValueChange={onToggleDarkMode}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : (darkMode ? '#fff' : '#f3f4f6')}
                style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : {}}
              />
            </View>
          </View>
        </View>

        {/* Sección: Soporte */}
        <Text style={styles.sectionLabel}>Soporte</Text>
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.settingItem} onPress={() => setShowSupport(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Centro de Ayuda</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowTerms(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Términos y Condiciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

        </View>

        {/* Sección: Información */}
        <Text style={styles.sectionLabel}>Información</Text>
        <View style={styles.sectionContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="code-slash-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Versión</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{appConfig.expo.version}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="build-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
              <Text style={styles.settingTitle}>Desarrollador</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>FASITLAC</Text>
            </View>
          </View>
        </View>

        {/* Sección: Cerrar Sesión (Independiente) */}
        <View style={[styles.sectionContainer, { marginTop: 10 }]}>
          <TouchableOpacity style={styles.settingItem} onPress={onLogout} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" style={styles.settingIcon} />
              <Text style={[styles.settingTitle, { color: '#ef4444' }]}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </View>
  );
};

const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 10
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0'
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 2,
    letterSpacing: -0.5
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
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
    marginBottom: 28
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
    alignItems: 'center'
  },
  settingIcon: {
    marginRight: 14
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.2
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingValue: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16
  }
});

const settingsStylesDark = StyleSheet.create({
  ...settingsStyles,
  container: {
    ...settingsStyles.container,
    backgroundColor: '#0f172a'
  },
  profileCard: {
    ...settingsStyles.profileCard,
    backgroundColor: '#1e293b'
  },
  profileName: {
    ...settingsStyles.profileName,
    color: '#f9fafb'
  },
  profileEmail: {
    ...settingsStyles.profileEmail,
    color: '#9ca3af'
  },
  avatarPlaceholder: {
    ...settingsStyles.avatarPlaceholder,
    backgroundColor: '#334155'
  },
  sectionLabel: {
    ...settingsStyles.sectionLabel,
    color: '#64748b'
  },
  sectionContainer: {
    ...settingsStyles.sectionContainer,
    backgroundColor: '#1e293b'
  },
  settingTitle: {
    ...settingsStyles.settingTitle,
    color: '#f9fafb'
  },
  divider: {
    ...settingsStyles.divider,
    backgroundColor: '#334155'
  }
});