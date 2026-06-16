import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Linking,
  Image,
  StatusBar
} from 'react-native';
import { CustomAlert } from '../ui/CustomAlert';
import {
  getIncidenciasEmpleado,
  createIncidencia
} from '../../services/incidenciasService';
import { getApiEndpoint } from '../../config/api';
import { WebView } from 'react-native-webview';



import sqliteManager from '../../services/offline/sqliteManager.mjs';
import syncManager from '../../services/offline/syncManager.mjs';
import { detectarCambiosIncidencias } from '../../services/localNotificationService';
import { incidenciasStyles, incidenciasStylesDark } from './IncidentScreenStyles';
import { CreationIncidentScreen } from './CreationIncidentScreen';
import { Header } from '../ui/Header';

export const IncidenciasScreen = ({ userData, darkMode, onBack }) => {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', actions: [] });
  const showCustomAlert = (title, message, actions = [{ text: 'OK', onPress: null }]) => {
    setAlertModal({ visible: true, title, message, actions });
  };
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creando, setCreando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [vistaActual, setVistaActual] = useState('lista');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rangoInicio, setRangoInicio] = useState(null);
  const [rangoFin, setRangoFin] = useState(null);
  const [modoRango, setModoRango] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const [modalFiltroTipoVisible, setModalFiltroTipoVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const styles = darkMode ? incidenciasStylesDark : incidenciasStyles;

  const isImageFile = (url) => {
    if (typeof url !== 'string') return false;
    const lowerUrl = url.toLowerCase().trim();
    return (
      lowerUrl.endsWith('.jpg') ||
      lowerUrl.endsWith('.jpeg') ||
      lowerUrl.endsWith('.png') ||
      lowerUrl.endsWith('.gif') ||
      lowerUrl.endsWith('.webp') ||
      lowerUrl.endsWith('.bmp')
    );
  };


  const tiposIncidencia = [
    { value: 'retardo', label: 'Retardo', icon: 'time-outline', color: '#f59e0b' },
    { value: 'justificante', label: 'Justificante', icon: 'document-text-outline', color: '#3b82f6' },
    { value: 'permiso', label: 'Permiso', icon: 'calendar-outline', color: '#8b5cf6' },
    { value: 'vacaciones', label: 'Vacaciones', icon: 'airplane-outline', color: '#10b981' }];


  const filtrosEstado = [
    { value: 'todos', label: 'Todos', icon: 'list-outline' },
    { value: 'pendiente', label: 'Pendientes', icon: 'time-outline', color: '#f59e0b' },
    { value: 'aprobado', label: 'Aprobadas', icon: 'checkmark-circle-outline', color: '#10b981' },
    { value: 'rechazado', label: 'Rechazadas', icon: 'close-circle-outline', color: '#ef4444' }];



  const filtrosTipo = [
    { value: 'todos', label: 'Todos los tipos', icon: 'apps-outline', color: '#6b7280' },
    ...tiposIncidencia];


  useEffect(() => {
    cargarIncidencias();
  }, []);

  const cargarIncidencias = async () => {
    try {
      setLoading(true);
      const empleadoId = userData?.empleado_id;
      const token = userData?.token;

      if (!empleadoId || !token) {
        throw new Error('No se pudo obtener información del empleado');
      }

      let datos = [];
      let cargoOnline = false;


      try {
        if (syncManager.getIsBackendDown()) {
          throw new Error('Backend is offline');
        }
        const response = await getIncidenciasEmpleado(empleadoId, token);
        datos = response.data || [];
        cargoOnline = true;


        if (datos.length > 0) {
          await sqliteManager.upsertIncidencias(empleadoId, datos).catch((e) =>
            function () { }('Error guardando caché incidencias:', e.message)
          );
        }
      } catch (e) {
        (function () { })('Error cargando incidencias online, usando caché local:', e.message);

        try {
          datos = await sqliteManager.getIncidenciasLocal(empleadoId);
        } catch (dbErr) {
          (function () { })('Error leyendo caché local:', dbErr.message);
          datos = [];
        }
      }


      try {
        const pendientes = await sqliteManager.getPendingIncidencias();
        const offlineItems = pendientes.
          filter((p) => p.empleado_id === empleadoId).
          map((p) => ({
            id: `offline_${p.local_id}`,
            empleado_id: p.empleado_id,
            tipo: p.tipo,
            motivo: p.motivo,
            fecha_inicio: p.fecha_inicio,
            fecha_fin: p.fecha_fin,
            estado: 'pendiente_sync',
            is_offline: true,
            local_id: p.local_id
          }));

        datos = [...offlineItems, ...datos];
      } catch (e) {
        (function () { })('Error leyendo incidencias offline:', e.message);
      }

      const incidenciasOrdenadas = datos.sort((a, b) =>
        new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
      );
      setIncidencias(incidenciasOrdenadas);


      if (cargoOnline) {
        detectarCambiosIncidencias(incidenciasOrdenadas);
      }


      if (!cargoOnline && datos.length === 0) {
        showCustomAlert('Sin conexión', 'No se pudieron cargar las incidencias. Revisa tu conexión.');
      }
    } catch (error) {
      (function () { })('Error cargando incidencias:', error);
      showCustomAlert('Error', 'No se pudieron cargar las incidencias');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarIncidencias();
    setRefreshing(false);
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return '#f59e0b';
      case 'aprobado': return '#10b981';
      case 'rechazado': return '#ef4444';
      case 'cancelado': return '#6b7280';
      case 'pendiente_sync': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'time-outline';
      case 'aprobado': return 'checkmark-circle-outline';
      case 'rechazado': return 'close-circle-outline';
      case 'cancelado': return 'ban';
      case 'pendiente_sync': return 'cloud-offline-outline';
      default: return 'help-circle-outline';
    }
  };

  const getTipoIcon = (tipo) => {
    const tipoObj = tiposIncidencia.find((t) => t.value === tipo);
    return tipoObj?.icon || 'document';
  };

  const getTipoColor = (tipo) => {
    const tipoObj = tiposIncidencia.find((t) => t.value === tipo);
    return tipoObj?.color || '#6b7280';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearFechaCompleta = (fecha) => {
    if (!fecha) return 'No especificada';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calcularDiasDiferencia = useCallback((inicio, fin) => {
    if (!fin) return 1;
    const diff = new Date(fin) - new Date(inicio);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, []);

  const incidenciasFiltradas = useMemo(() => {
    let filtradas = incidencias;

    if (filtroEstado !== 'todos' && vistaActual === 'lista') {
      filtradas = filtradas.filter((i) => i.estado?.toLowerCase() === filtroEstado);
    }

    if (filtroTipo !== 'todos') {
      filtradas = filtradas.filter((i) => i.tipo === filtroTipo);
    }

    if (vistaActual === 'calendario') {
      if (rangoInicio && rangoFin) {
        const inicio = new Date(rangoInicio); inicio.setHours(0, 0, 0, 0);
        const fin = new Date(rangoFin); fin.setHours(23, 59, 59, 999);
        filtradas = filtradas.filter((i) => {
          const iInicio = new Date(i.fecha_inicio);
          const iFin = i.fecha_fin ? new Date(i.fecha_fin) : iInicio;
          // Incidencia se solapa con el rango seleccionado
          return iInicio <= fin && iFin >= inicio;
        });
      } else if (rangoInicio) {
        filtradas = filtradas.filter((i) => {
          const iInicio = new Date(i.fecha_inicio);
          const iFin = i.fecha_fin ? new Date(i.fecha_fin) : iInicio;
          const d = new Date(rangoInicio); d.setHours(0, 0, 0, 0);
          return iInicio <= new Date(d.getTime() + 86399999) && iFin >= d;
        });
      }
    }

    return filtradas;
  }, [incidencias, filtroEstado, filtroTipo, rangoInicio, rangoFin, vistaActual]);

  const seccionesFiltradas = useMemo(() => {
    const grupos = {};
    incidenciasFiltradas.forEach((incidencia) => {
      // Usamos la fecha_inicio para agrupar (como el día principal del evento)
      const fecha = new Date(incidencia.fecha_inicio);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      if (!grupos[key]) {
        grupos[key] = {
          key,
          fecha,
          data: []
        };
      }
      grupos[key].data.push(incidencia);
    });

    const esRangoSeleccionado = rangoInicio && rangoFin;

    return Object.values(grupos)
      .sort((a, b) => esRangoSeleccionado ? (a.fecha - b.fecha) : (b.fecha - a.fecha))
      .map((g) => ({
        title: g.key,
        fecha: g.fecha,
        data: esRangoSeleccionado ? [...g.data].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)) : g.data
      }));
  }, [incidenciasFiltradas, rangoInicio, rangoFin]);

  const cambiarMes = useCallback((direccion) => {
    const nuevoMes = new Date(currentMonth);
    nuevoMes.setMonth(currentMonth.getMonth() + direccion);
    setCurrentMonth(nuevoMes);
    setRangoInicio(null);
    setRangoFin(null);
    setModoRango(false);
  }, [currentMonth]);

  const diasCalendario = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const primerDiaSemana = new Date(year, month, 1).getDay();
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    const dias = [];
    for (let i = 0; i < primerDiaSemana; i++) dias.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) dias.push(dia);
    return dias;
  }, [currentMonth]);

  const incidenciasPorDia = useMemo(() => {
    const mapa = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let dia = 1; dia <= daysInMonth; dia++) {
      const fecha = new Date(year, month, dia);

      const incidenciasDia = incidencias.filter((i) => {
        const inicioDate = new Date(i.fecha_inicio);
        const finDate = i.fecha_fin ? new Date(i.fecha_fin) : inicioDate;
        return fecha >= new Date(inicioDate.setHours(0, 0, 0, 0)) &&
          fecha <= new Date(finDate.setHours(23, 59, 59, 999));
      });

      if (incidenciasDia.length > 0) {
        mapa[dia] = incidenciasDia;
      }
    }
    return mapa;
  }, [incidencias, currentMonth]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const renderCalendario = () => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <View style={styles.calendarSection}>
        { }
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color={darkMode ? '#f1f5f9' : '#1f2937'} />
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>

          <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color={darkMode ? '#f1f5f9' : '#1f2937'} />
          </TouchableOpacity>
        </View>

        { }
        <View style={styles.calendar}>
          <View style={styles.weekDays}>
            {dayNames.map((day, index) =>
              <View key={index} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            )}
          </View>

          <View style={styles.daysGrid}>
            {diasCalendario.map((dia, index) => {
              const incidenciasDia = dia ? incidenciasPorDia[dia] || [] : [];
              const fechaDia = dia
                ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dia)
                : null;
              const isInicio = rangoInicio && fechaDia &&
                fechaDia.toDateString() === rangoInicio.toDateString();
              const isFin = rangoFin && fechaDia &&
                fechaDia.toDateString() === rangoFin.toDateString();
              const isEnRango = rangoInicio && rangoFin && fechaDia &&
                fechaDia >= rangoInicio && fechaDia <= rangoFin && !isInicio && !isFin;
              const isSelected = isInicio || isFin;
              const isToday = dia &&
                new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dia).toDateString();

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCell}
                  onPress={() => {
                    if (!dia) return;
                    const fecha = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dia);
                    if (!modoRango) {
                      // Tap simple: filtro de un día (comportamiento original)
                      setRangoFin(null);
                      setRangoInicio((prev) =>
                        prev && prev.toDateString() === fecha.toDateString() ? null : fecha
                      );
                    } else {
                      // Modo rango activo: cerrar rango
                      setModoRango(false);
                      if (!rangoInicio || fecha.toDateString() === rangoInicio.toDateString()) {
                        setRangoFin(null);
                      } else if (fecha < rangoInicio) {
                        setRangoFin(rangoInicio);
                        setRangoInicio(fecha);
                      } else {
                        setRangoFin(fecha);
                      }
                    }
                  }}
                  onLongPress={() => {
                    if (!dia) return;
                    const fecha = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dia);
                    setRangoInicio(fecha);
                    setRangoFin(null);
                    setModoRango(true);
                  }}
                  disabled={!dia}>

                  {dia &&
                    <View style={[
                      styles.dayContent,
                      isSelected && styles.dayContentSelected,
                      isEnRango && styles.dayContentInRange,
                      isToday && !isSelected && !isEnRango && styles.dayContentToday]
                    }>
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isEnRango && styles.dayTextInRange,
                        isToday && !isSelected && !isEnRango && styles.dayTextToday]
                      }>
                        {dia}
                      </Text>
                      { }
                      {incidenciasDia.length > 0 && !isSelected && !isEnRango &&
                        <View style={styles.dayIndicators}>
                          <View style={styles.dayIndicator} />
                        </View>
                      }
                    </View>
                  }
                </TouchableOpacity>);

            })}
          </View>
        </View>
      </View>);

  };

  const renderIncidenciaCard = (incidencia, index, section) => {
    const isExpanded = expandedCard === incidencia.id;
    const diasTotal = calcularDiasDiferencia(incidencia.fecha_inicio, incidencia.fecha_fin);
    const isLast = index === section.data.length - 1;

    return (
      <View key={incidencia.id}>
        <TouchableOpacity
          style={styles.incidenciaCard}
          onPress={() => setExpandedCard(isExpanded ? null : incidencia.id)}
          activeOpacity={0.7}>

          <View style={styles.cardHeader}>
            <View style={styles.tipoContainer}>
              <View style={[
                styles.tipoIcon,
                { backgroundColor: `${getTipoColor(incidencia.tipo)}20` }]
              }>
                <Ionicons
                  name={getTipoIcon(incidencia.tipo)}
                  size={20}
                  color={getTipoColor(incidencia.tipo)} />

              </View>
              <View style={styles.tipoInfo}>
                <Text style={styles.tipoText}>
                  {tiposIncidencia.find((t) => t.value === incidencia.tipo)?.label || incidencia.tipo}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  <Text style={styles.fechaText}>
                    {formatearFecha(incidencia.fecha_inicio)}
                    {incidencia.fecha_fin && ` - ${formatearFecha(incidencia.fecha_fin)}`}
                  </Text>
                  {incidencia.is_offline && (
                    <>
                      <Text style={[styles.fechaText, { color: darkMode ? '#64748b' : '#94a3b8' }]}>•</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: darkMode ? '#818cf8' : '#4f46e5' }}>
                        Pendiente de enviar
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={[
              styles.estadoBadge,
              { backgroundColor: `${getEstadoColor(incidencia.estado)}20` }]
            }>
              <Ionicons
                name={getEstadoIcon(incidencia.estado)}
                size={14}
                color={getEstadoColor(incidencia.estado)} />

            </View>
          </View>

          <Text style={[styles.motivoText, { marginTop: 12 }]} numberOfLines={isExpanded ? undefined : 2}>
            {incidencia.motivo}
          </Text>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Inicio:</Text>
                <Text style={styles.detailValue}>{formatearFechaCompleta(incidencia.fecha_inicio)}</Text>
              </View>

              {incidencia.fecha_fin && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fin:</Text>
                    <Text style={styles.detailValue}>{formatearFechaCompleta(incidencia.fecha_fin)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duración:</Text>
                    <Text style={styles.detailValue}>{diasTotal} {diasTotal === 1 ? 'día' : 'días'}</Text>
                  </View>
                </>
              )}

              {incidencia.observaciones && (
                <View style={[styles.detailRow, { marginTop: 4 }]}>
                  <Text style={styles.detailLabel}>
                    {incidencia.estado === 'rechazado' ? 'Motivo:' : 'Observaciones:'}
                  </Text>
                  <Text style={[
                    styles.detailValue,
                    incidencia.estado === 'rechazado' && { color: '#ef4444' }]
                  }>
                    {incidencia.observaciones}
                  </Text>
                </View>
              )}

              {incidencia.archivo_url && (
                <View style={[styles.detailRow, { marginTop: 12, flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <Text style={styles.detailLabel}>Evidencia(s):</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, width: '100%' }}>
                    {(Array.isArray(incidencia.archivo_url) 
                        ? incidencia.archivo_url 
                        : typeof incidencia.archivo_url === 'string' && incidencia.archivo_url.includes(',')
                          ? incidencia.archivo_url.split(',')
                          : [incidencia.archivo_url]
                    ).map((url, idx) => {
                      const cleanUrl = url.trim();
                      const fullUrl = getApiEndpoint(cleanUrl);
                      const isImg = isImageFile(cleanUrl);

                      if (isImg) {
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={styles.evidenceImageContainer}
                            onPress={() => setSelectedImage(fullUrl)}
                            activeOpacity={0.9}
                          >
                            <IncidentImage
                              uri={fullUrl}
                              style={styles.evidenceImage}
                              darkMode={darkMode}
                            />
                            <View style={styles.evidenceImageBadge}>
                              <Ionicons name="scan-outline" size={14} color="#ffffff" />
                              <Text style={styles.evidenceImageBadgeText}>Ver imagen</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.evidenceButton}
                          onPress={() => setSelectedDocument(fullUrl)}
                        >
                          <Ionicons name="document-attach" size={16} color={darkMode ? '#60a5fa' : '#4f46e5'} />
                          <Text style={styles.evidenceButtonText}>
                            Ver Archivo {idx + 1}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const ListHeader = () => (
    <>
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewButton, vistaActual === 'lista' && styles.viewButtonActive]}
          onPress={() => {
            setVistaActual('lista');
            setRangoInicio(null);
            setRangoFin(null);
            setModoRango(false);
          }}>

          <Ionicons name="list" size={20} color={vistaActual === 'lista' ? (darkMode ? '#60a5fa' : '#2563eb') : (darkMode ? '#94a3b8' : '#6b7280')} />
          <Text style={[styles.viewButtonText, vistaActual === 'lista' && styles.viewButtonTextActive]}>Lista</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewButton, vistaActual === 'calendario' && styles.viewButtonActive]}
          onPress={() => setVistaActual('calendario')}>

          <Ionicons name="calendar" size={20} color={vistaActual === 'calendario' ? (darkMode ? '#60a5fa' : '#2563eb') : (darkMode ? '#94a3b8' : '#6b7280')} />
          <Text style={[styles.viewButtonText, vistaActual === 'calendario' && styles.viewButtonTextActive]}>Calendario</Text>
        </TouchableOpacity>
      </View>

      {vistaActual === 'lista' &&
        <View style={styles.filtrosContainer}>
          <TouchableOpacity style={styles.filtroChip} onPress={() => setModalFiltroVisible(true)}>
            <Ionicons name={filtrosEstado.find((f) => f.value === filtroEstado)?.icon || 'list'} size={16} color={darkMode ? '#60a5fa' : '#2563eb'} />
            <Text style={styles.filtroChipText}>{filtrosEstado.find((f) => f.value === filtroEstado)?.label || 'Todos'}</Text>
            <View style={styles.filtroChipBadge}>
              <Text style={styles.filtroChipBadgeText}>
                {incidenciasFiltradas.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.filtroChip, { flex: 1 }]} onPress={() => setModalFiltroTipoVisible(true)}>
            <Ionicons name={filtrosTipo.find((f) => f.value === filtroTipo)?.icon || 'apps'} size={16} color={getTipoColor(filtroTipo)} />
            <Text style={styles.filtroChipText}>{filtroTipo === 'todos' ? 'Tipo' : filtrosTipo.find((f) => f.value === filtroTipo)?.label}</Text>
            <View style={[styles.filtroChipBadge, { backgroundColor: `${getTipoColor(filtroTipo)}20` }]}>
              <Text style={[styles.filtroChipBadgeText, { color: getTipoColor(filtroTipo) }]}>
                {incidenciasFiltradas.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      }

      {vistaActual === 'calendario' && renderCalendario()}

      {vistaActual === 'calendario' && (rangoInicio || rangoFin) && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {rangoInicio && rangoFin
              ? `${rangoInicio.getDate()} – ${rangoFin.getDate()} de ${monthNames[rangoFin.getMonth()]}`
              : `${rangoInicio.getDate()} de ${monthNames[rangoInicio.getMonth()]}`
            }
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => { setRangoInicio(null); setRangoFin(null); setModoRango(false); }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: darkMode ? '#60a5fa' : '#2563eb' }}>Ver todas</Text>
            </TouchableOpacity>
            <Text style={styles.sectionCount}>
              {incidenciasFiltradas.length} {incidenciasFiltradas.length === 1 ? 'registro' : 'registros'}
            </Text>
          </View>
        </View>
      )}
    </>
  );


  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={darkMode ? '#334155' : '#cbd5e1'} />
      <Text style={styles.emptyTitle}>No hay incidencias</Text>
      <Text style={styles.emptyText}>
        {filtroEstado === 'todos' && filtroTipo === 'todos' ?
          'Toca el botón + para crear tu primera incidencia' :
          'Cambia los filtros para ver otras incidencias'
        }
      </Text>
    </View>
  );

  const memoizedFlatList = useMemo(() => (
    <FlatList
      data={seccionesFiltradas}
      extraData={expandedCard}
      keyExtractor={(item, index) => item.fecha ? item.fecha.toString() + index : index.toString()}
      renderItem={({ item: section }) => {
        const mNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaNum = String(section.fecha.getDate()).padStart(2, '0');
        const mesNum = String(section.fecha.getMonth() + 1).padStart(2, '0');
        const anio = section.fecha.getFullYear();
        const tituloDia = `${diasSemana[section.fecha.getDay()]} - ${diaNum}/${mesNum}/${anio}`;
        const totalRegistros = section.data.length;

        // Color del punto según el estado dominante de las incidencias del día
        const tieneRechazado = section.data.some((i) => i.estado?.toLowerCase() === 'rechazado');
        const tienePendiente = !tieneRechazado && section.data.some((i) =>
          i.estado?.toLowerCase() === 'pendiente' || i.estado?.toLowerCase() === 'pendiente_sync'
        );

        return (
          <View style={styles.incidenciasList}>
            <View style={styles.sectionDayHeader}>
              <Text style={styles.sectionDayTitle}>{tituloDia}</Text>
              <Text style={styles.sectionDayCount}>
                {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              {section.data.map((incidencia, idx) => renderIncidenciaCard(incidencia, idx, section))}
            </View>
          </View>
        );
      }}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={<View style={{ height: 100 }} />}
      contentContainerStyle={seccionesFiltradas.length === 0 ? { flexGrow: 1 } : undefined}
      showsVerticalScrollIndicator={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={Platform.OS !== 'ios'}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={darkMode ? '#60a5fa' : '#2563eb'}
          colors={[darkMode ? '#60a5fa' : '#2563eb']} />
      } />
  ), [seccionesFiltradas, expandedCard, refreshing, styles, darkMode, currentMonth, vistaActual, filtroEstado, filtroTipo, rangoInicio, rangoFin]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          darkMode={darkMode}
          title="Incidencias"
          leftComponent={
            <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }} activeOpacity={0.6}>
              <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
            </TouchableOpacity>
          }
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={darkMode ? '#60a5fa' : '#2563eb'} />
        </View>
      </View>);

  }

  return (
    <View style={styles.container}>
      { }
      <Header
        darkMode={darkMode}
        title="Incidencias"
        leftComponent={
          <TouchableOpacity onPress={onBack} style={{ padding: 8, marginLeft: -8 }} activeOpacity={0.6}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ padding: 8, marginRight: -8 }} activeOpacity={0.6}>
            <Ionicons name="add" size={28} color={darkMode ? '#34d399' : '#059669'} />
          </TouchableOpacity>
        }
      />

      {memoizedFlatList}


      { }
      <Modal
        visible={modalFiltroTipoVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalFiltroTipoVisible(false)}>

        <View style={styles.modalOverlayBottomSheet}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalFiltroTipoVisible(false)}>

            <View style={{ flex: 1 }} />
          </TouchableOpacity>

          <View style={styles.modalSheetContent}>
            <View style={styles.modalSheetHandle} />

            <View style={styles.modalListHeader}>
              <Text style={styles.modalListTitle}>Filtrar por Tipo</Text>
              <TouchableOpacity onPress={() => setModalFiltroTipoVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {filtrosTipo.map((filtro, index) =>
              <TouchableOpacity
                key={filtro.value}
                style={[
                  styles.modalListItem,
                  filtroTipo === filtro.value && styles.modalListItemActive,
                  index === filtrosTipo.length - 1 && { borderBottomWidth: 0 }]
                }
                onPress={() => {
                  setFiltroTipo(filtro.value);
                  setModalFiltroTipoVisible(false);
                }}
                activeOpacity={0.7}>

                <View style={styles.modalListItemLeft}>
                  <View style={[
                    styles.tipoIconSmall,
                    { backgroundColor: `${filtro.color}20` }]
                  }>
                    <Ionicons
                      name={filtro.icon}
                      size={20}
                      color={filtro.color} />

                  </View>
                  <Text style={[
                    styles.modalListItemText,
                    filtroTipo === filtro.value && styles.modalListItemTextActive]
                  }>
                    {filtro.label}
                  </Text>
                </View>
                <View style={styles.modalListItemBadge}>
                  <Text style={styles.modalListItemBadgeText}>
                    {filtro.value === 'todos' ?
                      incidencias.filter(i => filtroEstado === 'todos' || i.estado?.toLowerCase() === filtroEstado).length :
                      incidencias.filter((i) => i.tipo === filtro.value && (filtroEstado === 'todos' || i.estado?.toLowerCase() === filtroEstado)).length
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      { }
      <Modal
        visible={modalFiltroVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalFiltroVisible(false)}>

        <View style={styles.modalOverlayBottomSheet}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalFiltroVisible(false)}>

            <View style={{ flex: 1 }} />
          </TouchableOpacity>

          <View style={styles.modalSheetContent}>
            <View style={styles.modalSheetHandle} />

            <View style={styles.modalListHeader}>
              <Text style={styles.modalListTitle}>Filtrar por Estado</Text>
              <TouchableOpacity onPress={() => setModalFiltroVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {filtrosEstado.map((filtro, index) =>
              <TouchableOpacity
                key={filtro.value}
                style={[
                  styles.modalListItem,
                  filtroEstado === filtro.value && styles.modalListItemActive,
                  index === filtrosEstado.length - 1 && { borderBottomWidth: 0 }]
                }
                onPress={() => {
                  setFiltroEstado(filtro.value);
                  setModalFiltroVisible(false);
                }}
                activeOpacity={0.7}>

                <View style={styles.modalListItemLeft}>
                  <Ionicons
                    name={filtro.icon}
                    size={22}
                    color={filtroEstado === filtro.value ? (darkMode ? '#60a5fa' : '#2563eb') : (darkMode ? '#94a3b8' : '#6b7280')} />

                  <Text style={[
                    styles.modalListItemText,
                    filtroEstado === filtro.value && styles.modalListItemTextActive]
                  }>
                    {filtro.label}
                  </Text>
                </View>
                <View style={styles.modalListItemBadge}>
                  <Text style={styles.modalListItemBadgeText}>
                    {filtro.value === 'todos' ?
                      incidencias.filter(i => filtroTipo === 'todos' || i.tipo === filtroTipo).length :
                      incidencias.filter((i) => (i.estado?.toLowerCase() || 'pendiente') === filtro.value && (filtroTipo === 'todos' || i.tipo === filtroTipo)).length
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {modalVisible && (
        <CreationIncidentScreen
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={() => {
            setModalVisible(false);
            cargarIncidencias();
          }}
          userData={userData}
          darkMode={darkMode}
        />
      )}

      {/* Modal para Visualizar Imagen */}
      <FullScreenViewer
        visible={!!selectedImage}
        uri={selectedImage}
        onClose={() => setSelectedImage(null)}
        darkMode={darkMode}
      />

      {/* Modal para Visualizar Documento */}
      <DocumentViewer
        visible={!!selectedDocument}
        uri={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        darkMode={darkMode}
      />

      <CustomAlert
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        actions={alertModal.actions}
        darkMode={darkMode}
        onClose={() => setAlertModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const IncidentImage = ({ uri, style, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: darkMode ? '#1e293b' : '#f1f5f9', overflow: 'hidden' }]}>
      {loading && (
        <ActivityIndicator
          size="small"
          color={darkMode ? '#60a5fa' : '#2563eb'}
          style={{ position: 'absolute', zIndex: 1 }}
        />
      )}
      {error ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Ionicons name="image-outline" size={32} color={darkMode ? '#475569' : '#94a3b8'} />
          <Text style={{ fontSize: 11, color: darkMode ? '#64748b' : '#94a3b8', marginTop: 4 }}>
            No se pudo cargar la imagen
          </Text>
        </View>
      ) : (
        <Image
          source={{
            uri: uri,
            cache: 'force-cache',
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
      )}
    </View>
  );
};

const FullScreenViewer = ({ uri, visible, onClose, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(false);
    }
  }, [visible, uri]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={{ flex: 1 }} />
        </TouchableOpacity>
        
        <View style={{ width: '90%', height: '80%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: -45, right: 10, zIndex: 10, padding: 8 }}
            onPress={onClose}
            activeOpacity={0.6}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator
              size="large"
              color="#60a5fa"
              style={{ position: 'absolute', zIndex: 1 }}
            />
          )}

          {error ? (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={{ color: '#fff', marginTop: 8, fontSize: 14 }}>
                Error al abrir la imagen
              </Text>
            </View>
          ) : (
            uri && (
              <Image
                source={{ uri: uri, cache: 'force-cache' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setError(true);
                  setLoading(false);
                }}
              />
            )
          )}
        </View>
      </View>
    </Modal>
  );
};

const DocumentViewer = ({ uri, visible, onClose, darkMode }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setLoading(true);
    }
  }, [visible, uri]);

  const viewerUrl = Platform.OS === 'android' && uri && uri.toLowerCase().endsWith('.pdf')
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`
    : uri;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: darkMode ? '#0f172a' : '#ffffff' }}>
        <View style={{ 
          paddingTop: Platform.OS === 'ios' ? 45 : (StatusBar.currentHeight || 24),
          paddingBottom: 8,
          backgroundColor: darkMode ? '#0f172a' : '#ffffff'
        }}>
          <Header
            darkMode={darkMode}
            title="Vista de Documento"
            leftComponent={
              <TouchableOpacity onPress={onClose} style={{ padding: 8, marginLeft: -8 }} activeOpacity={0.6}>
                <Ionicons name="arrow-back" size={24} color={darkMode ? '#f8fafc' : '#0f172a'} />
              </TouchableOpacity>
            }
          />
        </View>

        <View style={{ height: 1, backgroundColor: darkMode ? '#1e293b' : '#e2e8f0' }} />

        <View style={{ flex: 1, position: 'relative' }}>
          {uri ? (
            <WebView
              source={{ uri: viewerUrl }}
              style={{ flex: 1 }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>No se pudo cargar el documento</Text>
            </View>
          )}

          {loading && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            }}>
              <ActivityIndicator size="large" color={darkMode ? '#60a5fa' : '#2563eb'} />
              <Text style={{ marginTop: 12, color: darkMode ? '#94a3b8' : '#64748b', fontSize: 14 }}>
                Cargando vista previa...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default IncidenciasScreen;