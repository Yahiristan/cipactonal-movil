import React, { useState } from 'react';
import getApiEndpoint from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image } from
'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../ui/Header';

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

export const PersonalInfoScreen = ({ userData, darkMode, onBack }) => {

  const styles = darkMode ? personalInfoStylesDark : personalInfoStyles;

  const [expandirDeptos, setExpandirDeptos] = useState(false);
  const [expandirRoles, setExpandirRoles] = useState(false);

  const fotoUrl = userData.foto ? obtenerUrlFotoPerfil(userData.foto) : null;

  const esEmpleado = userData.es_empleado && userData.empleado_id;
  const empleadoInfo = userData.empleadoInfo || null;
  const roles = userData.roles || [];

  const rolMostrar = esEmpleado ?
  'Empleado' :
  roles.length > 0 ? roles[0].nombre : userData.esAdmin ? 'Administrador' : 'Usuario';

  const departamentos = empleadoInfo?.departamentos || [];


  const InfoRow = ({ icon, label, value, valueColor, showDivider = true }) => (
    <View>
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name={icon} size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
          <Text style={styles.settingTitle}>{label}</Text>
        </View>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, valueColor && { color: valueColor }]}>
            {value || 'No disponible'}
          </Text>
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );


  return (
    <View style={styles.container}>
      
      

      {}
      <Header
        darkMode={darkMode}
        title="Mi Perfil"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileCard}>
          <View style={styles.profileGradient}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {fotoUrl ?
                <Image source={{ uri: fotoUrl }} style={styles.avatarImage} /> :

                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#fff" />
                  </View>
                }
                <View style={[styles.statusIndicator, { backgroundColor: '#10b981' }]} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{userData.nombre}</Text>
                <Text style={styles.profileUsername} numberOfLines={1}>{userData.correo || 'No registrado'}</Text>
              </View>
            </View>
          </View>
        </View>

        {}
        <Text style={styles.sectionLabel}>Información Personal</Text>
        <View style={styles.sectionContainer}>
          <InfoRow icon="person-outline" label="Usuario" value={userData.usuario} />
          <InfoRow icon="mail-outline" label="Email" value={userData.correo} />
          <InfoRow icon="call-outline" label="Teléfono" value={userData.telefono || 'No registrado'} showDivider={false} />
        </View>

        {}
        {esEmpleado && (
          <View>
            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Datos Laborales</Text>
            <View style={styles.sectionContainer}>
              <InfoRow
                icon="document-text-outline"
                label="RFC"
                value={userData.rfc || empleadoInfo?.rfc || 'No registrado'}
              />
              <InfoRow
                icon="shield-outline"
                label="NSS"
                value={userData.nss || empleadoInfo?.nss || 'No registrado'}
                showDivider={departamentos.length > 0 || roles.length > 0}
              />
          

            {}
            {departamentos.length > 0 && (
              <View>
                <TouchableOpacity style={styles.settingItem} onPress={() => setExpandirDeptos(!expandirDeptos)} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="business-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                    <Text style={styles.settingTitle}>Departamentos</Text>
                  </View>
                  <Ionicons name={expandirDeptos ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
                </TouchableOpacity>
                {expandirDeptos && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                    {departamentos.map((depto, idx) => (
                      <Text key={idx} style={[styles.settingSubtitle, { marginTop: idx > 0 ? 8 : 0 }]}>
                        {depto.nombre}
                      </Text>
                    ))}
                  </View>
                )}
                {roles.length > 0 && <View style={styles.divider} />}
              </View>
            )}

            {}
            {roles.length > 0 && (
              <View>
                <TouchableOpacity style={styles.settingItem} onPress={() => setExpandirRoles(!expandirRoles)} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                    <Text style={styles.settingTitle}>Roles</Text>
                  </View>
                  <Ionicons name={expandirRoles ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
                </TouchableOpacity>
                {expandirRoles && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                    {roles.map((rol, idx) => (
                      <Text key={idx} style={[styles.settingSubtitle, { marginTop: idx > 0 ? 8 : 0 }]}>
                        {rol.nombre}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>);

};


const personalInfoStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100
  },
  profileCard: {
    borderRadius: 24,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9'
  },
  profileGradient: {
    padding: 20
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9'
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff'
  },
  profileInfo: {
    flex: 1
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4
  },
  profileUsername: {
    fontSize: 14,
    color: '#6b7280'
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
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937'
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'right'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937'
  }
});

const personalInfoStylesDark = StyleSheet.create({
  ...personalInfoStyles,
  container: {
    ...personalInfoStyles.container,
    backgroundColor: '#0f172a'
  },
  profileCard: {
    ...personalInfoStyles.profileCard,
    backgroundColor: '#1e293b',
    borderWidth: 0
  },
  profileName: {
    ...personalInfoStyles.profileName,
    color: '#f9fafb'
  },
  profileUsername: {
    ...personalInfoStyles.profileUsername,
    color: '#9ca3af'
  },
  sectionContainer: {
    ...personalInfoStyles.sectionContainer,
    backgroundColor: '#1e293b',
    borderWidth: 0
  },
  settingTitle: {
    ...personalInfoStyles.settingTitle,
    color: '#f9fafb'
  },
  settingSubtitle: {
    ...personalInfoStyles.settingSubtitle,
    color: '#9ca3af'
  },
  settingValue: {
    ...personalInfoStyles.settingValue,
    color: '#9ca3af'
  },
  divider: {
    ...personalInfoStyles.divider,
    backgroundColor: '#334155'
  },
  actionText: {
    ...personalInfoStyles.actionText,
    color: '#f9fafb'
  }
});