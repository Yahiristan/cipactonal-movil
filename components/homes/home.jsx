import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from 'react-native';
import { RegisterButton } from '../map/RegisterButton';
import NetInfo from '@react-native-community/netinfo';
import sqliteManager from '../../services/offline/sqliteManager.mjs';
import { parsearHorario } from '../../services/horariosService';

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
  const BASE_URL = 'https://9dm7dqf9-3001.usw3.devtunnels.ms';
  const url = `${BASE_URL}${foto.startsWith('/') ? '' : '/'}${foto}`;

  return url;
};

export const HomeScreen = ({ userData, darkMode, onOpenAvisos, onOpenProfile }) => {
  const [token, setToken] = useState(null);
  const [infoHoy, setInfoHoy] = useState(null);
  const [loadingHorario, setLoadingHorario] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const obtenerToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
      }
    };
    obtenerToken();


    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cargarInfoDia = async () => {
      if (!userData?.empleado_id || !userData?.token) {
        setLoadingHorario(false);
        return;
      }

      try {

        const horario = await sqliteManager.getHorario(userData.empleado_id);
        const horarioParsed = parsearHorario(horario);

        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const hoy = new Date();
        const nombreHoy = diasSemana[hoy.getDay()];

        const diaHoy = horarioParsed.find((d) => d.day === nombreHoy);

        if (diaHoy && diaHoy.active && diaHoy.turnos && diaHoy.turnos.length > 0) {

          setInfoHoy({
            trabaja: true,
            totalTurnos: diaHoy.turnos.length
          });
        } else {
          setInfoHoy({ trabaja: false, totalTurnos: 0 });
        }
      } catch (error) {
        setInfoHoy(null);
      } finally {
        setLoadingHorario(false);
      }
    };

    cargarInfoDia();
  }, [userData]);

  const styles = darkMode ? homeStylesDark : homeStyles;
  const fotoUrl = userData.foto ? obtenerUrlFotoPerfil(userData.foto) : null;

  const esEmpleado = userData.es_empleado && userData.empleado_id;
  const tipoUsuario = esEmpleado ? 'Empleado' : 'Usuario';


  const getNombreDia = () => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date().getDay()];
  };

  const handleRegistroExitoso = () => {

  };

  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={darkMode ? "#1e40af" : "#2563eb"} />

      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={[styles.headerLeft, { marginRight: 24 }]}>
              <TouchableOpacity style={styles.avatarContainer} onPress={onOpenProfile} activeOpacity={0.8}>
                {fotoUrl ?
                  <Image
                    source={{ uri: fotoUrl }}
                    style={styles.avatarImage} /> :


                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={26} color="#FFFF" />
                  </View>
                }
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? '#10b981' : '#9ca3af' }]
                } />
              </TouchableOpacity>

              <View style={[styles.headerInfo, { flexShrink: 1, overflow: 'hidden' }]}>
                <Text style={styles.headerGreeting} numberOfLines={1} ellipsizeMode="tail">{obtenerSaludo()}</Text>
                <Text style={styles.headerName} numberOfLines={1} ellipsizeMode="tail">{userData.nombre}</Text>
              </View>
            </View>

            { }
            <TouchableOpacity
              onPress={onOpenAvisos}
              style={styles.notifyButton}
              activeOpacity={0.7}>

              <Ionicons name="notifications-outline" size={26} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {esEmpleado &&
          <View style={styles.infoBloques}>
            { }
            <View style={styles.infoBloque}>
              <View style={[styles.infoBloqueIcon, { backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' }]}>
                <Ionicons name="calendar-outline" size={18} color={darkMode ? '#60a5fa' : '#2563eb'} />
              </View>
              <Text style={styles.infoBloqueLabel}>Hoy es</Text>
              <Text style={styles.infoBloqueValue} numberOfLines={1} adjustsFontSizeToFit>{getNombreDia()}</Text>
            </View>

            { }
            <View style={styles.infoBloque}>
              <View style={[
                styles.infoBloqueIcon,
                { backgroundColor: isConnected ? darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5' : darkMode ? 'rgba(156, 163, 175, 0.2)' : '#f3f4f6' }]
              }>
                <Ionicons
                  name={isConnected ? "wifi" : "cloud-offline-outline"}
                  size={18}
                  color={isConnected ? darkMode ? '#34d399' : '#059669' : darkMode ? '#9ca3af' : '#6b7280'} />
              </View>
              <Text style={styles.infoBloqueLabel}>Estado</Text>
              <Text style={[
                styles.infoBloqueValue,
                { color: isConnected ? darkMode ? '#34d399' : '#059669' : darkMode ? '#9ca3af' : '#6b7280' }]
              } numberOfLines={1} adjustsFontSizeToFit>
                {isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>

            { }
            <View style={styles.infoBloque}>
              <View style={[styles.infoBloqueIcon, { backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
                <Ionicons name="layers-outline" size={18} color={darkMode ? '#fbbf24' : '#d97706'} />
              </View>
              <Text style={styles.infoBloqueLabel}>Turnos</Text>
              <Text style={styles.infoBloqueValue} numberOfLines={1} adjustsFontSizeToFit>
                {loadingHorario ? '...' : infoHoy?.totalTurnos || 0}
              </Text>
            </View>
          </View>
        }

        { }
        {esEmpleado &&
          <RegisterButton
            userData={userData}
            darkMode={darkMode}
            onRegistroExitoso={handleRegistroExitoso} />

        }
      </ScrollView>
    </View>);

};

const homeStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  headerWrapper: {
    backgroundColor: '#2563eb'
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: Platform.OS === 'android' ? 16 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f1f5f9',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#2563eb'
  },
  headerInfo: {
    flex: 1
  },
  headerGreeting: {
    fontSize: 13,
    color: '#e0f2fe',
    fontWeight: '500'
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
    marginBottom: 4,
    letterSpacing: -0.3
  },
  userTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4
  },
  userTypeText: {
    fontSize: 11,
    color: '#e0f2fe',
    fontWeight: '600'
  },
  notifyButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 100
  },


  infoBloques: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20
  },
  infoBloque: {
    flex: 1,
    flexBasis: 0,
    height: 115,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  infoBloqueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  infoBloqueLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  infoBloqueValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.2
  }
});

const homeStylesDark = StyleSheet.create({
  ...homeStyles,
  mainContainer: {
    ...homeStyles.mainContainer,
    backgroundColor: '#0f172a'
  },
  headerWrapper: {
    ...homeStyles.headerWrapper,
    backgroundColor: '#1e40af'
  },
  header: {
    ...homeStyles.header,
    backgroundColor: '#1e40af'
  },
  statusDot: {
    ...homeStyles.statusDot,
    borderColor: '#1e40af'
  },
  infoBloque: {
    ...homeStyles.infoBloque,
    backgroundColor: '#1f2937'
  },
  infoBloqueValue: {
    ...homeStyles.infoBloqueValue,
    color: '#f9fafb'
  }
});