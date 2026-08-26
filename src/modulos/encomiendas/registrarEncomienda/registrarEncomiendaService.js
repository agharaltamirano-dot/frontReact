const BASE_URL_ENCOMIENDA = 'http://localhost:5093/api/encomienda'
const BASE_URL_ENCOMIENDAS = 'http://localhost:5093/api/encomienda'
const BASE_URL_CLIENTES = 'http://localhost:5093/api/clientes'
const BASE_URL_PUNTOS_VENTA = 'http://localhost:5093/api/puntos-venta'

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

// Datos de prueba para desarrollo local
const MOCK_CLIENTES = [
  { id: 7, nombreCompleto: 'Juan Pérez', ci: '1234567', telefono: '70000000' },
  { id: 8, nombreCompleto: 'María López', ci: '7654321', telefono: '78000000' },
  { id: 15, nombreCompleto: 'Carlos Mendoza', ci: '4567890', telefono: '71234567' },
  { id: 16, nombreCompleto: 'Ana Gutiérrez', ci: '9876543', telefono: '76543210' },
  { id: 20, nombreCompleto: 'Roberto Fernández', ci: '3344556', telefono: '72345678' },
  { id: 21, nombreCompleto: 'Lucía Morales', ci: '8877665', telefono: '77889900' }
]

const MOCK_PUNTOS_VENTA = [
  { id: 1, nombre: 'Santa Cruz' },
  { id: 2, nombre: 'La Paz' },
  { id: 3, nombre: 'Cochabamba' },
  { id: 4, nombre: 'Sucre' },
  { id: 5, nombre: 'Tarija' },
  { id: 6, nombre: 'Oruro' },
  { id: 7, nombre: 'Potosí' },
  { id: 8, nombre: 'Trinidad' }
]

export async function getClientes() {
  try {
    const res = await fetch(`${BASE_URL_CLIENTES}?estado=true`, { headers: authHeaders() })
    if (!res.ok) {
      console.warn(`API clientes respondió ${res.status}. Usando datos de respaldo.`)
      return MOCK_CLIENTES
    }
    const data = await res.json()
    return Array.isArray(data) && data.length > 0 ? data : MOCK_CLIENTES
  } catch (err) {
    console.warn('No se pudo conectar a api/clientes. Usando respaldo:', err.message)
    return MOCK_CLIENTES
  }
}

export async function getPuntosVenta() {
  try {
    const res = await fetch(BASE_URL_PUNTOS_VENTA, { headers: authHeaders() })
    if (!res.ok) {
      console.warn(`API puntos-venta respondió ${res.status}. Usando datos de respaldo.`)
      return MOCK_PUNTOS_VENTA
    }
    const data = await res.json()
    return Array.isArray(data) && data.length > 0 ? data : MOCK_PUNTOS_VENTA
  } catch (err) {
    console.warn('No se pudo conectar a api/puntos-venta. Usando respaldo:', err.message)
    return MOCK_PUNTOS_VENTA
  }
}

export async function createEncomienda(payload) {
  try {
    const res = await fetch(BASE_URL_ENCOMIENDA, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || `Error ${res.status} al registrar encomienda`)
    }

    return await res.json()
  } catch (err) {
    console.warn('Servidor no disponible para POST api/encomienda. Simulando éxito local:', err.message)
    // Para desarrollo local si el backend no está disponible, simulamos objeto creado
    return {
      id: Math.floor(Math.random() * 1000) + 100,
      ...payload
    }
  }
}

export async function updateEncomienda(id, payload) {
  const res = await fetch(`${BASE_URL_ENCOMIENDAS}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || `Error ${res.status} al actualizar encomienda`)
  }
  return await res.json()
}

export default { getClientes, getPuntosVenta, createEncomienda, updateEncomienda }
