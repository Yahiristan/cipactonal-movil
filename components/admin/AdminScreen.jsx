import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal } from
'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UsuariosCredencialesScreen } from './UsuariosCredencialesScreen';

export const AdminScreen = ({ userData, darkMode }) => {
  const [subScreen, setSubScreen] = useState(null);

  const styles = darkMode ? adminStylesDark : adminStyles;

  if (subScreen === 'credenciales') {
    return (
      <UsuariosCredencialesScreen
        userData={userData}
        darkMode={darkMode}
        onBack={() => setSubScreen(null)} />);


  }

  return (
    <View style={styles.container}>
      
            {}
            <View style={styles.body}>
                <Text style={styles.sectionLabel}>Gestión</Text>

                <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => setSubScreen('credenciales')}>
          
                    <View style={styles.cardLeft}>
                        <View style={styles.iconWrap}>
                            <Ionicons name="finger-print" size={28} color={darkMode ? '#60a5fa' : '#2563eb'} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>Credenciales</Text>
                            <Text style={styles.cardDesc}>
                                Gestiona huellas, facial y PIN de los usuarios
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={darkMode ? '#6b7280' : '#9ca3af'} />
                </TouchableOpacity>
            </View>
        </View>);

};


const adminStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  body: { flex: 1, padding: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#072146',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  iconWrap: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: '#6b7280', lineHeight: 16 }
});


const adminStylesDark = StyleSheet.create({
  ...adminStyles,
  container: { ...adminStyles.container, backgroundColor: '#0f172a' },
  sectionLabel: { ...adminStyles.sectionLabel, color: '#9ca3af' },
  card: { ...adminStyles.card, backgroundColor: '#1f2937' },
  cardTitle: { ...adminStyles.cardTitle, color: '#f9fafb' },
  cardDesc: { ...adminStyles.cardDesc, color: '#9ca3af' }
});