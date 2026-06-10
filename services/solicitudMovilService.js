import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiEndpoint from '../config/api';

const API_BASE_URL = getApiEndpoint('/api');
const TIMEOUT_MS = 30000;

// Helper: fetch con timeout + token automático (equivale al axios interceptor)
const apiFetch = async (path, options = {}, tokenOverride = null, attempt = 1) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let token = tokenOverride;
    if (!token) {
      try { token = await AsyncStorage.getItem('@auth_token'); } catch (_) {}
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    const text = await response.text();
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }

    // Simular shape de axios: { data, status, response }
    if (!response.ok) {
      const err = new Error(data?.message || data?.error || `Error ${response.status}`);
      err.response = { status: response.status, data };
      throw err;
    }

    return { data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);

    // Auto-retry once for the Android cold-start "Network request failed" bug
    if (attempt === 1 && error.message === 'Network request failed') {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return apiFetch(path, options, tokenOverride, 2);
    }

    if (error.name === 'AbortError') {
      const err = new Error(`No se pudo conectar con el servidor en ${API_BASE_URL}. Verifica tu conexión.`);
      err.request = true;
      throw err;
    }
    if (!error.response) {
      error.request = true;
    }
    throw error;
  }
};

export const crearSolicitudMovil = async (data) => {
  try {
    const payload = {
      tipo: 'movil',
      nombre: data.nombre,
      descripcion: data.descripcion,
      correo: data.correo,
      ip: data.ip,
      mac: data.mac,
      sistema_operativo: data.sistema_operativo,
      observaciones: data.observaciones,
      empresa_id: data.empresa_id
    };
    const response = await apiFetch('/solicitudes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return {
      id: response.data.data.id,
      token_solicitud: response.data.data.token,
      estado: response.data.data.estado
    };
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al crear solicitud');
    } else if (error.request) {
      throw new Error(`No se pudo conectar con el servidor en ${API_BASE_URL}. Verifica tu conexión y que el backend esté corriendo.`);
    } else {
      throw new Error('Error al configurar la solicitud');
    }
  }
};

export const reabrirSolicitudMovil = async (solicitudId, observaciones) => {
  try {
    const payload = {
      observaciones: observaciones || 'Solicitud reabierta desde dispositivo móvil'
    };
    const response = await apiFetch(`/solicitudes/${solicitudId}/pendiente`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    return {
      id: response.data.data.id,
      token_solicitud: response.data.data.token,
      estado: response.data.data.estado
    };
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400 && error.response.data?.message?.includes('ya está en estado pendiente')) {
        return { id: solicitudId, estado: 'pendiente', yaEstabaPendiente: true };
      }
      throw new Error(error.response.data.message || 'Error al reabrir solicitud');
    } else if (error.request) {
      throw new Error(`No se pudo conectar con el servidor en ${API_BASE_URL}`);
    } else {
      throw new Error('Error al configurar la solicitud');
    }
  }
};

export const getSolicitudPorToken = async (token) => {
  try {
    const response = await apiFetch(`/solicitudes/verificar/${token}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const notFoundError = new Error('Solicitud no encontrada');
      notFoundError.code = 'SOLICITUD_NOT_FOUND';
      notFoundError.status = 404;
      throw notFoundError;
    }
    throw new Error('Error al verificar el estado de la solicitud');
  }
};

export const verificarCorreoEnEmpresa = async (correo, empresaId, tokenOverride = null) => {
  try {
    if (!correo || !empresaId) {
      return { existe: false, mensaje: 'Correo o empresa no válidos' };
    }
    const correoLower = correo.trim().toLowerCase();
    try {
      const params = new URLSearchParams({ correo: correoLower, empresa_id: empresaId }).toString();
      const response = await apiFetch(
        `/empleados/verificar-correo?${params}`,
        { method: 'GET' },
        tokenOverride
      );
      if (response.data.success && response.data.data) {
        const empleado = response.data.data;
        return {
          existe: true,
          activo: empleado.es_activo,
          empleadoId: empleado.id,
          usuario: { id: empleado.usuario_id, nombre: empleado.nombre, correo: empleado.correo },
          mensaje: empleado.es_activo ? `Correo verificado: ${empleado.nombre}` : 'Usuario inactivo'
        };
      }
      return { existe: false, mensaje: 'Correo no encontrado en esta empresa' };
    } catch (error) {
      if (error.response?.status === 404) {
        return { existe: false, mensaje: 'Este correo no está registrado en la empresa' };
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          existe: true, activo: true, valido: true, pendienteValidacion: true, empleadoId: null,
          usuario: { nombre: correoLower.split('@')[0], correo: correoLower },
          mensaje: 'Se verificará al enviar la solicitud'
        };
      }
      throw error;
    }
  } catch (error) {
    return {
      existe: true, activo: true, valido: true, pendienteValidacion: true, empleadoId: null,
      usuario: { nombre: correo.split('@')[0], correo: correo.trim().toLowerCase() },
      mensaje: 'No se pudo verificar, se validará al enviar'
    };
  }
};

export const verificarEmpresa = async (empresaId, ip) => {
  try {
    if (!empresaId || empresaId.trim().length < 3) {
      return { existe: false, mensaje: 'Código de empresa inválido' };
    }
    try {
      const tokenResponse = await apiFetch('/auth/token-movil', {
        method: 'POST',
        body: JSON.stringify({ identificador: empresaId })
      });

      if (tokenResponse.data.success && tokenResponse.data.data) {
        const { empresa, token } = tokenResponse.data.data;
        await guardarToken(token);

        const response = await apiFetch('/solicitudes/validar-afiliacion', {
          method: 'POST',
          body: JSON.stringify({ identificador: empresaId, ip })
        }, token); // <-- Se pasa el token como override explícito

        if (response.data.success && response.data.data) {
          const { empresa: empresaValidada, validacionRed } = response.data.data;
          return {
            existe: true,
            id: empresaValidada.id,
            nombre: empresaValidada.nombre,
            logo: empresaValidada.logotipo || empresaValidada.logo || null,
            activa: empresaValidada.es_activo,
            fueraDeRed: validacionRed?.fueraDeRed || false,
            alertasRed: validacionRed?.alertas || [],
            token
          };
        }
      }
      return { existe: false, mensaje: 'Empresa no encontrada o no se pudo generar el token' };
    } catch (error) {
      if (error.response?.status === 404) return { existe: false, mensaje: 'Empresa no encontrada' };
      if (error.response?.status === 403) {
        return { existe: true, activa: false, mensaje: error.response?.data?.message || 'La empresa no está activa' };
      }
      if (error.response) {
        throw new Error(error.response.data?.message || `HTTP ${error.response.status} al verificar empresa`);
      }
      throw new Error(`Conexión fallida: ${error.message}`);
    }
  } catch (error) {
    throw error;
  }
};

export const guardarToken = async (token) => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
  } catch (_) {}
};

export const verificarDispositivoPorEmpleado = async (empleadoId, token) => {
  try {
    let dispositivosActivos = [];
    try {
      const syncResponse = await apiFetch(`/movil/sync/dispositivos/${empleadoId}`, {}, token);
      if (syncResponse.data.success) {
        dispositivosActivos = syncResponse.data.dispositivos || [];
      }
    } catch (_) {}

    if (dispositivosActivos.length > 0) {
      const dispositivoActivo = dispositivosActivos.find(d => d.es_activo === true);
      const dispositivo = dispositivoActivo || dispositivosActivos[0];
      if (dispositivo.es_activo !== undefined) {
        return {
          existe: true,
          activo: dispositivo.es_activo === true,
          dispositivo_id: dispositivo.id,
          sistema_operativo: dispositivo.sistema_operativo
        };
      }
    }

    try {
      const movilResponse = await apiFetch(`/movil/empleado/${empleadoId}`, {}, token);
      if (movilResponse.data.success && movilResponse.data.data) {
        const dispositivo = movilResponse.data.data;
        return {
          existe: true,
          activo: dispositivo.es_activo === true,
          dispositivo_id: dispositivo.id,
          sistema_operativo: dispositivo.sistema_operativo
        };
      }
    } catch (movilError) {
      if (movilError.response?.status === 404 || movilError.response?.status === 403) {
        return { existe: false, activo: false };
      }
      throw movilError;
    }

    return { existe: false, activo: false };
  } catch (error) {
    throw error;
  }
};

export const limpiarToken = async () => {
  try {
    await AsyncStorage.removeItem('@auth_token');
  } catch (_) {}
};