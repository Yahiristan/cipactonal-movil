import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Vibration,
  DeviceEventEmitter,
  Animated,
  TouchableWithoutFeedback
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import * as LocalAuthentication from 'expo-local-authentication';
import { isPointInPolygon, extraerCoordenadas } from '../../services/ubicacionService';
import { getApiEndpoint } from '../../config/api';
import { getCredencialesByEmpleado, verificarPin } from '../../services/credencialesService';
import { getOrdenCredenciales } from '../../services/configurationService';
import { capturarHuellaDigital } from '../../services/biometricservice';
import { processFaceData, validateFaceQuality, generateFacialTemplate } from '../../services/facialCameraService';
import { verifyFace } from '../../services/faceComparisonService';
import { PinInputModal } from '../settingsPages/PinModal';
import { FacialCaptureScreen } from '../../services/FacialCaptureScreen';
import MapaZonasPermitidas from './MapScreen';
import { notificarRegistro, notificarEstadoAsistencia } from '../../services/localNotificationService';


import sqliteManager, { saveOnlineAsistenciaToCache } from '../../services/offline/sqliteManager.mjs';
import offlineAuthService from '../../services/offline/offlineAuthService.mjs';
import syncManager from '../../services/offline/syncManager.mjs';
import pushService from '../../services/offline/pushService.mjs';
import { srvBuscarBloqueActual, srvEvaluarEstado } from '../../services/offline/evaluadorAsistencias.js';

import { registerStyles, registerStylesDark } from './RegisterButtonStyles';

const API_URL = getApiEndpoint('/api');
const NOTIF_DIARIA_KEY = '@notif_asistencia_disponible';

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

export const RegisterButton = ({ userData, darkMode, onRegistroExitoso }) => {
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [mostrarDepartamentos, setMostrarDepartamentos] = useState(false);
  const [mostrarAutenticacion, setMostrarAutenticacion] = useState(false);
  const [mostrarPinAuth, setMostrarPinAuth] = useState(false);
  const [mostrarCapturaFacial, setMostrarCapturaFacial] = useState(false);
  const [credencialesUsuario, setCredencialesUsuario] = useState(null);
  const [metodosDisponibles, setMetodosDisponibles] = useState([]);
  const [ordenCredenciales, setOrdenCredenciales] = useState([]);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [departamentosDisponibles, setDepartamentosDisponibles] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  const [horarioInfo, setHorarioInfo] = useState(null);
  const [ultimoRegistroHoy, setUltimoRegistroHoy] = useState(null);
  const [registrosHoyTodos, setRegistrosHoyTodos] = useState([]);
  const [dentroDelArea, setDentroDelArea] = useState(false);
  const [forzarUbicacion, setForzarUbicacion] = useState(false);
  const [puedeRegistrar, setPuedeRegistrar] = useState(false);
  const [tipoSiguienteRegistro, setTipoSiguienteRegistro] = useState(null);
  const [estadoHorario, setEstadoHorario] = useState(null);
  const [jornadaCompletada, setJornadaCompletada] = useState(false);
  const [mensajeEspera, setMensajeEspera] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [internetReachable, setInternetReachable] = useState(false);
  const [omisionesGlobales, setOmisionesGlobales] = useState(null);
  const [usandoEstadoBackend, setUsandoEstadoBackend] = useState(false);
  const [diaFestivo, setDiaFestivo] = useState(null);

  // Modal de alerta personalizado
  const [alertModal, setAlertModal] = useState({ visible: false, icon: 'alert-circle', iconColor: '#ef4444', title: '', message: '', actions: [] });
  const alertAnim = useRef(new Animated.Value(0)).current;

  const showCustomAlert = (title, message, actions = [{ text: 'OK', onPress: null }]) => {
    let icon = 'information-circle';
    let iconColor = '#2563eb';
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('error') || lowerTitle.includes('fall') || lowerTitle.includes('insuficiente') || lowerTitle.includes('bloqueo') || lowerTitle.includes('sin acceso') || lowerTitle.includes('no disponible') || lowerTitle.includes('no verificada')) {
      icon = 'alert-circle';
      iconColor = '#ef4444';
    } else if (lowerTitle.includes('exitoso') || lowerTitle.includes('completada')) {
      icon = 'checkmark-circle';
      iconColor = '#10b981';
    } else if (lowerTitle.includes('aviso') || lowerTitle.includes('pendiente') || lowerTitle.includes('festivo') || lowerTitle.includes('requerida') || lowerTitle.includes('seguridad')) {
      icon = 'warning';
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

  const datosRegistroRef = useRef({
    ubicacion: null,
    departamento: null,
    metodo: null,
    payloadBiometrico: null
  });
  const notificadoEstadoRef = useRef(null);
  const notifDiariaRef = useRef({ fecha: '', entrada: false, salida: false });
  const horarioInfoRef = useRef(null);
  const ultimoRegistroHoyRef = useRef(null);
  const registrosHoyTodosRef = useRef([]);
  const tipoSiguienteRegistroRef = useRef(null);
  const isOnlineRef = useRef(false);
  const ticksRef = useRef(0);
  const currentDateRef = useRef((() => {
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().split('T')[0];
  })());
  const styles = darkMode ? registerStylesDark : registerStyles;
  const clockOffsetRef = useRef(0);
  const getTrustedDate = useCallback(() => new Date(Date.now() + clockOffsetRef.current), []);
  const [horaActual, setHoraActual] = useState(getTrustedDate());
  useEffect(() => { horarioInfoRef.current = horarioInfo; }, [horarioInfo]);
  useEffect(() => { ultimoRegistroHoyRef.current = ultimoRegistroHoy; }, [ultimoRegistroHoy]);
  useEffect(() => { registrosHoyTodosRef.current = registrosHoyTodos; }, [registrosHoyTodos]);
  useEffect(() => { tipoSiguienteRegistroRef.current = tipoSiguienteRegistro; }, [tipoSiguienteRegistro]);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

  useEffect(() => {
    cargarCredencialesYOrden();
    syncManager.initAutoSync();
  }, []);

  useEffect(() => {
    const cargarOffset = async () => {
      try {
        const stored = await AsyncStorage.getItem('@clock_offset');
        if (stored) clockOffsetRef.current = parseInt(stored, 10);
      } catch (e) { }
    };
    cargarOffset();

    const cargarEstadoNotifDiaria = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIF_DIARIA_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const tzDate = new Date();
          const tzOffset = tzDate.getTimezoneOffset() * 60000;
          const hoy = new Date(tzDate.getTime() - tzOffset).toISOString().split('T')[0];
          if (parsed.fecha === hoy) {

            notifDiariaRef.current = parsed;
          } else {

            const nuevoEstado = { fecha: hoy, entrada: false, salida: false };
            notifDiariaRef.current = nuevoEstado;
            await AsyncStorage.setItem(NOTIF_DIARIA_KEY, JSON.stringify(nuevoEstado));
          }
        }
      } catch (e) {

      }
    };
    cargarEstadoNotifDiaria();
  }, []);

  const cargarCredencialesYOrden = async () => {
    try {
      const credsResponse = await getCredencialesByEmpleado(
        userData.empleado_id,
        userData.token
      );

      const creds = credsResponse.data || {
        tiene_dactilar: false,
        tiene_facial: false,
        tiene_pin: false
      };
      setCredencialesUsuario(creds);

      const ordenResponse = await getOrdenCredenciales(userData.token);

      // Normalizar a array de objetos {metodo, activo, nivel}
      const ordenRaw = ordenResponse.ordenCredenciales || [
        { metodo: 'pin', activo: true, nivel: 1 },
        { metodo: 'dactilar', activo: true, nivel: 2 },
        { metodo: 'facial', activo: true, nivel: 3 }
      ];

      // Always keep objects — preserve activo flag
      const ordenObjetos = Array.isArray(ordenRaw)
        ? ordenRaw.map((item, index) =>
          typeof item === 'string'
            ? { metodo: item, activo: true, nivel: index + 1 }
            : { metodo: item.metodo, activo: item.activo !== false, nivel: item.nivel || index + 1 }
        ).sort((a, b) => a.nivel - b.nivel)
        : Object.entries(ordenRaw)
          .map(([key, val], i) => ({ metodo: key, activo: val?.activo !== false, nivel: val?.prioridad || val?.nivel || i + 1 }))
          .sort((a, b) => a.nivel - b.nivel);

      // Store only method names for display ordering
      setOrdenCredenciales(ordenObjetos.map(o => o.metodo));
      await construirMetodosDisponibles(creds, ordenObjetos);

    } catch (error) {
      (function () { })('Using offline credentials');
      try {
        const creds = await sqliteManager.getAllCredenciales();
        const misCreds = creds.filter((c) => c.empleado_id === userData.empleado_id);

        const esValido = (val) => val && val !== 'false' && val !== '0' && val !== 0 && val !== 'null';
        const tienePin = misCreds.some((c) => esValido(c.pin_hash));
        const tieneDactilar = misCreds.some((c) => esValido(c.dactilar_template));
        const tieneFacial = misCreds.some((c) => esValido(c.facial_descriptor));

        const offlineCreds = {
          tiene_pin: tienePin,
          tiene_dactilar: tieneDactilar,
          tiene_facial: tieneFacial,
          _offlineMode: true
        };

        setCredencialesUsuario(offlineCreds);

        // Read cached credential order from SQLite (saved during last online sync)
        let ordenOffline = null;
        try {
          ordenOffline = await sqliteManager.getOrdenCredenciales();
        } catch { /* ignore */ }

        // ordenOffline is [{metodo, activo, nivel}] or null
        const ordenFallback = ordenOffline || [
          { metodo: 'pin', activo: true, nivel: 1 },
          { metodo: 'dactilar', activo: true, nivel: 2 },
          { metodo: 'facial', activo: true, nivel: 3 }
        ];
        await construirMetodosDisponibles(offlineCreds, ordenFallback);

      } catch (offlineError) {
        setCredencialesUsuario({
          tiene_dactilar: false,
          tiene_facial: false,
          tiene_pin: false
        });
      }
    }
  };

  // orden: array of {metodo, activo, nivel} objects (or strings for offline fallback)
  const construirMetodosDisponibles = async (credenciales, orden) => {

    let biometricSupported = false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      biometricSupported = hasHardware && isEnrolled;
    } catch (e) {
      (function () { })('Error verificando biometría local:', e);
    }
    const tieneFacialEnBD = credenciales?.tiene_facial || false;

    const dactilarDisponible = tieneFacialEnBD && biometricSupported;

    const metodosBase = {
      'pin': {
        id: 'pin',
        nombre: 'PIN',
        icono: 'keypad',
        disponible: credenciales?.tiene_pin || false
      },
      'dactilar': {
        id: 'dactilar',
        nombre: 'Huella',
        icono: 'finger-print',
        disponible: dactilarDisponible
      },
      'facial': {
        id: 'facial',
        nombre: 'Facial',
        icono: 'scan',
        disponible: tieneFacialEnBD
      }
    };

    // Normalize orden to objects: support both string[] (offline) and {metodo,activo,nivel}[]
    const ordenNorm = Array.isArray(orden)
      ? orden.map((item, i) =>
        typeof item === 'string'
          ? { metodo: item, activo: true, nivel: i + 1 }
          : item
      )
      : [];

    const metodosOrdenados = ordenNorm
      // Filter out methods disabled by the admin config
      .filter(o => o.activo !== false)
      .sort((a, b) => (a.nivel ?? 99) - (b.nivel ?? 99))
      .map(o => metodosBase[o.metodo])
      .filter(metodo => metodo && metodo.disponible);

    setMetodosDisponibles(metodosOrdenados);
  };

  const getHandlerForMetodo = (metodoId) => {
    switch (metodoId) {
      case 'pin': return handleAutenticacionPin;
      case 'dactilar': return handleAutenticacionHuella;
      case 'facial': return handleAutenticacionFacial;
      default: return () => { };
    }
  };

  const handleAutenticacionPin = useCallback(() => {
    datosRegistroRef.current.metodo = 'PIN';
    setMostrarAutenticacion(false);
    setTimeout(() => {
      setMostrarPinAuth(true);
    }, 150);
  }, []);

  const actualizarEstadoPreflight = useCallback(async () => {
    try {
      const empleadoId = userData?.empleado_id;
      if (!empleadoId) return false;

      let onlineNow = false;
      try { onlineNow = await syncManager.isOnline() && !syncManager.getIsBackendDown(); } catch (e) { }

      if (!onlineNow) {
        setUsandoEstadoBackend(false);
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const response = await fetch(
        `${API_URL}/asistencias/estado/${empleadoId}`,
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const serverDateStr = response.headers.get('Date');
        if (serverDateStr && !isNaN(new Date(serverDateStr).getTime())) {
          const offset = new Date(serverDateStr).getTime() - Date.now();
          clockOffsetRef.current = offset;
          AsyncStorage.setItem('@clock_offset', offset.toString()).catch(() => { });
        }
        const json = await response.json();
        const data = json.data;
        if (data) {
          // Si hay día festivo, el frontend manda: el backend no checa días festivos
          // en el preflight, así que ignoramos su respuesta y mantenemos el bloqueo.
          if (diaFestivo) {
            setPuedeRegistrar(false);
            setEstadoHorario('dia_festivo');
            setJornadaCompletada(false);
            setUsandoEstadoBackend(true);
            return true;
          }

          // ── NOTA: NO confiamos ciegamente en puedeRegistrar del backend.
          //    Si el siguiente tipo es 'salida', la validación de ventana de tiempo
          //    la hace el useEffect local para evitar activar el botón antes de hora.
          //    El backend solo sabe si el empleado PUEDE registrar en términos de estado,
          //    NO valida la ventana horaria de salida.

          // Si el backend dice que el siguiente es salida, NO aplicamos su puedeRegistrar
          // directamente: dejamos que el useEffect de tiempo lo decida.
          if (data.tipoSiguienteRegistro === 'salida') {
            if (data.tipoSiguienteRegistro) setTipoSiguienteRegistro(data.tipoSiguienteRegistro);
            if (data.motivo) setMensajeEspera(data.motivo);
            let finalEstadoHorario = data.estadoHorario;
            if (finalEstadoHorario === 'bloque_completo') finalEstadoHorario = 'activo';
            if (finalEstadoHorario) setEstadoHorario(finalEstadoHorario);
            setJornadaCompletada(false);
            // Marcamos como backend pero NO seteamos puedeRegistrar para salida;
            // el useEffect evaluará la ventana de tiempo y lo seteará.
            setUsandoEstadoBackend(false); // Desactivar para que el useEffect local tome el control
            return true;
          }

          setPuedeRegistrar(data.puedeRegistrar);
          if (data.tipoSiguienteRegistro) setTipoSiguienteRegistro(data.tipoSiguienteRegistro);
          if (data.motivo) setMensajeEspera(data.motivo);

          let finalEstadoHorario = data.estadoHorario;
          if (finalEstadoHorario === 'bloque_completo') {
            finalEstadoHorario = 'activo';
          }

          if (finalEstadoHorario) setEstadoHorario(finalEstadoHorario);
          setJornadaCompletada(false);

          setUsandoEstadoBackend(true);
          return true;
        }
      }
      setUsandoEstadoBackend(false);
      return false;
    } catch (err) {
      setUsandoEstadoBackend(false);
      return false;
    }
  }, [userData]);


  useEffect(() => {
    const intervalo = setInterval(async () => {
      const ahora = getTrustedDate();
      setHoraActual(ahora);
      ticksRef.current += 1;

      // ── Verificar cambio de día (medianoche) para re-evaluar festivo offline ──
      const ahoraOffset = ahora.getTimezoneOffset() * 60000;
      const fechaHoyStr = new Date(ahora.getTime() - ahoraOffset).toISOString().split('T')[0];
      if (fechaHoyStr !== currentDateRef.current) {
        currentDateRef.current = fechaHoyStr;
        // Re-verificar festivo para el nuevo día
        try {
          let onlineNow = false;
          try { onlineNow = await syncManager.isOnline() && !syncManager.getIsBackendDown(); } catch (e) { }
          if (!onlineNow) {
            // Offline: consultar SQLite con la nueva fecha
            try {
              const festivoNuevoDia = await sqliteManager.getDiaFestivo(fechaHoyStr);
              if (festivoNuevoDia) {
                setDiaFestivo({ nombre: festivoNuevoDia.nombre, tipo: festivoNuevoDia.tipo });
              } else {
                setDiaFestivo(null);
              }
            } catch (e) {
              setDiaFestivo(null);
            }
          }
          // Si está online cargarDatos completo no es necesario; el preflight lo manejará
        } catch (e) { }
      }

      if (ticksRef.current % 15 === 0) {
        await actualizarEstadoPreflight();
      }


      if (ticksRef.current % 60 === 0) {
        try {
          let onlineNow = false;
          try { onlineNow = await syncManager.isOnline(); } catch (e) { }
          setIsOnline(onlineNow);

          const [nuevoHorario, resultadoRegistro] = await Promise.all([
            obtenerHorario(),
            obtenerUltimoRegistro()]
          );
          if (nuevoHorario) {
            setHorarioInfo(nuevoHorario);
            horarioInfoRef.current = nuevoHorario;
          }
          if (resultadoRegistro) {
            const { ultimo: nuevoUltimo, todos: nuevosTodos } = resultadoRegistro;
            setUltimoRegistroHoy(nuevoUltimo);
            setRegistrosHoyTodos(nuevosTodos);
            ultimoRegistroHoyRef.current = nuevoUltimo;
            registrosHoyTodosRef.current = nuevosTodos;
          }
        } catch (_e) { }
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [obtenerHorario, obtenerUltimoRegistro, actualizarEstadoPreflight]);

  // Limpiar el estado optimista silenciosamente cuando la sincronización rechaza o completa un registro,
  // sin forzar cambios de modo (usandoEstadoBackend) que causen parpadeo en la UI.
  useEffect(() => {
    const handleSyncUpdate = async () => {
      try {
        const resultado = await obtenerUltimoRegistro();
        if (resultado) {
          const { ultimo, todos } = resultado;
          setUltimoRegistroHoy(ultimo);
          setRegistrosHoyTodos(todos);
          ultimoRegistroHoyRef.current = ultimo;
          registrosHoyTodosRef.current = todos;
        }
      } catch (_) { }
    };
    const subRechazado = DeviceEventEmitter.addListener('sync_rechazado', handleSyncUpdate);
    const subCompletado = DeviceEventEmitter.addListener('sync_completado', handleSyncUpdate);
    return () => {
      subRechazado.remove();
      subCompletado.remove();
    };
  }, [obtenerUltimoRegistro]);

  useEffect(() => {
    const salidasHechas = (registrosHoyTodos || []).filter(r => r.tipo === 'salida').length;
    const bloquesTotales = horarioInfo?.bloques?.length || 0;

    // Si el estado dictó bloque completo (sea por el preflight recién, o por un caché viejo que se quedó trabado)
    // verificamos localmente si llegaron turnos nuevos que no han sido suplidos.
    if (estadoHorario === 'bloque_completo' && horarioInfo) {
      if (salidasHechas < bloquesTotales) {
        setPuedeRegistrar(false);
        setTipoSiguienteRegistro('entrada');
        setEstadoHorario('espera');
        setJornadaCompletada(false);
        setMensajeEspera('Espera un momento antes de registrar el siguiente turno.');
        return;
      }
    }

    // Si viene del backend y no es bloque completo y fue resuelto online, no peleamos
    // EXCEPCIÓN: si el siguiente tipo es salida, NO saltamos — la validación de ventana
    // de tiempo SIEMPRE debe aplicarse localmente incluso en modo online.
    if (usandoEstadoBackend && estadoHorario !== 'bloque_completo') {
      return;
    }

    if (!horarioInfo && !diaFestivo) return;

    if (diaFestivo) {
      setPuedeRegistrar(false);
      setTipoSiguienteRegistro('entrada');
      setEstadoHorario('dia_festivo');
      setJornadaCompletada(false);
      setMensajeEspera('');
      return;
    }

    if (!horarioInfo?.trabaja) {
      setPuedeRegistrar(false);
      setTipoSiguienteRegistro('entrada');
      setEstadoHorario('fuera_horario');
      setJornadaCompletada(false);
      setMensajeEspera('');
      return;
    }

    if (!ultimoRegistroHoy) {
      const ANTICIPO = horarioInfo?.tolerancias?.anticipoEntrada ?? 0;
      const primerBloque = horarioInfo?.bloques?.[0];

      if (primerBloque) {
        const ahoraMinsNow = horaActual.getHours() * 60 + horaActual.getMinutes();
        const minutosParaAbrir = primerBloque.entrada - ANTICIPO;

        if (ahoraMinsNow < minutosParaAbrir) {
          setPuedeRegistrar(false);
          setTipoSiguienteRegistro('entrada');
          setEstadoHorario('fuera_horario');
          setJornadaCompletada(false);
          setMensajeEspera('Aún no es hora de registrar tu entrada.');
          return;
        }
      }

      setPuedeRegistrar(true);
      setTipoSiguienteRegistro('entrada');
      setEstadoHorario(null);
      setJornadaCompletada(false);
      setMensajeEspera('');
      return;
    }

    const ultimoEstado = ultimoRegistroHoy.estado;
    const ultimoTipo = ultimoRegistroHoy.tipo;

    const ESTADOS_FALTA = ['falta', 'falta_directa', 'falta_automatica'];
    if (ultimoTipo === 'entrada' && ESTADOS_FALTA.includes(ultimoEstado)) {
      const numEntradas = (registrosHoyTodos || []).filter(r => r.tipo === 'entrada').length;
      const numBloques = horarioInfo?.bloques?.length || 0;
      const tieneMasBloques = numBloques > numEntradas;

      setPuedeRegistrar(true);
      setTipoSiguienteRegistro('entrada');
      setEstadoHorario(tieneMasBloques ? 'activo' : 'falta_previa');
      setJornadaCompletada(false);
      setMensajeEspera(tieneMasBloques
        ? 'Tu entrada anterior fue marcada como falta. Ya puedes registrar la entrada de tu siguiente turno.'
        : 'Tu entrada fue registrada como falta. Puedes registrar un nuevo turno extra si lo requieres.');
      return;
    }

    if (ultimoTipo === 'salida') {
      const salidasEnLista = (registrosHoyTodos || []).filter(r => r.tipo === 'salida');
      const numSalidas = salidasEnLista.length;

      if (estadoHorario === 'bloque_completo') setEstadoHorario('activo');
      setJornadaCompletada(false);

      const msSinceUltimaSalida = Math.abs(Date.now() - new Date(ultimoRegistroHoy.fecha_registro).getTime());
      if (msSinceUltimaSalida < 60 * 1000) {
        setPuedeRegistrar(false);
        setTipoSiguienteRegistro('entrada');
        setEstadoHorario('espera');
        setMensajeEspera('Espera un momento antes de registrar el siguiente turno.');
        return;
      }

      const bloqueProximo = horarioInfo?.bloques?.[numSalidas];
      const ANTICIPO_ENT = horarioInfo?.tolerancias?.anticipoEntrada ?? 0;
      const ahoraMinsNow = horaActual.getHours() * 60 + horaActual.getMinutes();

      if (!bloqueProximo) {
        // Se permite registrar un turno extra manual (ej. offline o no programado)
        setPuedeRegistrar(true);
        setTipoSiguienteRegistro('entrada');
        setEstadoHorario('turno_extra');
        setJornadaCompletada(false);
        setMensajeEspera('Has completado tus turnos de hoy. Puedes registrar un turno extra si es necesario.');
        return;
      }

      if (ahoraMinsNow < bloqueProximo.entrada - ANTICIPO_ENT) {
        setPuedeRegistrar(false);
        setTipoSiguienteRegistro('entrada');
        setEstadoHorario('fuera_horario');
        setMensajeEspera(`Próximo turno a las ${String(Math.floor(bloqueProximo.entrada / 60)).padStart(2, '0')}:${String(bloqueProximo.entrada % 60).padStart(2, '0')}`);
        return;
      }

      setPuedeRegistrar(true);
      setTipoSiguienteRegistro('entrada');
      setEstadoHorario('activo');
      setMensajeEspera('');
      return;
    }

    // ── Validar ventana de SALIDA ──
    const msSinceUltimaEntrada = Math.abs(Date.now() - new Date(ultimoRegistroHoy.fecha_registro).getTime());
    if (msSinceUltimaEntrada < 60 * 1000) {
      setPuedeRegistrar(false);
      setTipoSiguienteRegistro('salida');
      setEstadoHorario('espera');
      setJornadaCompletada(false);
      setMensajeEspera('Espera un momento antes de registrar la salida.');
      return;
    }

    const ANTICIPO_SALIDA_LOCAL = horarioInfo?.tolerancias?.anticipoSalida ?? 0;
    const POSTERIOR_SALIDA_LOCAL = horarioInfo?.tolerancias?.posteriorSalida ?? 0;
    const numSalidasOffline = (registrosHoyTodos || []).filter(r => r.tipo === 'salida').length;
    const totalBloques = horarioInfo?.bloques?.length || 0;
    
    // Si ya completó los bloques locales pero necesita salir de nuevo (ej. turno extra del admin),
    // o si no tiene bloques configurados, permitimos la salida libremente.
    if (numSalidasOffline >= totalBloques || totalBloques === 0) {
      setPuedeRegistrar(true);
      setTipoSiguienteRegistro('salida');
      setEstadoHorario(ultimoEstado);
      setJornadaCompletada(false);
      setMensajeEspera('Turno extra o horario libre detectado.');
      return;
    }

    const bloqueActualSalida = horarioInfo?.bloques?.[numSalidasOffline];

    if (bloqueActualSalida) {
      const ahoraMinsNow = horaActual.getHours() * 60 + horaActual.getMinutes();
      const inicioVentanaSalida = bloqueActualSalida.salida - ANTICIPO_SALIDA_LOCAL;
      const finVentanaSalida = bloqueActualSalida.salida + POSTERIOR_SALIDA_LOCAL;

      if (ahoraMinsNow < inicioVentanaSalida) {
        setPuedeRegistrar(false);
        setTipoSiguienteRegistro('salida');
        setEstadoHorario('fuera_horario');
        setJornadaCompletada(false);
        setMensajeEspera('Aún no es hora de registrar tu salida.');
        return;
      }

      if (POSTERIOR_SALIDA_LOCAL > 0 && ahoraMinsNow > finVentanaSalida) {
        setPuedeRegistrar(false);
        setTipoSiguienteRegistro('salida');
        setEstadoHorario('fuera_horario');
        setJornadaCompletada(false);
        setMensajeEspera('Ha superado el tiempo límite permitido para registrar la salida.');
        return;
      }
    }

    setPuedeRegistrar(true);
    setTipoSiguienteRegistro('salida');
    setEstadoHorario(ultimoEstado);
    setJornadaCompletada(false);
    setMensajeEspera('');

  }, [horarioInfo, ultimoRegistroHoy, registrosHoyTodos, diaFestivo, usandoEstadoBackend, horaActual]);




  const obtenerUltimoRegistro = useCallback(async () => {
    try {
      const empleadoId = userData?.empleado_id;
      if (!empleadoId) return { ultimo: null, todos: [] };

      const online = await syncManager.isOnline() && !syncManager.getIsBackendDown();

      if (online) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);
          const response = await fetch(
            `${API_URL}/asistencias/empleado/${empleadoId}`,
            {
              headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.data?.length) {
              const hoy = new Date().toDateString();

              const registrosHoy = data.data.filter((r) =>
                new Date(r.fecha_registro).toDateString() === hoy
              );

              if (registrosHoy.length > 0) {

                Promise.all(registrosHoy.map((r) =>
                  saveOnlineAsistenciaToCache({
                    id: r.id,
                    empleado_id: empleadoId,
                    tipo: r.tipo,
                    estado: r.estado,
                    fecha_registro: r.fecha_registro,
                    dispositivo_origen: r.dispositivo_origen,
                    departamento_id: r.departamento_id
                  })
                )).catch(() => { });

                const ultimoRaw = registrosHoy[0];
                const ultimo = {
                  tipo: ultimoRaw.tipo,
                  estado: ultimoRaw.estado,
                  fecha_registro: new Date(ultimoRaw.fecha_registro),
                  hora: new Date(ultimoRaw.fecha_registro).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit'
                  }),
                  totalRegistrosHoy: registrosHoy.length
                };

                const todos = [...registrosHoy].
                  sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro)).
                  map((r) => ({
                    tipo: r.tipo,
                    estado: r.estado,
                    fecha_registro: new Date(r.fecha_registro)
                  }));
                return { ultimo, todos };
              }
            }
          }
        } catch (e) {
          (function () { })('Online fetch failed, falling back to offline');
        }
      }


      const registrosOffline = await sqliteManager.getRegistrosHoy(empleadoId);

      if (registrosOffline && registrosOffline.length > 0) {
        const ultimoRaw = registrosOffline[registrosOffline.length - 1];
        const ultimo = {
          tipo: ultimoRaw.tipo,
          estado: ultimoRaw.estado,
          fecha_registro: new Date(ultimoRaw.fecha_registro),
          hora: new Date(ultimoRaw.fecha_registro).toLocaleTimeString('es-MX', {
            hour: '2-digit', minute: '2-digit'
          }),
          totalRegistrosHoy: registrosOffline.length
        };
        const todos = registrosOffline.map((r) => ({
          tipo: r.tipo,
          estado: r.estado,
          fecha_registro: new Date(r.fecha_registro)
        }));
        return { ultimo, todos };
      }

      return { ultimo: null, todos: [] };
    } catch (err) {
      return { ultimo: null, todos: [] };
    }
  }, [userData]);

  const obtenerHorario = useCallback(async () => {
    try {
      const empleadoId = userData?.empleado_id;
      if (!empleadoId) return null;

      let horario = null;
      const online = await syncManager.isOnline() && !syncManager.getIsBackendDown();

      if (online) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);
          const response = await fetch(
            `${API_URL}/empleados/${empleadoId}/horario`,
            {
              headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            }
          );
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            horario = data.data || data.horario || data;
          }
        } catch (e) { (function () { })('Online horario failed'); }
      }

      if (!horario) {
        const hLocal = await sqliteManager.getHorario(empleadoId);
        if (hLocal) horario = hLocal;
      }
      // ── Obtener tolerancia: API (online) → SQLite (offline/fallback) ──
      let toleranciasSqlite = null;
      if (online) {
        try {
          const tolCtrl = new AbortController();
          const tolTimer = setTimeout(() => tolCtrl.abort(), 20000);
          const tolRes = await fetch(`${API_URL}/movil/sync/mis-datos?empleado_id=${empleadoId}`, {
            headers: { 'Authorization': `Bearer ${userData.token}`, 'Content-Type': 'application/json' },
            signal: tolCtrl.signal
          });
          clearTimeout(tolTimer);
          if (tolRes.ok) {
            const tolJson = await tolRes.json();
            if (tolJson.success && tolJson.tolerancia) toleranciasSqlite = tolJson.tolerancia;
          }
        } catch (_e) { /* cae a SQLite */ }
      }
      if (!toleranciasSqlite) {
        try { toleranciasSqlite = await sqliteManager.getTolerancia(empleadoId); } catch (_e) { }
      }
      if (!horario?.configuracion) return { trabaja: false, numTurnos: 0, entrada: null, salida: null };

      let config = typeof horario.configuracion === 'string' ?
        JSON.parse(horario.configuracion) :
        horario.configuracion;

      const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

      const diaHoy = dias[new Date().getDay()];
      let turnosHoy = [];

      if (config.configuracion_semanal) {

        const keyEncontrada = Object.keys(config.configuracion_semanal).find(
          (k) => k.toLowerCase() === diaHoy
        );
        if (keyEncontrada) {
          turnosHoy = config.configuracion_semanal[keyEncontrada].map((t) => ({
            entrada: t.inicio || t.entrada,
            salida: t.fin || t.salida
          }));
        }
      }
      if (turnosHoy.length === 0 && config.dias) {
        const tieneHoy = config.dias.some((d) => d.toLowerCase() === diaHoy);
        if (tieneHoy) turnosHoy = (config.turnos || []).map((t) => ({
          entrada: t.inicio || t.entrada,
          salida: t.fin || t.salida
        }));
      }

      if (!turnosHoy || turnosHoy.length === 0) {
        return { trabaja: false, numBloques: 0, entrada: null, salida: null };
      }



      // No fusionar turnos a menos que sean literalmente continuos (sin descanso intermedio)
      const INTERVALO_FUSION = 0;
      const rangos = turnosHoy.
        map((t) => {
          const [he, me] = (t.entrada || '00:00').split(':').map(Number);
          const [hs, ms] = (t.salida || '00:00').split(':').map(Number);
          return { entrada: he * 60 + me, salida: hs * 60 + ms };
        }).
        sort((a, b) => a.entrada - b.entrada);

      const bloques = [];
      let bActual = { ...rangos[0] };
      for (let i = 1; i < rangos.length; i++) {
        const sep = rangos[i].entrada - bActual.salida;
        if (sep <= INTERVALO_FUSION) {
          bActual.salida = Math.max(bActual.salida, rangos[i].salida);
        } else {
          bloques.push({ ...bActual });
          bActual = { ...rangos[i] };
        }
      }
      bloques.push(bActual);


      const minToHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      return {
        trabaja: true,
        numBloques: bloques.length,
        bloques,
        tolerancias: {
          anticipoEntrada: parseInt(toleranciasSqlite?.minutos_anticipado_max ?? config?.minutos_anticipado_max) || 0,
          anticipoSalida: parseInt(toleranciasSqlite?.minutos_anticipo_salida ?? config?.minutos_anticipo_salida) || 0,
          posteriorSalida: parseInt(toleranciasSqlite?.minutos_posterior_salida ?? config?.minutos_posterior_salida) || 0
        },
        // Objeto completo de tolerancia (con reglas dinámicas) para evaluación offline
        toleranciaCompleta: toleranciasSqlite || null,
        turnosHoy, // guardamos los turnos sin fusionar para evaluadorAsistencias
        entrada: minToHHMM(bloques[0].entrada),
        salida: minToHHMM(bloques[bloques.length - 1].salida)
      };
    } catch (err) {
      return null;
    }
  }, [userData]);



  const obtenerDepartamentos = useCallback(async () => {
    try {
      const departamentosAsignados = userData?.empleadoInfo?.departamentos;

      if (!departamentosAsignados || departamentosAsignados.length === 0) {
        return [];
      }

      const promesas = departamentosAsignados.map(async (depto) => {
        try {
          const online = await syncManager.isOnline() && !syncManager.getIsBackendDown();
          if (online) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            const response = await fetch(
              `${API_URL}/departamentos/${depto.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${userData.token}`,
                  'Content-Type': 'application/json'
                },
                signal: controller.signal
              }
            );
            clearTimeout(timeoutId);
            if (response.ok) {
              const data = await response.json();
              return data.data || data;
            }
          }
          return null;
        } catch (err) {
          return null;
        }
      });

      let resultados = await Promise.all(promesas);
      resultados = resultados.filter((d) => d !== null);

      if (resultados.length === 0) {
        const cached = await sqliteManager.getDepartamentos(userData.empleado_id);
        if (cached && cached.length > 0) {
          resultados = cached.map((c) => ({
            id: c.departamento_id,
            nombre: c.nombre,
            ubicacion: c.ubicacion || null,
            es_activo: c.es_activo
          }));
        }
      }

      return resultados;
    } catch (err) {
      return [];
    }
  }, [userData]);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);

      try {
        let onlineNow = false;
        let reachable = false;
        try {
          const state = await NetInfo.fetch();
          onlineNow = state.isConnected;
          reachable = state.isInternetReachable;
        } catch (e) { }

        setIsOnline(onlineNow);
        setInternetReachable(reachable !== false && onlineNow);


        const tzDate = new Date();
        const tzOffset = tzDate.getTimezoneOffset() * 60000;
        const hoyStr = new Date(tzDate.getTime() - tzOffset).toISOString().split('T')[0];

        if (onlineNow && !syncManager.getIsBackendDown()) {
          try {
            const yearActual = new Date().getFullYear();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            const festivoResp = await fetch(
              `${API_URL}/dias-festivos?year=${yearActual}`,
              {
                headers: { 'Authorization': `Bearer ${userData.token}`, 'Content-Type': 'application/json' },
                signal: controller.signal
              }
            );
            clearTimeout(timeoutId);
            if (festivoResp.ok) {
              const festivoData = await festivoResp.json();
              const festivosObligatorios = (festivoData.data || []).filter(
                (f) => f.es_obligatorio && f.es_activo && f.fecha?.split('T')[0] === hoyStr
              );
              if (festivosObligatorios.length > 0) {
                const diaFest = { nombre: festivosObligatorios[0].nombre, tipo: festivosObligatorios[0].tipo };
                setDiaFestivo(diaFest);
                // Guardar en SQLite oficial para el modo offline
                try {
                  await sqliteManager.upsertDiasFestivos([{
                    fecha: hoyStr,
                    nombre: diaFest.nombre,
                    tipo: diaFest.tipo
                  }]);
                } catch (e) { }
              } else {
                setDiaFestivo(null);
                // No hay API nativa expuesta para borrar un festivo individual desde el client frontend, 
                // pero si no detecta hoy no pasa nada, en el fetch original se filtra limpiamente.
              }
            }
          } catch (_e) { }
        } else {
          // OFFLINE: Recuperar el día festivo oficial de SQLite
          try {
            const cachedFestivo = await sqliteManager.getDiaFestivo(hoyStr);
            if (cachedFestivo) {
              setDiaFestivo({ nombre: cachedFestivo.nombre, tipo: cachedFestivo.tipo });
            } else {
              setDiaFestivo(null);
            }
          } catch (e) { }
        }


        const [resultadoRegistro, horario, deptos, omis] = await Promise.all([
          obtenerUltimoRegistro(),
          obtenerHorario(),
          obtenerDepartamentos(),
          sqliteManager.getOmisionesGlobales()]
        );

        const { ultimo, todos } = resultadoRegistro || { ultimo: null, todos: [] };
        setUltimoRegistroHoy(ultimo);
        setRegistrosHoyTodos(todos);
        setHorarioInfo(horario);
        setDepartamentos(deptos);
        setOmisionesGlobales(omis || null);


        await actualizarEstadoPreflight();



      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [obtenerUltimoRegistro, obtenerHorario, obtenerDepartamentos]);

  // Escuchar actualizaciones de configuración provenientes del pull sync
  // para refrescar el estado de omisiones de GPS en tiempo real sin afectar el flujo online
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('config_actualizada', async () => {
      try {
        const omis = await sqliteManager.getOmisionesGlobales();
        setOmisionesGlobales(omis || null);
      } catch (_) { }
    });
    return () => subscription.remove();
  }, []);



  useEffect(() => {
    let locationSubscription = null;

    if (!puedeRegistrar && !forzarUbicacion) {
      setUbicacionActual(null);
      return;
    }

    const iniciarUbicacion = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        try {
          const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
          if (lastKnown) {
            setUbicacionActual({
              lat: lastKnown.coords.latitude,
              lng: lastKnown.coords.longitude,
              mocked: lastKnown.mocked || false
            });
          }
        } catch (e) { }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5
          },
          (newLocation) => {
            setUbicacionActual({
              lat: newLocation.coords.latitude,
              lng: newLocation.coords.longitude,
              mocked: newLocation.mocked || false
            });
          }
        );
      } catch (err) {
      }
    };

    iniciarUbicacion();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [puedeRegistrar, forzarUbicacion]);

  const tieneOmisionGps = React.useMemo(() => {
    if (!omisionesGlobales?.omision_gps_activa) return false;
    const empleadosOmitidos = omisionesGlobales.omision_gps_empleados || [];
    const empIdStr = String(userData?.empleado_id);
    const usuIdStr = userData?.id ? String(userData.id) : null;
    return empleadosOmitidos.includes(empIdStr) || (usuIdStr && empleadosOmitidos.includes(usuIdStr));
  }, [omisionesGlobales, userData]);

  useEffect(() => {
    const validarArea = async () => {
      const omitirGps = tieneOmisionGps;

      if (!ubicacionActual || !departamentos.length) {
        if (!omitirGps) {
          setDentroDelArea(false);
          setDepartamentosDisponibles([]);
          setDepartamentoSeleccionado(null);
          return;
        }
      }

      const deptsDisponibles = [];

      for (const depto of departamentos) {
        try {
          if (!depto.ubicacion) {
            if (omitirGps) deptsDisponibles.push(depto);
            continue;
          }

          const coordenadas = extraerCoordenadas(depto.ubicacion);
          let dentro = false;
          if (coordenadas && coordenadas.length >= 3 && ubicacionActual) {
            dentro = isPointInPolygon(ubicacionActual, coordenadas);
          }

          if (dentro || omitirGps) {
            deptsDisponibles.push(depto);
          }
        } catch (err) {
          if (omitirGps) deptsDisponibles.push(depto);
          continue;
        }
      }

      setDepartamentosDisponibles(deptsDisponibles);
      setDentroDelArea(omitirGps || deptsDisponibles.length > 0);

      if (deptsDisponibles.length > 0 && !departamentoSeleccionado) {
        setDepartamentoSeleccionado(deptsDisponibles[0]);
      }

      if (departamentoSeleccionado && !deptsDisponibles.find((d) => d.id === departamentoSeleccionado.id)) {
        setDepartamentoSeleccionado(deptsDisponibles[0] || null);
      }
    };

    validarArea();

  }, [ubicacionActual, departamentos, omisionesGlobales, userData]);

  const handleVerificarPin = async (pin) => {
    let pinVerificado = false;

    try {
      const resultado = await verificarPin(
        userData.empleado_id,
        pin,
        userData.token
      );

      if (resultado.success && resultado.data?.valido) {
        pinVerificado = true;
      } else {
        throw new Error('PIN incorrecto');
      }
    } catch (e) {
      if (e.message === 'PIN incorrecto') {
        setRegistrando(false);
        throw e;
      }

      const esErrorDeRed =
        e.message.includes('Network request failed') ||
        e.message.includes('Failed to fetch') ||
        e.message.includes('Timeout') ||
        e.message.includes('network') ||
        e.message.includes('Servidor inactivo') ||
        e.message.includes('JSON') ||
        e.name === 'AbortError';


      if (!esErrorDeRed) {
        setRegistrando(false);
        throw e;
      }

      (function () { })('PIN online falló por red, intentando offline...');

      const identified = await offlineAuthService.identificarPorPinOffline(pin);
      if (identified && String(identified.empleado_id) === String(userData.empleado_id)) {
        pinVerificado = true;
      } else {
        setRegistrando(false);
        throw new Error('PIN incorrecto');
      }
    }

    if (pinVerificado) {
      setMostrarPinAuth(false);
      setMostrarAutenticacion(false);
      procederConRegistro();
    }
  };

  const handleAutenticacionHuella = async () => {
    try {
      datosRegistroRef.current.metodo = 'HUELLA';
      setMostrarAutenticacion(false);
      setRegistrando(true);

      const resultado = await capturarHuellaDigital(userData.empleado_id);

      if (resultado.success) {
        setRegistrando(false);
        showCustomAlert(
          'Doble Seguridad',
          'Huella verificada localmente.\n\nPor favor, realiza el reconocimiento facial para completar tu registro.',
          [{ text: 'Continuar a Cámara', onPress: () => setMostrarCapturaFacial(true) }]
        );
      } else {
        throw new Error('Autenticación biométrica fallida');
      }
    } catch (error) {
      let mensaje = 'No se pudo verificar tu identidad';

      if (error.message?.includes('cancelada') || error.message?.includes('cancel')) {
        mensaje = 'Autenticación cancelada';
      } else if (error.message?.includes('sensor') || error.message?.includes('hardware')) {
        mensaje = 'No se detectó el sensor de huella. Verifica que tu dispositivo tenga sensor biométrico.';
      } else if (error.message) {
        mensaje = error.message;
      }

      showCustomAlert(
        'Error de Autenticación',
        mensaje,
        [{ text: 'OK' }]
      );
      setRegistrando(false);
    }
  };

  const handleAutenticacionFacial = async () => {
    try {
      datosRegistroRef.current.metodo = 'FACIAL';
      setMostrarAutenticacion(false);
      setMostrarCapturaFacial(true);
    } catch (error) {
      showCustomAlert(
        'Error',
        error.message || 'No se pudo iniciar la captura facial',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFacialCaptureComplete = async (captureData) => {
    setMostrarCapturaFacial(false);
    setRegistrando(true);

    try {
      (function () { })(' Captura facial completada para autenticación de registro');

      if (!captureData.faceDetectionUsed || !captureData.validated) {
        throw new Error('No se detectó un rostro válido en la captura');
      }

      const faceFeatures = processFaceData(captureData.faceData);
      const validation = validateFaceQuality(faceFeatures);

      if (!validation.isValid) {
        (function () { })('️ Validación de calidad falló:', validation.errors);
        showCustomAlert(
          'Calidad insuficiente',
          validation.errors.join('\n') + '\n\n¿Deseas intentar de nuevo?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setRegistrando(false) },
            { text: 'Reintentar', onPress: () => setMostrarCapturaFacial(true) }]

        );
        setRegistrando(false);
        return;
      }

      (function () { })(' Validación facial detectó rostro de calidad, enviando imagen al servidor para verificar identidad...');

      const empleadoId = userData?.empleado?.id || userData?.empleado_id || userData?.id;

      try {
        const response = await fetch(`${API_URL}/credenciales/facial/verify-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          },
          body: JSON.stringify({
            empleado_id: empleadoId,
            imagen_base64: captureData.photoBase64
          })
        });

        const verification = await response.json();

        if (!response.ok || !verification.success) {
          (function () { })(' Verificación facial falló en el servidor:', verification);
          showCustomAlert(
            'Identidad no verificada',
            verification.message || 'El rostro capturado no coincide con tu registro.',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setRegistrando(false) },
              { text: 'Reintentar', onPress: () => setMostrarCapturaFacial(true) }]
          );
          setRegistrando(false);
          return;
        }

        (function () { })(` Identidad verificada (${verification.data?.matchScore || 100}% similitud), procediendo con el registro`);
      } catch (networkError) {
        (function () { })(' Error de red en verificación facial. El servidor validará cuando esté disponible.');
      }

      datosRegistroRef.current.payloadBiometrico = captureData.photoBase64;
      await procederConRegistro();
    } catch (error) {
      (function () { })(' Error en autenticación facial:', error);
      showCustomAlert(
        'Error de Autenticación',
        error.message || 'No se pudo verificar tu identidad',
        [{ text: 'OK' }]
      );
      setRegistrando(false);
    }
  };

  const handleFacialCaptureCancel = () => {
    setMostrarCapturaFacial(false);
    setRegistrando(false);
  };

  const procederConRegistro = async () => {
    try {
      const departamento = datosRegistroRef.current.departamento;
      let ubicacionFinal = datosRegistroRef.current.ubicacion;



      const tipoActual = tipoSiguienteRegistroRef.current;

      try {
        const location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            maximumAge: 3000
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))]
        );
        ubicacionFinal = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          mocked: location.mocked || false
        };
      } catch (locationError) { (function () { })('Location real-time failed, using last known'); }

      if (ubicacionFinal?.mocked) {
        setRegistrando(false);
        throw new Error('Se ha detectado el uso de una aplicación para simular la ubicación (GPS Fake). Por políticas de la empresa, el registro ha sido bloqueado.');
      }

      if (!ubicacionFinal || !ubicacionFinal.lat || !ubicacionFinal.lng) {
        throw new Error('No se pudo obtener la ubicación');
      }

      if (!departamento || !departamento.id) {
        throw new Error('No se pudo obtener el departamento');
      }

      let omitirGpsError = false;
      const cachedOmis = await sqliteManager.getOmisionesGlobales();
      if (cachedOmis?.omision_gps_activa) {
        const empOmis = cachedOmis.omision_gps_empleados || [];
        const empIdStr = String(userData?.empleado_id);
        const usuIdStr = userData?.id ? String(userData.id) : null;
        if (empOmis.includes(empIdStr) || (usuIdStr && empOmis.includes(usuIdStr))) {
          omitirGpsError = true;
        }
      }

      if (departamento.ubicacion && !omitirGpsError) {
        const coordsDepto = extraerCoordenadas(departamento.ubicacion);
        if (coordsDepto && coordsDepto.length >= 3) {
          const dentroAhora = isPointInPolygon(ubicacionFinal, coordsDepto);
          if (!dentroAhora) {
            throw new Error('Te has movido fuera de la zona permitida. Regresa al área del departamento para registrar tu asistencia.');
          }
        }
      }

      setRegistrando(true);


      let networkIp = null;
      let networkWifi = null;
      try {
        const netState = await NetInfo.fetch();
        networkIp = netState.details?.ipAddress || null;

        if (netState.type === 'wifi') {
          networkWifi = { tipo: netState.type, isConnected: netState.isConnected };
        }
      } catch (netErr) {
        (function () { })('No se pudo obtener la IP local:', netErr);
      }

      const payload = {
        empleado_id: userData.empleado_id,
        empresa_id: userData.empresa_id,
        dispositivo_origen: 'movil',
        ubicacion: [ubicacionFinal.lat, ubicacionFinal.lng],
        departamento_id: departamento.id,
        ip: networkIp,
        wifi: networkWifi,
        fecha_captura: getTrustedDate().toISOString()
      };

      let success = false;
      let data = null;


      const MAX_RETRIES = 5;
      let attempt = 0;

      while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s por intento

          const response = await fetch(`${API_URL}/asistencias/registrar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const responseText = await response.text();

          if (response.status === 502 || response.status === 500) {
            throw new Error('Server Error');
          }

          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            throw new Error('Error del servidor: respuesta inválida');
          }

          if (!response.ok) {
            const errorMsg = data.message || data.error || `Error del servidor (${response.status})`;

            const isDuplicateError = errorMsg.toLowerCase().includes('minuto') || 
                                     errorMsg.toLowerCase().includes('reciente') ||
                                     data.estadoHorario === 'espera';

            // Si estamos en un reintento y el servidor nos dice que ya registramos muy rápido,
            // significa que el intento anterior sí se guardó pero la red falló.
            if (attempt > 1 && isDuplicateError) {
              success = true;
              data = { data: { tipo: tipoActual, estado: 'registrado' } };
              break;
            }

            if (data.noPuedeRegistrar === true && data.estadoHorario === 'espera') {
              data.noPuedeRegistrar = false;
              data.estadoHorario = 'activo';
            }

            if (data.noPuedeRegistrar === true) {
              setPuedeRegistrar(false);
              if (data.estadoHorario) setEstadoHorario(data.estadoHorario);
              setMensajeEspera(data.mensaje || '');
              return;
            }
            throw new Error(errorMsg);
          }

          success = true;

          try {
            await saveOnlineAsistenciaToCache({
              id: data?.data?.id || `local_online_${Date.now()}`,
              empleado_id: payload.empleado_id,
              tipo: data?.data?.tipo || tipoActual,
              estado: data?.data?.estado || (tipoActual === 'salida' ? 'salida_puntual' : 'pendiente'),
              fecha_registro: getTrustedDate().toISOString(),
              dispositivo_origen: 'movil',
              departamento_id: payload.departamento_id
            });
          } catch (cacheErr) {
            (function () { })('No crítico: no se pudo cachear registro online:', cacheErr.message);
          }

        } catch (e) {
          const esErrorDeRed =
            e.message === 'Server Error' ||
            e.message.includes('Network request failed') ||
            e.message.includes('Failed to fetch') ||
            e.message.includes('Timeout') ||
            e.message.includes('network') ||
            e.name === 'AbortError';

          if (!esErrorDeRed) {
            throw e; // Si es error del usuario o 4xx, salir inmediatamente
          }

          if (attempt < MAX_RETRIES) {
            (function () { })(`Intento ${attempt} fallido, reintentando en 3s...`, e.message);
            await new Promise(res => setTimeout(res, 3000));
          } else {
            (function () { })(`Error de red tras ${MAX_RETRIES} intentos, guardando offline:`, e.message);
          }
        }
      }

      if (!success) {
        (function () { })('Saving offline attendance...');
        await sqliteManager.saveOfflineAsistencia({
          ...payload,
          tipo: tipoActual,
          estado: 'pendiente',
          metodo_registro: datosRegistroRef.current.metodo || 'PIN',
          fecha_registro: getTrustedDate().toISOString(),
          ubicacion: payload.ubicacion || [ubicacionFinal.lat, ubicacionFinal.lng],
          ip: networkIp || null,
          wifi: networkWifi || null,
          payload_biometrico: datosRegistroRef.current.payloadBiometrico
        });
        data = {
          data: {
            tipo: tipoActual,
            estado: 'pendiente',
            _offline: true
          }
        };
      }


      const tipoRegistrado = data?.data?.tipo || tipoActual;

      // ─── Estado offline ───
      // Si el registro fue online, el backend ya calcula el estado real (fuente de verdad).
      // Si fue offline, siempre mostramos 'pendiente' al usuario — el servidor lo analizará
      // cuando se sincronice. No evaluamos falta/retardo localmente para no confundir.
      const esOffline = data?.data?._offline === true;
      let estadoRegistrado = data?.data?.estado;
      if (esOffline) {
        estadoRegistrado = 'pendiente';
      }

      const registroOptimista = {
        tipo: tipoRegistrado,
        estado: estadoRegistrado,
        fecha_registro: new Date()
      };
      const todosOptimistas = [...(registrosHoyTodosRef.current || []), registroOptimista];
      const ultimoOptimista = {
        tipo: tipoRegistrado,
        estado: estadoRegistrado,
        fecha_registro: registroOptimista.fecha_registro,
        hora: registroOptimista.fecha_registro.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        totalRegistrosHoy: todosOptimistas.length
      };
      registrosHoyTodosRef.current = todosOptimistas;
      ultimoRegistroHoyRef.current = ultimoOptimista;


      const resultadoNuevo = await obtenerUltimoRegistro();
      const { ultimo: nuevoUltimo, todos: nuevosTodos } = resultadoNuevo || { ultimo: null, todos: [] };
      setUltimoRegistroHoy(nuevoUltimo);
      setRegistrosHoyTodos(nuevosTodos);
      ultimoRegistroHoyRef.current = nuevoUltimo;
      registrosHoyTodosRef.current = nuevosTodos;


      await actualizarEstadoPreflight();


      const tipoMayuscula = tipoRegistrado === 'entrada' ? 'Entrada' : 'Salida';
      const horaStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      Vibration.vibrate(500);

      if (esOffline) {
        showCustomAlert(
          'Pendiente a revisar',
          `Departamento: ${departamento.nombre}\n\nHora: ${horaStr}\n\nUna vez que haya conexión a internet, el sistema analizará y clasificará tu asistencia automáticamente.`,
          [{ text: 'Entendido' }]
        );
        notificarRegistro(tipoRegistrado, 'pendiente');
      } else {
        let estadoTexto;
        if (tipoRegistrado === 'salida') {
          estadoTexto = (estadoRegistrado === 'salida_temprana' || estadoRegistrado === 'salida_temprano')
            ? 'salida anticipada' : 'salida registrada';
        } else if (estadoRegistrado === 'entrada_temprana') {
          estadoTexto = 'entrada anticipada';
        } else if (estadoRegistrado === 'puntual') {
          estadoTexto = 'puntual';
        } else {
          estadoTexto = estadoRegistrado?.replace(/_/g, ' ') || 'registrado';
        }
        showCustomAlert(
          'Registro Exitoso',
          `${tipoMayuscula}: ${estadoTexto}\n\nDepartamento: ${departamento.nombre}\n\nHora: ${horaStr}`,
          [{ text: 'OK' }]
        );
        notificarRegistro(tipoRegistrado, estadoRegistrado);
      }

      if (onRegistroExitoso) {
        onRegistroExitoso(data);
      }
    } catch (err) {
      showCustomAlert('Error', err.message || 'No se pudo registrar', [{ text: 'OK' }]);
    } finally {
      setRegistrando(false);
    }
  };


  const handleRegistro = async () => {
    if (registrando) return;

    // Bloqueo inmediato en día festivo — antes de cualquier otra validación
    if (diaFestivo) {
      showCustomAlert(
        'Día Festivo',
        `Hoy es ${diaFestivo.nombre}.\n\nEl registro de asistencia no está disponible en días festivos obligatorios.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (!userData || !userData.empleado_id || !userData.token) {
      showCustomAlert('Error', 'No se pudo identificar tu información de usuario. Intenta cerrar sesión y volver a iniciar.');
      return;
    }

    if (!userData.es_empleado) {
      showCustomAlert('Sin acceso', 'Solo empleados pueden registrar asistencia. Tu cuenta no está asociada a un empleado.', [{ text: 'Entendido' }]);
      return;
    }

    if (!horarioInfo) {
      showCustomAlert('Error', 'No tienes un horario configurado. Contacta al administrador.', [{ text: 'OK' }]);
      return;
    }


    const continuarProcesoRegistro = () => {
      if (!puedeRegistrar || !dentroDelArea || !departamentoSeleccionado) {
        let mensaje = 'No puedes registrar en este momento';

        if (!dentroDelArea) {
          mensaje = 'Debes estar dentro de un área permitida';
        } else if (!departamentoSeleccionado) {
          mensaje = 'Selecciona un departamento para registrar';
        } else if (estadoHorario === 'falta_previa') {
          showCustomAlert(
            'Aviso de Falta',
            'Tu entrada anterior fue marcada como falta. Se recomienda esperar a tu siguiente turno, ¿deseas continuar con un nuevo registro?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Continuar', onPress: () => {
                  setRegistrando(true);
                  setMostrarAutenticacion(true);
                }
              }
            ]
          );
          return;
        } else if (jornadaCompletada || estadoHorario === 'bloque_completo') {
          mensaje = 'Ya completaste tu jornada de hoy';
        } else if (estadoHorario === 'tiempo_insuficiente') {
          mensaje = `Aún no puedes salir.\n\n${mensajeEspera}`;
        } else if (estadoHorario === 'fuera_horario' || estadoHorario === 'sin_horario') {
          mensaje = 'Estás fuera de tu horario laboral';
        } else if (!horarioInfo.trabaja) {
          mensaje = 'No tienes horario configurado para hoy';
        }
        showCustomAlert('No disponible', mensaje, [{ text: 'Entendido' }]);
        return;
      }

      if (!ubicacionActual || !ubicacionActual.lat || !ubicacionActual.lng) {
        showCustomAlert('Error', 'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.');
        return;
      }

      if (ubicacionActual.mocked) {
        showCustomAlert(
          'Bloqueo de Seguridad',
          'Se ha detectado el uso de una aplicación para simular la ubicación (GPS Fake). Por políticas de seguridad, no podras registrar tu asistencia.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      if (!credencialesUsuario?.tiene_pin && !credencialesUsuario?.tiene_dactilar) {
        showCustomAlert(
          'Configuración Requerida',
          'Debes configurar al menos un método de autenticación (PIN o Huella) antes de registrar asistencias.\n\nVe a Configuración > Seguridad para configurar.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      datosRegistroRef.current = {
        ubicacion: ubicacionActual,
        departamento: departamentoSeleccionado
      };

      setRegistrando(true);
      setMostrarAutenticacion(true);
    };


    continuarProcesoRegistro();
  };

  const getButtonColor = () => {
    if (estadoHorario === 'espera') return '#f59e0b';
    if (jornadaCompletada) return '#6b7280';
    if (estadoHorario === 'dia_festivo' || diaFestivo) return '#8b5cf6';
    if (estadoHorario === 'falta_previa') return '#6b7280';
    if (!dentroDelArea || !puedeRegistrar) return '#ef4444';
    if (!tipoSiguienteRegistro) return '#6b7280';

    if (tipoSiguienteRegistro === 'salida') return '#10b981';
    return '#10b981';
  };

  const getIcon = () => {
    if (estadoHorario === 'espera') return 'hourglass-outline';
    if (jornadaCompletada) return 'checkmark-done-circle';
    if (estadoHorario === 'dia_festivo' || diaFestivo) return 'calendar-outline';
    if (estadoHorario === 'falta_previa') return 'alert-circle-outline';
    if (!dentroDelArea) return 'location';
    if (!puedeRegistrar) return 'time';
    if (!tipoSiguienteRegistro) return 'sync';
    if (tipoSiguienteRegistro === 'salida') return 'log-out';
    return 'log-in';
  };

  const getStatusText = () => {
    if (estadoHorario === 'espera') return 'Espera requerida';
    if (jornadaCompletada) return 'Jornada completada';
    if (estadoHorario === 'dia_festivo' || diaFestivo) return diaFestivo ? `Día festivo: ${diaFestivo.nombre}` : 'Día festivo';
    if (estadoHorario === 'falta_previa') return 'Falta registrada — turno cerrado';
    if (estadoHorario === 'bloque_completo') return 'Bloque completado';
    if (estadoHorario === 'turno_extra') return 'Turno extra disponible';
    if (!dentroDelArea) return 'Fuera del área';
    if (!puedeRegistrar) return 'Fuera de horario';
    if (!tipoSiguienteRegistro) return 'Calculando estado...';
    if (tipoSiguienteRegistro === 'salida' || tipoSiguienteRegistro === 'entrada' || tipoSiguienteRegistro) {
      if (tieneOmisionGps) return 'GPS Omitido';
      if (departamentoSeleccionado) return departamentoSeleccionado.nombre;
      return 'Zona permitida';
    }

    return 'Zona permitida';
  };

  const getButtonText = () => {
    if (estadoHorario === 'espera') return 'Espera temporal activa';
    if (jornadaCompletada || estadoHorario === 'bloque_completo') return 'Jornada completada';
    if (estadoHorario === 'dia_festivo' || diaFestivo) return 'Día festivo';
    if (estadoHorario === 'falta_previa') return 'Turno cerrado por falta';
    if (!puedeRegistrar || !dentroDelArea || !tipoSiguienteRegistro) return 'No disponible';
    return `Registrar ${tipoSiguienteRegistro === 'entrada' ? 'Entrada' : 'Salida'}`;
  };

  const puedePresionarBoton = puedeRegistrar && !diaFestivo && dentroDelArea && !jornadaCompletada && !registrando && departamentoSeleccionado && tipoSiguienteRegistro;

  // Render de Captura Facial
  if (mostrarCapturaFacial) {
    return (
      <FacialCaptureScreen
        onCapture={handleFacialCaptureComplete}
        onCancel={handleFacialCaptureCancel}
        darkMode={darkMode} />);


  }

  // Aquí se renderiza la vista principal del botón
  return (
    <>
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: `${getButtonColor()}15` }]}>
            {loading || !tipoSiguienteRegistro ?
              <ActivityIndicator size="small" color={getButtonColor()} /> :

              <Ionicons name={getIcon()} size={16} color={getButtonColor()} />
            }
            <Text style={[styles.statusText, { color: getButtonColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Hora actual</Text>
            <Text style={styles.timeValue}>
              {horaActual.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>

          {!loading && !jornadaCompletada &&
            <View style={styles.statusIndicators}>
              <View style={styles.indicator}>
                <Ionicons
                  name={dentroDelArea ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={dentroDelArea ? '#10b981' : '#ef4444'} />

                <Text style={[styles.indicatorText, { color: dentroDelArea || tieneOmisionGps ? '#10b981' : '#ef4444' }]}>
                  {tieneOmisionGps ? 'Zona libre' : dentroDelArea ? 'Dentro de zona' : 'Fuera de zona'}
                </Text>
              </View>

              <View style={styles.indicator}>
                <Ionicons
                  name={
                    estadoHorario === 'espera' ? 'hourglass-outline' :
                      !puedeRegistrar ? 'time-outline' :
                        tipoSiguienteRegistro === 'salida' ? 'log-out' : 'log-in'
                  }
                  size={16}
                  color={
                    estadoHorario === 'espera' ? '#f59e0b' :
                      !puedeRegistrar ? '#ef4444' :
                        tipoSiguienteRegistro === 'salida' ? '#10b981' : '#10b981'
                  } />

                <Text style={[
                  styles.indicatorText,
                  {
                    color: estadoHorario === 'espera' ? '#f59e0b' :
                      !puedeRegistrar ? '#ef4444' :
                        tipoSiguienteRegistro === 'salida' ? '#10b981' : '#10b981'
                  }]
                }>
                  {estadoHorario === 'espera' ?
                    '1 min. entre registros' :
                    estadoHorario === 'falta_previa' ?
                      'Turno cerrado (falta)' :
                      estadoHorario === 'bloque_completo' ?
                        'Bloque completado' :
                        !puedeRegistrar ?
                          'Fuera de horario' :
                          tipoSiguienteRegistro === 'salida' ?
                            'Siguiente: Salida' :
                            'Siguiente: Entrada'
                  }
                </Text>
              </View>
            </View>
          }

          {!loading &&
            <>
              {departamentosDisponibles.length > 0 || tieneOmisionGps ?
                <TouchableOpacity
                  style={styles.locationInfo}
                  onPress={() => { if (!tieneOmisionGps) setMostrarDepartamentos(true); }}
                  activeOpacity={0.7}>

                  <Ionicons name={tieneOmisionGps ? "shield-checkmark" : "location"} size={14} color="#10b981" />
                  <Text style={[styles.locationText, { color: '#10b981' }]} numberOfLines={1}>
                    {tieneOmisionGps
                      ? "GPS Omitido"
                      : departamentoSeleccionado ?
                        departamentoSeleccionado.nombre :
                        `${departamentosDisponibles.length} ${departamentosDisponibles.length === 1 ? 'disponible' : 'disponibles'}`
                    }
                  </Text>
                  {departamentosDisponibles.length > 1 && !tieneOmisionGps &&
                    <Ionicons name="chevron-down" size={14} color="#10b981" style={{ marginLeft: 4 }} />
                  }
                </TouchableOpacity> :

                <View style={[styles.locationInfo, { backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}>
                  <Ionicons name="location-outline" size={16} color={darkMode ? "#f87171" : "#dc2626"} />
                  <Text style={[styles.locationText, { color: darkMode ? "#f87171" : "#dc2626" }]} numberOfLines={1}>
                    Fuera de zona
                  </Text>
                </View>
              }

              {internetReachable ?
                <TouchableOpacity
                  style={styles.viewMapButton}
                  onPress={() => {
                    setMostrarMapa(true);
                    setForzarUbicacion(true);
                  }}
                  activeOpacity={0.7}>

                  <Ionicons
                    name="map-outline"
                    size={16}
                    color={darkMode ? "#60a5fa" : "#2563eb"}
                  />
                  <Text style={styles.viewMapText}>
                    Ver mapa
                  </Text>
                </TouchableOpacity> :

                <View style={[styles.viewMapButton, { backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.1)' : '#f3f4f6' }]}>
                  <Ionicons name="cloud-offline-outline" size={16} color="#9ca3af" />
                  <Text style={[styles.viewMapText, { color: '#9ca3af' }]}>Sin conexión</Text>
                </View>
              }
            </>
          }

          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: getButtonColor() },
              !puedePresionarBoton && styles.registerButtonDisabled]
            }
            onPress={handleRegistro}
            disabled={!puedePresionarBoton}
            activeOpacity={0.7}>

            {registrando ?
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.registerButtonText}>Registrando...</Text>
              </> :

              <>
                <Ionicons
                  name={estadoHorario === 'espera' ? 'hourglass-outline' : puedePresionarBoton ? 'finger-print' : jornadaCompletada ? 'checkmark-done' : 'lock-closed'}
                  size={20}
                  color="#fff" />

                <Text style={styles.registerButtonText}>
                  {getButtonText()}
                </Text>
              </>
            }
          </TouchableOpacity>


        </View>
      </View>

      <Modal
        visible={mostrarAutenticacion}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setRegistrando(false);
          setMostrarAutenticacion(false);
        }}>

        <View style={styles.modalOverlay}>
          <View style={styles.authModalContent}>
            <View style={styles.authHeader}>
              <Ionicons name="shield-checkmark" size={48} color="#2563eb" />
              <Text style={styles.authTitle}>Verificar Identidad</Text>
              <Text style={styles.authSubtitle}>
                Elige cómo deseas autenticarte
              </Text>
            </View>

            <View style={styles.authMethodsContainer}>
              {metodosDisponibles.
                map((metodo) =>
                  <TouchableOpacity
                    key={metodo.id}
                    style={styles.authMethodCard}
                    onPress={getHandlerForMetodo(metodo.id)}
                    activeOpacity={0.7}>

                    <View style={styles.authMethodIcon}>
                      <Ionicons name={metodo.icono} size={32} color="#2563eb" />
                    </View>
                    <Text style={styles.authMethodName}>{metodo.nombre}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
              style={styles.authCancelButton}
              onPress={() => {
                setRegistrando(false);
                setMostrarAutenticacion(false);
              }}>

              <Text style={styles.authCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PinInputModal
        visible={mostrarPinAuth}
        onClose={() => {
          setRegistrando(false);
          setMostrarPinAuth(false);
        }}
        onConfirm={handleVerificarPin}
        title="Verificar PIN"
        subtitle="Ingresa tu PIN de seguridad"
        darkMode={darkMode}
        requireConfirmation={false} />


      {departamentosDisponibles.length > 0 &&
        <Modal
          visible={mostrarDepartamentos}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setMostrarDepartamentos(false)}>

          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMostrarDepartamentos(false)}>

            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Departamentos Disponibles</Text>
                <TouchableOpacity
                  onPress={() => setMostrarDepartamentos(false)}
                  style={styles.modalCloseButton}>

                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.departamentosList}>
                {departamentosDisponibles.map((depto, index) => {
                  const esSeleccionado = departamentoSeleccionado?.id === depto.id;

                  return (
                    <TouchableOpacity
                      key={depto.id || index}
                      style={[
                        styles.departamentoItem,
                        esSeleccionado && styles.departamentoItemActivo]
                      }
                      onPress={() => {
                        setDepartamentoSeleccionado(depto);
                        setMostrarDepartamentos(false);
                      }}
                      activeOpacity={0.7}>

                      <View style={styles.departamentoInfo}>
                        <View style={styles.departamentoHeader}>
                          <Ionicons
                            name={esSeleccionado ? 'location' : 'location-outline'}
                            size={20}
                            color={esSeleccionado ? '#10b981' : '#6b7280'} />

                          <Text style={[
                            styles.departamentoNombre,
                            esSeleccionado && styles.departamentoNombreActivo]
                          }>
                            {depto.nombre}
                          </Text>
                        </View>

                        {esSeleccionado &&
                          <View style={styles.departamentoBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                            <Text style={styles.departamentoBadgeText}>Seleccionado para registro</Text>
                          </View>
                        }
                      </View>

                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>);

                })}
              </ScrollView>
              <View style={styles.modalFooter}>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={16} color="#3b82f6" />
                  <Text style={styles.infoBoxText}>
                    Estás dentro de {departamentosDisponibles.length} {departamentosDisponibles.length === 1 ? 'departamento' : 'departamentos'}. Selecciona uno para registrar.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      }

      {departamentos.length > 0 &&
        <Modal
          visible={mostrarMapa}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setMostrarMapa(false);
            setForzarUbicacion(false);
          }}>

          <MapaZonasPermitidas
            departamento={departamentoSeleccionado}
            departamentos={departamentos}
            ubicacionActual={ubicacionActual}
            onClose={() => {
              setMostrarMapa(false);
              setForzarUbicacion(false);
            }}
            onDepartamentoSeleccionado={(depto) => {
              if (departamentosDisponibles.find((d) => d.id === depto.id)) {
                setDepartamentoSeleccionado(depto);
              }
            }}
            darkMode={darkMode} />

        </Modal>
      }

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

    </>);

};

export default RegisterButton;