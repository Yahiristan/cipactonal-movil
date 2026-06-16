import { getApiEndpoint } from '../config/api.js';
import fetchTimeout from './fetchTimeout.js';

const API_URL = getApiEndpoint('/api');




export const getIncidencias = async (token, filtros = {}) => {
  try {
    const params = new URLSearchParams();

    if (filtros.empleado_id) params.append('empleado_id', filtros.empleado_id);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros.limit) params.append('limit', filtros.limit);
    if (filtros.offset) params.append('offset', filtros.offset);

    const url = `${API_URL}/incidencias${params.toString() ? `?${params}` : ''}`;

    const response = await fetchTimeout(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};




export const getIncidenciasEmpleado = async (empleadoId, token, filtros = {}) => {
  try {
    return await getIncidencias(token, { ...filtros, empleado_id: empleadoId });
  } catch (error) {
    throw error;
  }
};




export const getIncidenciaById = async (incidenciaId, token) => {
  try {
    const response = await fetchTimeout(`${API_URL}/incidencias/${incidenciaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};




export const createIncidencia = async (incidenciaData, token) => {
  try {
    const formData = new FormData();
    formData.append('empleado_id', String(incidenciaData.empleado_id));
    formData.append('tipo', String(incidenciaData.tipo));
    if (incidenciaData.motivo) formData.append('motivo', String(incidenciaData.motivo));
    if (incidenciaData.observaciones) formData.append('observaciones', String(incidenciaData.observaciones));
    
    // Formatear fechas a YYYY-MM-DD
    if (incidenciaData.fecha_inicio) {
        formData.append('fecha_inicio', incidenciaData.fecha_inicio.split('T')[0]);
    }
    if (incidenciaData.fecha_fin) {
        formData.append('fecha_fin', incidenciaData.fecha_fin.split('T')[0]);
    }

    if (incidenciaData.archivos && incidenciaData.archivos.length > 0) {
      const archivo = incidenciaData.archivos[0];
      formData.append('archivo', {
        uri: archivo.uri,
        name: archivo.name,
        type: archivo.type
      });
    }

    const response = await fetchTimeout(`${API_URL}/incidencias`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }, 60000);

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      throw new Error(errorData.message || `Error del servidor (${response.status})`);
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    throw error;
  }
};




export const updateIncidencia = async (incidenciaId, incidenciaData, token) => {
  try {
    const formData = new FormData();
    if (incidenciaData.empleado_id) formData.append('empleado_id', String(incidenciaData.empleado_id));
    if (incidenciaData.tipo) formData.append('tipo', String(incidenciaData.tipo));
    if (incidenciaData.motivo) formData.append('motivo', String(incidenciaData.motivo));
    if (incidenciaData.observaciones) formData.append('observaciones', String(incidenciaData.observaciones));
    
    if (incidenciaData.fecha_inicio) formData.append('fecha_inicio', incidenciaData.fecha_inicio.split('T')[0]);
    if (incidenciaData.fecha_fin) formData.append('fecha_fin', incidenciaData.fecha_fin.split('T')[0]);
    
    if (incidenciaData.archivos && incidenciaData.archivos.length > 0) {
      const archivo = incidenciaData.archivos[0];
      formData.append('archivo', {
        uri: archivo.uri,
        name: archivo.name,
        type: archivo.type
      });
    }

    const response = await fetchTimeout(`${API_URL}/incidencias/${incidenciaId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }, 60000);

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      throw new Error(errorData.message || `Error del servidor (${response.status})`);
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    throw error;
  }
};




export const aprobarIncidencia = async (incidenciaId, observaciones, token) => {
  try {
    const response = await fetchTimeout(`${API_URL}/incidencias/${incidenciaId}/aprobar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ observaciones })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error del servidor (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};




export const rechazarIncidencia = async (incidenciaId, observaciones, token) => {
  try {
    const response = await fetchTimeout(`${API_URL}/incidencias/${incidenciaId}/rechazar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ observaciones })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error del servidor (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};




export const getIncidenciasPendientes = async (token) => {
  try {
    const response = await fetchTimeout(`${API_URL}/incidencias/pendientes`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export default {
  getIncidencias,
  getIncidenciasEmpleado,
  getIncidenciaById,
  createIncidencia,
  updateIncidencia,
  aprobarIncidencia,
  rechazarIncidencia,
  getIncidenciasPendientes
};