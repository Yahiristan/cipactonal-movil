import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createIncidencia } from '../../services/incidenciasService';
import sqliteManager from '../../services/offline/sqliteManager.mjs';
import syncManager from '../../services/offline/syncManager.mjs';
import { creationIncidentStyles, creationIncidentStylesDark } from './creationIncidentStyles';
import { Header } from '../ui/Header';

export const CreationIncidentScreen = ({ visible, onClose, onSuccess, userData, darkMode }) => {
    const insets = useSafeAreaInsets();
    const [creando, setCreando] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [motivo, setMotivo] = useState('');
    const [fechaInicio, setFechaInicio] = useState(new Date());
    const [fechaFin, setFechaFin] = useState(new Date(new Date().getTime() + 86400000));
    const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
    const [showDatePickerFin, setShowDatePickerFin] = useState(false);
    const [modalTipoVisible, setModalTipoVisible] = useState(false);

    const styles = darkMode ? creationIncidentStylesDark : creationIncidentStyles;

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const tiposIncidencia = [
        { value: 'retardo', label: 'Retardo', icon: 'time', color: '#f59e0b' },
        { value: 'justificante', label: 'Justificante', icon: 'document-text', color: '#3b82f6' },
        { value: 'permiso', label: 'Permiso', icon: 'calendar', color: '#8b5cf6' },
        { value: 'vacaciones', label: 'Vacaciones', icon: 'airplane', color: '#10b981' }
    ];

    const getTipoIcon = (tipo) => {
        const tipoObj = tiposIncidencia.find((t) => t.value === tipo);
        return tipoObj?.icon || 'document';
    };

    const getTipoColor = (tipo) => {
        const tipoObj = tiposIncidencia.find((t) => t.value === tipo);
        return tipoObj?.color || '#6b7280';
    };

    const calcularDiasDiferencia = (inicio, fin) => {
        const start = new Date(inicio);
        start.setHours(0, 0, 0, 0);
        const end = new Date(fin);
        end.setHours(0, 0, 0, 0);

        const timeDiff = Math.abs(end.getTime() - start.getTime());
        return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
    };

    const handleCrearIncidencia = async () => {
        if (creando) return;

        if (!tipoSeleccionado) {
            Alert.alert('Error', 'Selecciona un tipo de incidencia');
            return;
        }

        if (!motivo.trim()) {
            Alert.alert('Error', 'Ingresa el motivo de la incidencia');
            return;
        }

        if (!fechaFin) {
            Alert.alert('Error', 'La fecha de fin es obligatoria');
            return;
        }

        if (fechaFin < fechaInicio) {
            Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
            return;
        }

        try {
            setCreando(true);

            const incidenciaData = {
                empleado_id: userData.empleado_id,
                tipo: tipoSeleccionado,
                motivo: motivo.trim(),
                fecha_inicio: fechaInicio.toISOString(),
                fecha_fin: fechaFin.toISOString()
            };

            const online = await syncManager.isOnline() && !syncManager.getIsBackendDown();
            let creadaOnline = false;

            if (online && userData.token) {
                try {
                    await createIncidencia(incidenciaData, userData.token);
                    creadaOnline = true;
                } catch (e) {
                    console.warn('Error creando incidencia online, guardando offline:', e.message);
                }
            }

            if (!creadaOnline) {
                // Guardar offline
                await sqliteManager.saveOfflineIncidencia(incidenciaData);

                Alert.alert(
                    'Modo Offline',
                    'No hay conexión con el servidor. Tu incidencia se ha guardado localmente y se enviará cuando recuperes la conexión.',
                    [{ text: 'Entendido' }]
                );
            } else {
                Alert.alert(
                    '¡Éxito!',
                    'Incidencia creada correctamente. Está pendiente de aprobación.',
                    [{ text: 'OK' }]
                );
            }

            // Reiniciar estado interno
            setTipoSeleccionado('');
            setMotivo('');
            setFechaInicio(new Date());
            setFechaFin(new Date(new Date().getTime() + 86400000));

            onSuccess(); // Cierra y refresca
        } catch (error) {
            console.error('Error creando incidencia:', error);
            Alert.alert('Error', error.message || 'No se pudo crear la incidencia');
        } finally {
            setCreando(false);
        }
    };

    return (
        <>
            {/* Modal Selector de Tipo */}
            {modalTipoVisible && (
                <Modal
                    visible={modalTipoVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalTipoVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        activeOpacity={1}
                        onPress={() => setModalTipoVisible(false)}
                    />
                    <View style={{
                        backgroundColor: darkMode ? '#1e293b' : '#fff',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingBottom: 32,
                    }}>
                        <View style={{
                            width: 40, height: 4,
                            backgroundColor: darkMode ? '#475569' : '#d1d5db',
                            borderRadius: 2,
                            alignSelf: 'center',
                            marginTop: 12, marginBottom: 8,
                        }} />
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: darkMode ? '#334155' : '#f3f4f6',
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: darkMode ? '#f1f5f9' : '#1f2937' }}>
                                Tipo de Incidencia
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalTipoVisible(false)}
                                style={{
                                    width: 36, height: 36, borderRadius: 18,
                                    backgroundColor: darkMode ? '#334155' : '#f3f4f6',
                                    justifyContent: 'center', alignItems: 'center',
                                }}>
                                <Ionicons name="close" size={20} color={darkMode ? '#94a3b8' : '#6b7280'} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 16 }}>
                            {tiposIncidencia.map((tipo) => (
                                <TouchableOpacity
                                    key={tipo.value}
                                    style={[
                                        styles.tipoOption,
                                        tipoSeleccionado === tipo.value && styles.tipoOptionActive,
                                    ]}
                                    onPress={() => {
                                        setTipoSeleccionado(tipo.value);
                                        setModalTipoVisible(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.tipoOptionLeft}>
                                        <View style={[styles.tipoIconSmall, { backgroundColor: `${tipo.color}20` }]}>
                                            <Ionicons name={tipo.icon} size={20} color={tipo.color} />
                                        </View>
                                        <Text style={[styles.tipoOptionLabel, tipoSeleccionado === tipo.value && { color: '#2563eb' }]}>
                                            {tipo.label}
                                        </Text>
                                    </View>
                                    {tipoSeleccionado === tipo.value && (
                                        <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
            )}

            {/* Modal Principal de Creación */}
            <Modal
                visible={visible}
                animationType="slide"
                transparent={false}
                onRequestClose={onClose}>

                <View style={styles.container}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}>

                        <View style={{ flex: 1 }}>
                            <View style={{ paddingTop: insets.top }}>
                                <Header
                                    darkMode={darkMode}
                                    title="Nueva Incidencia"
                                    leftComponent={
                                        <TouchableOpacity onPress={onClose} style={{ padding: 8, marginLeft: -8 }} activeOpacity={0.6}>
                                            <Ionicons name="close" size={28} color={darkMode ? '#f8fafc' : '#0f172a'} />
                                        </TouchableOpacity>
                                    }
                                />
                            </View>

                            <ScrollView
                                style={styles.modalBody}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 100 }}>

                                {/* Selector de Tipo */}
                                <Text style={styles.sectionLabel}>Tipo de Incidencia</Text>
                                <View style={styles.sectionContainer}>
                                    <TouchableOpacity
                                        style={styles.settingItem}
                                        onPress={() => setModalTipoVisible(true)}
                                        activeOpacity={0.7}>

                                        <View style={styles.settingItemLeft}>
                                            <Ionicons
                                                name={tipoSeleccionado ? getTipoIcon(tipoSeleccionado) : 'list'}
                                                size={20}
                                                color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.settingItemTitle}>
                                                {tipoSeleccionado ? tiposIncidencia.find((t) => t.value === tipoSeleccionado)?.label : 'Selecciona el tipo'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                                    </TouchableOpacity>
                                </View>

                                {/* Fechas */}
                                <Text style={styles.sectionLabel}>Período</Text>
                                <View style={styles.sectionContainer}>

                                    <TouchableOpacity style={styles.settingItem} onPress={() => {
                                        if (Platform.OS === 'ios') {
                                            setShowDatePickerFin(false);
                                            setShowDatePickerInicio(!showDatePickerInicio);
                                        } else {
                                            setShowDatePickerInicio(true);
                                        }
                                    }} activeOpacity={0.7}>
                                        <View style={styles.settingItemLeft}>
                                            <Ionicons name="calendar-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.settingItemTitle}>Fecha de inicio</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.settingItemValue}>
                                                {fechaInicio.getDate()} {monthNames[fechaInicio.getMonth()].substring(0, 3)} {fechaInicio.getFullYear()}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.divider} />

                                    <TouchableOpacity style={styles.settingItem} onPress={() => {
                                        if (Platform.OS === 'ios') {
                                            setShowDatePickerInicio(false);
                                            setShowDatePickerFin(!showDatePickerFin);
                                        } else {
                                            setShowDatePickerFin(true);
                                        }
                                    }} activeOpacity={0.7}>
                                        <View style={styles.settingItemLeft}>
                                            <Ionicons name="calendar-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.settingItemTitle}>Fecha de fin</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.settingItemValue}>
                                                {fechaFin.getDate()} {monthNames[fechaFin.getMonth()].substring(0, 3)} {fechaFin.getFullYear()}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.divider} />

                                    <View style={styles.settingItem}>
                                        <View style={styles.settingItemLeft}>
                                            <Ionicons name="time-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.settingItemTitle}>Duración total</Text>
                                        </View>
                                        <Text style={styles.settingItemValue}>
                                            {calcularDiasDiferencia(fechaInicio, fechaFin)} {calcularDiasDiferencia(fechaInicio, fechaFin) === 1 ? 'día' : 'días'}
                                        </Text>
                                    </View>

                                    {showDatePickerInicio && Platform.OS === 'ios' && (
                                        <View style={styles.datePickerInline}>
                                            <DateTimePicker
                                                value={fechaInicio}
                                                mode="date"
                                                display="compact"
                                                onChange={(event, selectedDate) => {
                                                    if (selectedDate) {
                                                        setFechaInicio(selectedDate);
                                                        if (fechaFin < selectedDate) {
                                                            setFechaFin(new Date(selectedDate.getTime() + 86400000));
                                                        }
                                                    }
                                                    setShowDatePickerInicio(false);
                                                }}
                                                style={{ alignSelf: 'center' }} />
                                        </View>
                                    )}

                                    {showDatePickerFin && Platform.OS === 'ios' && (
                                        <View style={styles.datePickerInline}>
                                            <DateTimePicker
                                                value={fechaFin}
                                                mode="date"
                                                display="compact"
                                                minimumDate={fechaInicio}
                                                onChange={(event, selectedDate) => {
                                                    if (selectedDate) {
                                                        setFechaFin(selectedDate);
                                                    }
                                                    setShowDatePickerFin(false);
                                                }}
                                                style={{ alignSelf: 'center' }} />
                                        </View>
                                    )}

                                    {Platform.OS === 'android' && showDatePickerInicio && (
                                        <DateTimePicker
                                            value={fechaInicio}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowDatePickerInicio(false);
                                                if (selectedDate) {
                                                    setFechaInicio(selectedDate);
                                                    if (fechaFin < selectedDate) {
                                                        setFechaFin(new Date(selectedDate.getTime() + 86400000));
                                                    }
                                                }
                                            }} />
                                    )}

                                    {Platform.OS === 'android' && showDatePickerFin && (
                                        <DateTimePicker
                                            value={fechaFin}
                                            mode="date"
                                            display="default"
                                            minimumDate={fechaInicio}
                                            onChange={(event, selectedDate) => {
                                                setShowDatePickerFin(false);
                                                if (selectedDate) {
                                                    setFechaFin(selectedDate);
                                                }
                                            }} />
                                    )}
                                </View>

                                {/* Motivo */}
                                <Text style={styles.sectionLabel}>Motivo de la Incidencia</Text>
                                <View style={styles.sectionContainer}>
                                    <View style={styles.motivoHeader}>
                                            <Ionicons name="document-text-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.motivoPlaceholder}>
                                                {motivo.length > 0 ? `${motivo.length} caracteres` : 'Describe el motivo'}
                                            </Text>
                                        </View>
                                        <TextInput
                                            style={styles.motivoInput}
                                            placeholder="Escribe aquí el motivo detallado de tu incidencia..."
                                            placeholderTextColor="#9ca3af"
                                            value={motivo}
                                            onChangeText={setMotivo}
                                            multiline={true}
                                            textAlignVertical="top"
                                            scrollEnabled={true}
                                            returnKeyType="default"
                                            blurOnSubmit={false}
                                            autoCorrect={true}
                                            spellCheck={true} />
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.cancelButtonModal}
                                    onPress={onClose}
                                    activeOpacity={0.7}>
                                    <Text style={styles.cancelButtonModalText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.createButton,
                                        (!tipoSeleccionado || !motivo.trim()) && styles.createButtonDisabled
                                    ]}
                                    onPress={handleCrearIncidencia}
                                    disabled={creando || !tipoSeleccionado || !motivo.trim()}
                                    activeOpacity={0.7}>

                                    {creando ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.createButtonText}>Crear Incidencia</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
};
