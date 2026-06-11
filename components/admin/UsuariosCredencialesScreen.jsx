




import React, { useState, useEffect, useMemo } from 'react';
import getApiEndpoint from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmpleados } from '../../services/empleadoServices';
import { AdminCredencialesScreen } from './AdminCredencialesScreen';
import syncManager from '../../services/offline/syncManager.mjs';
import { Header } from '../ui/Header';

const BASE_URL = getApiEndpoint('');

const fotoUrl = (foto) => {
  if (!foto) return null;
  if (foto.startsWith('data:') || foto.startsWith('http')) return foto;
  return `${BASE_URL}${foto.startsWith('/') ? '' : '/'}${foto}`;
};

const Avatar = ({ nombre, foto, size = 44 }) => {
  const url = fotoUrl(foto);
  const initials = nombre ?
    nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() :
    '?';

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#e5e7eb' }} />);


  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center'
      }}>

      <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: '#2563eb' }}>{initials}</Text>
    </View>);

};

export const UsuariosCredencialesScreen = ({ userData, darkMode, onBack }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const styles = darkMode ? darkStyles : lightStyles;

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      setError(null);

      if (syncManager.getIsBackendDown()) {
        setError('Servidor no disponible por el momento. No se pueden cargar empleados en modo offline.');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      const res = await getEmpleados(token);
      setEmpleados(res.data || []);
    } catch (e) {
      setError('No se pudieron cargar los empleados. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter(
      (e) =>
        e.nombre?.toLowerCase().includes(q) ||
        e.correo?.toLowerCase().includes(q) ||
        e.rfc?.toLowerCase().includes(q)
    );
  }, [busqueda, empleados]);

  if (usuarioSeleccionado) {
    return (
      <AdminCredencialesScreen
        empleado={usuarioSeleccionado}
        userData={userData}
        darkMode={darkMode}
        onBack={() => setUsuarioSeleccionado(null)} />);


  }

  return (
    <View style={styles.container}>



      {/* Header unificado */}
      <Header
        darkMode={darkMode}
        title="Credenciales"
        subtitle="Selecciona un usuario"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={cargarEmpleados} style={{ padding: 8, marginRight: -8 }}>
            <Ionicons name="refresh" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
      />

      { }
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={darkMode ? '#9ca3af' : '#6b7280'} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, correo o RFC..."
          placeholderTextColor={darkMode ? '#6b7280' : '#9ca3af'}
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false} />

        {busqueda.length > 0 &&
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color={darkMode ? '#6b7280' : '#9ca3af'} />
          </TouchableOpacity>
        }
      </View>

      { }
      {loading ?
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando empleados...</Text>
        </View> :
        error ?
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color={darkMode ? '#4b5563' : '#d1d5db'} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={cargarEmpleados}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View> :

          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>

            {filtrados.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="people-outline" size={48} color={darkMode ? '#4b5563' : '#d1d5db'} />
                <Text style={styles.emptyText}>
                  {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay empleados registrados'}
                </Text>
              </View>
            ) : (
              <View style={styles.sectionContainer}>
                {filtrados.map((item, index) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.settingItem}
                      activeOpacity={0.7}
                      onPress={() => setUsuarioSeleccionado(item)}>

                      <View style={styles.settingLeft}>
                        <Avatar nombre={item.nombre} foto={item.foto} size={40} />
                        <View style={styles.userInfo}>
                          <Text style={styles.userName} numberOfLines={1}>{item.nombre}</Text>
                          <Text style={styles.userEmail} numberOfLines={1}>{item.correo}</Text>
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={darkMode ? '#6b7280' : '#9ca3af'} />
                    </TouchableOpacity>
                    {index < filtrados.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
      }
    </View>
  );

};


const base = StyleSheet.create({
  listContent: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 80 },
  container: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#072146',
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 12
  },
  sectionContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
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
    gap: 14,
    flex: 1
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 54
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  userEmail: { fontSize: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: 'center', maxWidth: 260 },
  emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 240 },
  retryBtn: {
    backgroundColor: '#2563eb', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14 }
});

const lightStyles = StyleSheet.create({
  ...base,
  container: { ...base.container, backgroundColor: '#f8fafc' },
  searchWrap: { ...base.searchWrap, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  searchInput: { ...base.searchInput, color: '#111827' },
  sectionContainer: { ...base.sectionContainer, backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  sectionLabel: { ...base.sectionLabel, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 12 },
  divider: { ...base.divider, backgroundColor: '#e2e8f0' },
  userName: { ...base.userName, color: '#111827' },
  userEmail: { ...base.userEmail, color: '#6b7280' },
  loadingText: { ...base.loadingText, color: '#6b7280' },
  errorText: { ...base.errorText, color: '#6b7280' },
  emptyText: { ...base.emptyText, color: '#9ca3af' }
});

const darkStyles = StyleSheet.create({
  ...base,
  container: { ...base.container, backgroundColor: '#0f172a' },
  searchWrap: { ...base.searchWrap, backgroundColor: '#1f2937' },
  searchInput: { ...base.searchInput, color: '#f9fafb' },
  sectionContainer: { ...base.sectionContainer, backgroundColor: '#1e293b', borderWidth: 0 },
  sectionLabel: { ...base.sectionLabel, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 12 },
  divider: { ...base.divider, backgroundColor: '#334155' },
  userName: { ...base.userName, color: '#f9fafb' },
  userEmail: { ...base.userEmail, color: '#9ca3af' },
  loadingText: { ...base.loadingText, color: '#9ca3af' },
  errorText: { ...base.errorText, color: '#9ca3af' },
  emptyText: { ...base.emptyText, color: '#6b7280' }
});