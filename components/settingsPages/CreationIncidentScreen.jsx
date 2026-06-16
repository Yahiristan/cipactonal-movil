import React, { useState, useRef } from 'react';
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
    Animated,
    TouchableWithoutFeedback,
    StyleSheet,
    Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { createIncidencia } from '../../services/incidenciasService';
import sqliteManager from '../../services/offline/sqliteManager.mjs';
import syncManager from '../../services/offline/syncManager.mjs';
import { creationIncidentStyles, creationIncidentStylesDark } from './creationIncidentStyles';
import { Header } from '../ui/Header';

export const CreationIncidentScreen = ({ visible, onClose, onSuccess, userData, darkMode }) => {
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);
    const [creando, setCreando] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [motivo, setMotivo] = useState('');
    const [fechaInicio, setFechaInicio] = useState(new Date());
    const [fechaFin, setFechaFin] = useState(new Date(new Date().getTime() + 86400000));
    const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
    const [showDatePickerFin, setShowDatePickerFin] = useState(false);
    const [modalTipoVisible, setModalTipoVisible] = useState(false);
    const [archivos, setArchivos] = useState([]);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const [alertModal, setAlertModal] = useState({ visible: false, icon: 'alert-circle', iconColor: '#ef4444', title: '', message: '', actions: [] });
    const alertAnim = useRef(new Animated.Value(0)).current;

    const showCustomAlert = (title, message, actions = [{ text: 'OK', onPress: null }]) => {
        let icon = 'information-circle';
        let iconColor = '#2563eb';
        const lowerTitle = title.toLowerCase();

        if (lowerTitle.includes('error') || lowerTitle.includes('fall') || lowerTitle.includes('insuficiente') || lowerTitle.includes('bloqueo') || lowerTitle.includes('sin acceso') || lowerTitle.includes('no disponible') || lowerTitle.includes('no verificada') || lowerTitle.includes('obligatoria') || lowerTitle.includes('posterior') || lowerTitle.includes('selecciona') || lowerTitle.includes('ingresa')) {
            icon = 'alert-circle';
            iconColor = '#ef4444';
        } else if (lowerTitle.includes('éxito') || lowerTitle.includes('exitoso') || lowerTitle.includes('completada') || lowerTitle.includes('correcto') || lowerTitle.includes('correctamente')) {
            icon = 'checkmark-circle-outline';
            iconColor = '#10b981';
        } else if (lowerTitle.includes('aviso') || lowerTitle.includes('pendiente') || lowerTitle.includes('festivo') || lowerTitle.includes('requerida') || lowerTitle.includes('seguridad') || lowerTitle.includes('offline') || lowerTitle.includes('omitido') || lowerTitle.includes('supera')) {
            icon = 'warning-outline';
            iconColor = '#f59e0b';
        }

        setAlertModal({ visible: true, icon, iconColor, title, message, actions });
        Animated.spring(alertAnim, { toValue: 1, tension: 120, friction: 12, useNativeDriver: true }).start();
    };

    const hideCustomAlert = (cb) => {
        Animated.timing(alertAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setAlertModal(prev => ({ ...prev, visible: false }));
            if (typeof cb === 'function') cb();
        });
    };

    const handleSelectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: false,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                if (file.size && file.size > 5 * 1024 * 1024) {
                    showCustomAlert('Archivo omitido', `El archivo ${file.name} supera los 5MB.`);
                    return;
                }
                const nuevoArchivo = {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
                };

                setArchivos([nuevoArchivo]); // Guarda únicamente este archivo
            }
        } catch (error) {
            console.error('Error al seleccionar archivo:', error);
            showCustomAlert('Error', 'Hubo un problema al seleccionar el archivo.');
        }
    };

    const removeArchivo = (index) => {
        setArchivos(prev => prev.filter((_, i) => i !== index));
    };

    const styles = darkMode ? creationIncidentStylesDark : creationIncidentStyles;

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const tiposIncidencia = [
        { value: 'retardo', label: 'Retardo', icon: 'time-outline', color: '#f59e0b' },
        { value: 'justificante', label: 'Justificante', icon: 'document-text-outline', color: '#3b82f6' },
        { value: 'permiso', label: 'Permiso', icon: 'calendar-outline', color: '#8b5cf6' },
        { value: 'vacaciones', label: 'Vacaciones', icon: 'airplane-outline', color: '#10b981' }
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
            showCustomAlert('Error', 'Selecciona un tipo de incidencia');
            return;
        }

        if (!motivo.trim()) {
            showCustomAlert('Error', 'Ingresa el motivo de la incidencia');
            return;
        }

        if (motivo.length > 250) {
            showCustomAlert('Error', 'El motivo de la incidencia no debe exceder los 250 caracteres');
            return;
        }

        if (!fechaFin) {
            showCustomAlert('Error', 'La fecha de fin es obligatoria');
            return;
        }

        if (fechaFin < fechaInicio) {
            showCustomAlert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
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

            if (archivos.length > 0) {
                incidenciaData.archivos = archivos;
            }

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

            const limpiarYRefrescar = () => {
                setTipoSeleccionado('');
                setMotivo('');
                setFechaInicio(new Date());
                setFechaFin(new Date(new Date().getTime() + 86400000));
                setArchivos([]);
                onSuccess(); // Cierra y refresca
            };

            if (!creadaOnline) {
                // Guardar offline
                await sqliteManager.saveOfflineIncidencia(incidenciaData);

                showCustomAlert(
                    'Modo Offline',
                    'No hay conexión con el servidor. Tu incidencia se ha guardado localmente y se enviará cuando recuperes la conexión.',
                    [{ text: 'Entendido', onPress: limpiarYRefrescar }]
                );
            } else {
                showCustomAlert(
                    '¡Éxito!',
                    'Incidencia creada correctamente. Está pendiente de aprobación.',
                    [{ text: 'OK', onPress: limpiarYRefrescar }]
                );
            }
        } catch (error) {
            console.error('Error creando incidencia:', error);
            showCustomAlert('Error', error.message || 'No se pudo crear la incidencia');
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
                                            <Text style={[styles.tipoOptionLabel, tipoSeleccionado === tipo.value && { color: darkMode ? '#60a5fa' : '#2563eb' }]}>
                                                {tipo.label}
                                            </Text>
                                        </View>
                                        {tipoSeleccionado === tipo.value && (
                                            <Ionicons name="checkmark-circle-outline" size={22} color={darkMode ? '#60a5fa' : '#2563eb'} />
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
                presentationStyle="fullScreen"
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
                                ref={scrollViewRef}
                                style={styles.modalBody}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ flexGrow: 1, paddingBottom: isInputFocused ? 120 : 32 }}>

                                {/* Selector de Tipo */}
                                <Text style={styles.sectionLabel}>Tipo de Incidencia</Text>
                                <View style={styles.sectionContainer}>
                                    <TouchableOpacity
                                        style={styles.settingItem}
                                        onPress={() => setModalTipoVisible(true)}
                                        activeOpacity={0.7}>

                                        <View style={styles.settingItemLeft}>
                                            <Ionicons
                                                name="list-outline"
                                                size={20}
                                                color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.settingItemTitle}>Tipo</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            {tipoSeleccionado ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <View style={[styles.tipoIconSmall, { backgroundColor: `${getTipoColor(tipoSeleccionado)}20`, width: 24, height: 24, borderRadius: 6 }]}>
                                                        <Ionicons name={getTipoIcon(tipoSeleccionado)} size={14} color={getTipoColor(tipoSeleccionado)} />
                                                    </View>
                                                    <Text style={[styles.settingItemValue, { color: getTipoColor(tipoSeleccionado) }]}>
                                                        {tiposIncidencia.find((t) => t.value === tipoSeleccionado)?.label}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.settingItemValue}>Selecciona</Text>
                                            )}
                                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                                        </View>
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
                                <View style={[
                                    styles.sectionContainer,
                                    motivo.length > 250 ? styles.sectionContainerError : (motivo.length > 200 ? styles.sectionContainerWarning : null)
                                ]}>
                                    <View style={styles.motivoHeader}>
                                        <Ionicons 
                                            name={motivo.length > 250 ? "warning-outline" : "document-text-outline"} 
                                            size={20} 
                                            color={motivo.length > 250 ? '#ef4444' : (motivo.length > 200 ? '#f59e0b' : (darkMode ? '#9ca3af' : '#4b5563'))} 
                                        />
                                        <Text style={[
                                            styles.motivoPlaceholder,
                                            motivo.length > 250 ? { color: '#ef4444', fontWeight: '700' } : (motivo.length > 200 ? { color: '#f59e0b', fontWeight: '600' } : null)
                                        ]}>
                                            {motivo.length > 0 
                                                ? (motivo.length > 250 
                                                    ? `${motivo.length} / 250 (Excedido)` 
                                                    : `${motivo.length} / 250 caracteres`) 
                                                : 'Describe el motivo'}
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
                                        spellCheck={true}
                                        onContentSizeChange={() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                        }}
                                        onFocus={() => {
                                            setIsInputFocused(true);
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollToEnd({ animated: true });
                                            }, 150);
                                        }}
                                        onBlur={() => {
                                            setIsInputFocused(false);
                                        }} />
                                </View>

                                {/* Evidencia (Archivos) */}
                                <Text style={styles.sectionLabel}>Evidencia</Text>
                                <View style={styles.sectionContainer}>
                                    <TouchableOpacity style={styles.settingItem} onPress={handleSelectFile} activeOpacity={0.7}>
                                        <View style={styles.settingItemLeft}>
                                            <Ionicons name="attach-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} />
                                            <Text style={styles.settingItemTitle}>Adjuntar fotos o PDFs</Text>
                                        </View>
                                        <Ionicons name="add-circle-outline" size={20} color={darkMode ? '#60a5fa' : '#2563eb'} />
                                    </TouchableOpacity>

                                    {archivos.length > 0 && (
                                        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                                            {archivos.map((file, index) => (
                                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: darkMode ? '#334155' : '#f3f4f6', padding: 10, borderRadius: 8, marginTop: 8 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                                                        <Ionicons name={file.type.includes('pdf') ? 'document' : 'image'} size={18} color="#6b7280" />
                                                        <Text style={{ marginLeft: 8, color: darkMode ? '#cbd5e1' : '#4b5563', fontSize: 13, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="middle">
                                                            {file.name}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => removeArchivo(index)} style={{ padding: 4 }}>
                                                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </ScrollView>

                            {isInputFocused && (
                                <View style={[styles.accessoryBar, { backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderTopColor: darkMode ? '#334155' : '#e2e8f0' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                        <Ionicons
                                            name={motivo.length > 250 ? "warning" : "information-circle-outline"}
                                            size={18}
                                            color={motivo.length > 250 ? '#ef4444' : (motivo.length > 200 ? '#f59e0b' : '#3b82f6')}
                                        />
                                        <Text style={[
                                            styles.accessoryText,
                                            motivo.length > 250 ? { color: '#ef4444', fontWeight: '700' } : (motivo.length > 200 ? { color: '#f59e0b', fontWeight: '600' } : { color: darkMode ? '#94a3b8' : '#4b5563' })
                                        ]} numberOfLines={1}>
                                            {motivo.length > 250
                                                ? `Límite excedido (${motivo.length}/250)`
                                                : (motivo.length > 200
                                                    ? `Espacio limitado (${motivo.length}/250)`
                                                    : `Escrito: ${motivo.length} / 250 caracteres`)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => Keyboard.dismiss()}
                                        style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: 8 }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ color: darkMode ? '#60a5fa' : '#2563eb', fontWeight: '700', fontSize: 13 }}>
                                            Hecho
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

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
                                        (!tipoSeleccionado || !motivo.trim() || motivo.length > 250) && styles.createButtonDisabled
                                    ]}
                                    onPress={handleCrearIncidencia}
                                    disabled={creando || !tipoSeleccionado || !motivo.trim() || motivo.length > 250}
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

            {/* Modal de Alerta Custom */}
            <Modal visible={alertModal.visible} transparent animationType="none" onRequestClose={() => hideCustomAlert()}>
                <TouchableWithoutFeedback onPress={() => hideCustomAlert()}>
                    <View style={mStyles.backdrop}>
                        <TouchableWithoutFeedback>
                            <Animated.View style={[
                                mStyles.card,
                                { backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0' },
                                {
                                    opacity: alertAnim,
                                    transform: [{ scale: alertAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }]
                                }
                            ]}>
                                <View style={[mStyles.topStripe, { backgroundColor: alertModal.iconColor }]} />
                                <View style={mStyles.body}>
                                    <View style={[mStyles.iconCircle, { backgroundColor: `${alertModal.iconColor}1A` }]}>
                                        <Ionicons name={alertModal.icon} size={36} color={alertModal.iconColor} />
                                    </View>
                                    <Text style={[mStyles.title, { color: darkMode ? '#f1f5f9' : '#111827' }]}>{alertModal.title}</Text>
                                    <Text style={[mStyles.message, { color: darkMode ? '#94a3b8' : '#4b5563' }]}>{alertModal.message}</Text>

                                    <View style={mStyles.alertActions}>
                                        {alertModal.actions.map((action, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    mStyles.btn,
                                                    action.style === 'cancel' ? { backgroundColor: darkMode ? '#334155' : '#f1f5f9' } : { backgroundColor: alertModal.iconColor }
                                                ]}
                                                onPress={() => {
                                                    hideCustomAlert(() => {
                                                        if (action.onPress) action.onPress();
                                                    });
                                                }}
                                                activeOpacity={0.85}>
                                                <Text style={[
                                                    mStyles.btnText,
                                                    action.style === 'cancel' && { color: darkMode ? '#f1f5f9' : '#111827' }
                                                ]}>
                                                    {action.text}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const mStyles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 16,
    },
    topStripe: {
        height: 4,
        width: '100%',
    },
    body: {
        padding: 28,
        alignItems: 'center',
    },
    iconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        marginTop: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    alertActions: {
        width: '100%',
        gap: 10,
    },
    btn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});
