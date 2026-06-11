import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Image,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import getApiEndpoint from '../../config/api.js';

const obtenerUrlLogo = (logo) => {
  if (!logo) return null;
  if (logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://')) return logo;
  const cleanPath = logo.startsWith('/') ? logo.substring(1) : logo;
  return getApiEndpoint(`/${cleanPath}`);
};

const EmpresaCard = ({ item, index, onSelect, darkMode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.settingItem}
        activeOpacity={0.7}
        onPress={() => onSelect(item.empresa_id)}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.avatarWrap, darkMode && styles.avatarWrapDark]}>
            {item.logo ? (
              <Image
                source={{ uri: obtenerUrlLogo(item.logo) }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarInitials, darkMode && { color: '#f9fafb' }]}>
                {item.nombre.substring(0, 2).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={[styles.companyName, darkMode && styles.textWhite]} numberOfLines={2}>
              {item.nombre}
            </Text>
            <Text style={[styles.actionSubtitle, darkMode && styles.textMuted]}>Toca para ingresar</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SeleccionEmpresaScreen = ({ empresasList, onSelect, onCancel, darkMode }) => {
  const empresasOrdenadas = [...(empresasList || [])].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={onCancel} style={[styles.backBtnWrapper, darkMode && styles.backBtnWrapperDark]} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={darkMode ? '#f9fafb' : '#1f2937'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>Empresas</Text>
        </View>

        {/* Body */}
        <View style={styles.bodySection}>
          <Text style={[styles.welcomeText, darkMode && styles.textWhite]}>¡Hola!</Text>
          <Text style={[styles.instructionText, darkMode && styles.textMuted]}>
            Selecciona el perfil empresarial con el que deseas acceder.
          </Text>

          <View style={[styles.sectionContainer, darkMode && styles.sectionContainerDark]}>
            <FlatList
              data={empresasOrdenadas}
              keyExtractor={(item) => item.empresa_id.toString()}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={[styles.divider, darkMode && styles.dividerDark]} />}
              renderItem={({ item, index }) => (
                <EmpresaCard item={item} index={index} onSelect={onSelect} darkMode={darkMode} />
              )}
            />
          </View>

          {/* Footer cancel button independent section like settings logout */}
          <View style={[styles.sectionContainer, darkMode && styles.sectionContainerDark, { marginTop: 10 }]}>
            <TouchableOpacity style={styles.settingItem} onPress={onCancel} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <Ionicons name="close-circle-outline" size={22} color="#ef4444" style={{ marginRight: 14 }} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444', letterSpacing: -0.2 }}>Cancelar operación</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  containerDark: {
    backgroundColor: '#0f172a'
  },
  headerNav: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  backBtnWrapperDark: {
    backgroundColor: '#1e293b'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 16,
    letterSpacing: -0.3
  },
  bodySection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: -0.5
  },
  instructionText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 24
  },
  textWhite: { color: '#f9fafb' },
  textMuted: { color: '#9ca3af' },

  sectionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 20
  },
  sectionContainerDark: {
    backgroundColor: '#1e293b'
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
  
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  avatarWrapDark: {
    backgroundColor: '#334155'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4b5563'
  },
  
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.2,
    marginBottom: 2
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500'
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16
  },
  dividerDark: {
    backgroundColor: '#334155'
  }
});