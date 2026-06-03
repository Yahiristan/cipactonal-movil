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
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay: index * 90, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, delay: index * 90, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.cardBox, darkMode && styles.cardBoxDark]}
        activeOpacity={0.8}
        onPress={() => onSelect(item.empresa_id)}
      >
        <View style={[styles.avatarWrap, darkMode && styles.avatarWrapDark]}>
          {item.logo ? (
            <Image
              source={{ uri: obtenerUrlLogo(item.logo) }}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.avatarInitials, darkMode && { color: '#60a5fa' }]}>
              {item.nombre.substring(0, 2).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={[styles.companyName, darkMode && styles.companyNameDark]} numberOfLines={2}>
            {item.nombre}
          </Text>
          <Text style={[styles.actionSubtitle, darkMode && { color: '#93c5fd' }]}>Toca para ingresar</Text>
        </View>

        <View style={styles.iconCol}>
          <Ionicons name="chevron-forward" size={24} color={darkMode ? '#9ca3af' : '#cbd5e1'} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SeleccionEmpresaScreen = ({ empresasList, onSelect, onCancel, darkMode }) => {
  const empresasOrdenadas = [...(empresasList || [])].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );

  return (
    <View style={[styles.mainWrapper, darkMode && styles.mainWrapperDark]}>
      {/* Header */}
      <View style={[styles.headerBlock, darkMode && styles.headerBlockDark]}>
        <SafeAreaView edges={['top']} style={{ flex: 0 }}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={onCancel} style={styles.backBtnWrapper} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Múltiples empresas</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Body */}
      <View style={[styles.bodySection, darkMode && styles.bodySectionDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.welcomeText, darkMode && styles.textWhite]}>¡Hola!</Text>
          <Text style={[styles.instructionText, darkMode && styles.textMuted]}>
            Por favor, elige el perfil empresarial con el que deseas acceder.
          </Text>
        </View>

        <FlatList
          data={empresasOrdenadas}
          keyExtractor={(item) => item.empresa_id.toString()}
          showsVerticalScrollIndicator={false}
          style={styles.flatListArea}
          contentContainerStyle={styles.listPadding}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item, index }) => (
            <EmpresaCard item={item} index={index} onSelect={onSelect} darkMode={darkMode} />
          )}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={[styles.footerCancelBtn, darkMode && styles.footerCancelBtnDark]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={darkMode ? '#fb7185' : '#e11d48'} />
              <Text style={[styles.footerCancelText, darkMode && { color: '#fb7185' }]}>Cancelar operación</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  mainWrapperDark: {
    backgroundColor: '#111827'
  },
  headerBlock: {
    backgroundColor: '#2563eb',
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10
  },
  headerBlockDark: {
    backgroundColor: '#1e40af'
  },
  headerNav: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtnWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
    letterSpacing: 0.5
  },

  bodySection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  bodySectionDark: {
    backgroundColor: '#111827'
  },
  titleSection: {
    marginBottom: 20,
    paddingHorizontal: 4
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5
  },
  instructionText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '400',
    lineHeight: 22
  },
  textWhite: { color: '#ffffff' },
  textMuted: { color: '#9ca3af' },

  flatListArea: {
    flex: 1,
    overflow: 'visible'
  },
  listPadding: {
    paddingBottom: 40,
    paddingTop: 4
  },

  /* Cards BBVA */
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardBoxDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    shadowColor: '#000'
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarWrapDark: {
    backgroundColor: '#111827',
    borderColor: '#374151'
  },
  avatarImg: {
    width: '70%',
    height: '70%'
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb'
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3
  },
  companyNameDark: {
    color: '#f3f4f6'
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
  },
  iconCol: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  footerCancelBtn: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    gap: 8
  },
  footerCancelBtnDark: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderColor: 'rgba(225, 29, 72, 0.2)'
  },
  footerCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e11d48'
  }
});