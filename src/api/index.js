const API_URL = 'http://localhost:8000/api';

export const api = {
  // Auth
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  register: async (data) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Register failed');
    return res.json();
  },

  getMe: async (token) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Dashboard
  getDashboard: async (token, mes, anio) => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);
    params.append('_t', Date.now()); // Cache bust
    const res = await fetch(`${API_URL}/dashboard?${params}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json();
  },

  // Transacciones
  getTransacciones: async (token, params = {}) => {
    const query = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/transacciones?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error fetching transactions' }));
      throw new Error(error.detail || 'Error fetching transactions');
    }
    return res.json();
  },

  createTransaccion: async (token, data) => {
    const res = await fetch(`${API_URL}/transacciones`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Error creating transaction');
    }
    return res.json();
  },

  updateTransaccion: async (token, id, data) => {
    const res = await fetch(`${API_URL}/transacciones/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteTransaccion: async (token, id) => {
    const res = await fetch(`${API_URL}/transacciones/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(error.detail || 'Delete failed');
    }
    return res.json().catch(() => ({}));
  },

  // Categorías
  getCategorias: async (token) => {
    const res = await fetch(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error fetching categorias' }));
      throw new Error(error.detail || 'Error fetching categorias');
    }
    return res.json();
  },

  createCategoria: async (token, data) => {
    const res = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Presupuestos
  getPresupuestos: async (token, mes, anio) => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);
    const res = await fetch(`${API_URL}/presupuestos?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getResumen502030: async (token, mes, anio) => {
    const res = await fetch(`${API_URL}/presupuestos/resumen-50-30-20?mes=${mes}&anio=${anio}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Inversión
  getInversion: async (token, mes, anio) => {
    const res = await fetch(`${API_URL}/inversion/recomendaciones?mes=${mes}&anio=${anio}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Deudas
  getDeudas: async (token) => {
    const res = await fetch(`${API_URL}/deudas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Suscripciones
  getSuscripciones: async (token) => {
    const res = await fetch(`${API_URL}/suscripciones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createSuscripcion: async (token, data) => {
    const res = await fetch(`${API_URL}/suscripciones`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error creating subscription' }));
      throw new Error(error.detail || 'Error creating subscription');
    }
    return res.json();
  },

  getResumenSuscripciones: async (token) => {
    const res = await fetch(`${API_URL}/suscripciones/resumen`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Cuentas
  getCuentas: async (token) => {
    const res = await fetch(`${API_URL}/cuentas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Error fetching cuentas' }));
      throw new Error(error.detail || 'Error fetching cuentas');
    }
    return res.json();
  },

  createCuenta: async (token, data) => {
    const res = await fetch(`${API_URL}/cuentas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateCuenta: async (token, cuentaId, data) => {
    const res = await fetch(`${API_URL}/cuentas/${cuentaId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteCuenta: async (token, cuentaId) => {
    const res = await fetch(`${API_URL}/cuentas/${cuentaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(error.detail || 'Delete failed');
    }
    return res.json().catch(() => ({}));
  },

  transferirEntreCuentas: async (token, data) => {
    const res = await fetch(`${API_URL}/cuentas/transferir`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Transfer failed' }));
      throw new Error(error.detail || 'Transfer failed');
    }
    return res.json();
  },

  crearTransaccionDividida: async (token, data) => {
    const res = await fetch(`${API_URL}/transacciones/dividir`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Tarjetas de Crédito
  getTarjetas: async (token) => {
    const res = await fetch(`${API_URL}/tarjetas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createTarjeta: async (token, data) => {
    const res = await fetch(`${API_URL}/tarjetas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateTarjeta: async (token, tarjetaId, data) => {
    const res = await fetch(`${API_URL}/tarjetas/${tarjetaId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteTarjeta: async (token, tarjetaId) => {
    const res = await fetch(`${API_URL}/tarjetas/${tarjetaId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(error.detail || 'Delete failed');
    }
    return res.json().catch(() => ({}));
  },

  getResumenCuentas: async (token) => {
    const res = await fetch(`${API_URL}/cuentas/resumen`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Metas
  getMetas: async (token) => {
    const res = await fetch(`${API_URL}/metas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createMeta: async (token, data) => {
    const res = await fetch(`${API_URL}/metas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  agregarAhorroMeta: async (token, metaId, monto) => {
    const res = await fetch(`${API_URL}/metas/${metaId}/agregar-ahorro`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ monto }),
    });
    return res.json();
  },

  // Exportar
  exportarCSV: async (token, anio, mes) => {
    const params = new URLSearchParams();
    if (anio) params.append('anio', anio);
    if (mes) params.append('mes', mes);
    const res = await fetch(`${API_URL}/exportar/csv?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.blob();
  },

  importarCSV: async (token, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/transacciones/importar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },

  // Fondo de Emergencia
  getFondoEmergencia: async (token, mes, anio, mesesObjetivo = 6) => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);
    params.append('meses_objetivo', mesesObjetivo);
    const res = await fetch(`${API_URL}/presupuestos/fondo-emergencia?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error fetching fondo de emergencia');
    return res.json();
  },

  getConfiguracionEsenciales: async (token) => {
    const res = await fetch(`${API_URL}/presupuestos/configuracion-esenciales`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error fetching configuracion');
    return res.json();
  },

  guardarConfiguracionEsenciales: async (token, configuraciones) => {
    const res = await fetch(`${API_URL}/presupuestos/configuracion-esenciales`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(configuraciones),
    });
    if (!res.ok) throw new Error('Error guardando configuracion');
    return res.json();
  },

  getFondoEmergenciaMovimientos: async (token) => {
    const res = await fetch(`${API_URL}/presupuestos/fondo-emergencia/movimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error fetching movimientos');
    return res.json();
  },

  addFondoEmergenciaMovimiento: async (token, movimiento) => {
    const res = await fetch(`${API_URL}/presupuestos/fondo-emergencia/movimientos`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(movimiento),
    });
    if (!res.ok) throw new Error('Error adding movimiento');
    return res.json();
  },

  deleteFondoEmergenciaMovimiento: async (token, movimientoId) => {
    const res = await fetch(`${API_URL}/presupuestos/fondo-emergencia/movimientos/${movimientoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error deleting movimiento');
    return res.json();
  },
};
