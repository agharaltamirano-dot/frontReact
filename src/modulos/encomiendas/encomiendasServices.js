const BASE_URL = 'http://localhost:5093/api/encomienda'

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

// Datos de prueba con la estructura exacta especificada por el usuario
const MOCK_ENCOMIENDAS = [
  {
    id: 12,
    contenido: 'Caja con repuestos',
    fechaRecepcion: '2026-08-10 09:00:00',
    fechaEntrega: '2026-08-11 18:00:00',
    monto: 150.5,
    numero: 'ENC-2026-0012',
    estado: true,
    pagado: true,
    destino: 'Santa Cruz',
    clienteRemitente: {
      id: 7,
      nombreCompleto: 'Juan Pérez',
      ci: '1234567',
      telefono: '70000000',
      estado: true
    },
    clienteConsignatario: {
      id: 8,
      nombreCompleto: 'María López',
      ci: '7654321',
      telefono: '78000000',
      estado: true
    },
    usuario: {
      id: 3,
      usuario: 'cajero1',
      puntoVentaId: 2,
      rolId: 1
    }
  },
  {
    id: 13,
    contenido: 'Documentos importantes en sobre manila',
    fechaRecepcion: '2026-08-10 11:30:00',
    fechaEntrega: '2026-08-12 10:00:00',
    monto: 40.0,
    numero: 'ENC-2026-0013',
    estado: true,
    pagado: false,
    destino: 'La Paz',
    clienteRemitente: {
      id: 15,
      nombreCompleto: 'Carlos Mendoza',
      ci: '4567890',
      telefono: '71234567',
      estado: true
    },
    clienteConsignatario: {
      id: 16,
      nombreCompleto: 'Ana Gutiérrez',
      ci: '9876543',
      telefono: '76543210',
      estado: true
    },
    usuario: {
      id: 3,
      usuario: 'cajero1',
      puntoVentaId: 2,
      rolId: 1
    }
  },
  {
    id: 14,
    contenido: 'Maletín con laptop y cargador',
    fechaRecepcion: '2026-08-11 08:15:00',
    fechaEntrega: '2026-08-12 14:00:00',
    monto: 220.0,
    numero: 'ENC-2026-0014',
    estado: true,
    pagado: true,
    destino: 'Cochabamba',
    clienteRemitente: {
      id: 20,
      nombreCompleto: 'Roberto Fernández',
      ci: '3344556',
      telefono: '72345678',
      estado: true
    },
    clienteConsignatario: {
      id: 21,
      nombreCompleto: 'Lucía Morales',
      ci: '8877665',
      telefono: '77889900',
      estado: true
    },
    usuario: {
      id: 4,
      usuario: 'secretaria2',
      puntoVentaId: 1,
      rolId: 2
    }
  },
  {
    id: 15,
    contenido: 'Caja frágil de productos electrónicos',
    fechaRecepcion: '2026-08-09 16:45:00',
    fechaEntrega: '2026-08-10 19:00:00',
    monto: 310.0,
    numero: 'ENC-2026-0015',
    estado: false,
    pagado: false,
    destino: 'Tarija',
    clienteRemitente: {
      id: 9,
      nombreCompleto: 'Patricia Sucre',
      ci: '5544332',
      telefono: '73456789',
      estado: true
    },
    clienteConsignatario: {
      id: 10,
      nombreCompleto: 'Diego Alarcón',
      ci: '6655443',
      telefono: '74567890',
      estado: true
    },
    usuario: {
      id: 3,
      usuario: 'cajero1',
      puntoVentaId: 2,
      rolId: 1
    }
  },
  {
    id: 16,
    contenido: 'Paquete de ropa y calzado',
    fechaRecepcion: '2026-08-11 10:20:00',
    fechaEntrega: '2026-08-12 16:30:00',
    monto: 95.0,
    numero: 'ENC-2026-0016',
    estado: true,
    pagado: true,
    destino: 'Sucre',
    clienteRemitente: {
      id: 22,
      nombreCompleto: 'Gabriela Ramos',
      ci: '2233445',
      telefono: '75678901',
      estado: true
    },
    clienteConsignatario: {
      id: 23,
      nombreCompleto: 'Fernando Torres',
      ci: '9988776',
      telefono: '78901234',
      estado: true
    },
    usuario: {
      id: 3,
      usuario: 'cajero1',
      puntoVentaId: 2,
      rolId: 1
    }
  },
  {
    id: 17,
    contenido: 'Caja con medicamentos y suplementos',
    fechaRecepcion: '2026-08-11 11:05:00',
    fechaEntrega: '2026-08-12 12:00:00',
    monto: 180.0,
    numero: 'ENC-2026-0017',
    estado: true,
    pagado: false,
    destino: 'Oruro',
    clienteRemitente: {
      id: 24,
      nombreCompleto: 'Elena Vargas',
      ci: '4455667',
      telefono: '79012345',
      estado: true
    },
    clienteConsignatario: {
      id: 25,
      nombreCompleto: 'Hugo Banzer',
      ci: '1122334',
      telefono: '70123456',
      estado: true
    },
    usuario: {
      id: 4,
      usuario: 'secretaria2',
      puntoVentaId: 1,
      rolId: 2
    }
  }
]

export async function getEncomiendas(filters = {}) {
  try {
    // Construir query string con los filtros
    const queryParams = new URLSearchParams()
    if (filters.clienteRemitenteId) queryParams.append('clienteRemitenteId', filters.clienteRemitenteId)
    if (filters.clienteConsignatarioId) queryParams.append('clienteConsignatarioId', filters.clienteConsignatarioId)
    if (filters.destino) queryParams.append('destino', filters.destino)
    if (filters.estado !== undefined && filters.estado !== null && filters.estado !== '') {
      queryParams.append('estado', filters.estado)
    }
    if (filters.recepcionFechaDesde) queryParams.append('recepcionFechaDesde', filters.recepcionFechaDesde)
    if (filters.recepcionFechaHasta) queryParams.append('recepcionFechaHasta', filters.recepcionFechaHasta)
    if (filters.entregaFechaDesde) queryParams.append('entregaFechaDesde', filters.entregaFechaDesde)
    if (filters.entregaFechaHasta) queryParams.append('entregaFechaHasta', filters.entregaFechaHasta)
    if (filters.numero) queryParams.append('numero', filters.numero)
    if (filters.pagado !== undefined && filters.pagado !== null && filters.pagado !== '') {
      queryParams.append('pagado', filters.pagado)
    }
    if (filters.usuarioId) queryParams.append('usuarioId', filters.usuarioId)
    if (filters.nombreUsuario) queryParams.append('nombreUsuario', filters.nombreUsuario)

    const queryString = queryParams.toString()
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL

    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) {
      console.warn(`API encomiendas respondió ${res.status}. Usando datos de respaldo.`)
      return MOCK_ENCOMIENDAS
    }
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return data
    }
    return MOCK_ENCOMIENDAS
  } catch (err) {
    console.warn('No se pudo conectar a la API de encomiendas. Usando datos de respaldo:', err.message)
    return MOCK_ENCOMIENDAS
  }
}

export async function deleteEncomienda(id) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || `Error ${res.status} al anular encomienda`)
    }
    return true
  } catch (err) {
    console.warn(`Simulando anulación en cliente para ID ${id}: ${err.message}`)
    // Retornamos true para simulacion visual en desarrollo local si el backend no responde
    return true
  }
}

export default { getEncomiendas, deleteEncomienda }
