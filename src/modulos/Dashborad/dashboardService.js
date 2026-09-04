const BASE_ENCOMIENDAS = 'http://localhost:5093/api/encomienda'
const BASE_PASAJES = 'http://localhost:5093/api/pasajes'
const BASE_VEHICULOS = 'http://localhost:5093/api/vehiculos'
const BASE_HORARIOS = 'http://localhost:5093/api/horarios'

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

// Datos de respaldo estructurados para desarrollo / pruebas offline
const MOCK_ENCOMIENDAS = [
  { id: 1, numero: 'ENC-001', destino: 'Santa Cruz', monto: 150.5, fechaEntrega: '2026-08-11 18:00:00', estado: true, pagado: true },
  { id: 2, numero: 'ENC-002', destino: 'La Paz', monto: 40.0, fechaEntrega: null, estado: true, pagado: false },
  { id: 3, numero: 'ENC-003', destino: 'Cochabamba', monto: 220.0, fechaEntrega: '2026-08-12 14:00:00', estado: true, pagado: true },
  { id: 4, numero: 'ENC-004', destino: 'Tarija', monto: 310.0, fechaEntrega: null, estado: false, pagado: false }, // Anulada
  { id: 5, numero: 'ENC-005', destino: 'Sucre', monto: 95.0, fechaEntrega: null, estado: true, pagado: true }, // No entregada aún
  { id: 6, numero: 'ENC-006', destino: 'Oruro', monto: 180.0, fechaEntrega: null, estado: true, pagado: false }, // No entregada aún
  { id: 7, numero: 'ENC-007', destino: 'Santa Cruz', monto: 120.0, fechaEntrega: null, estado: true, pagado: true }, // No entregada aún
  { id: 8, numero: 'ENC-008', destino: 'La Paz', monto: 85.0, fechaEntrega: '2026-08-10 10:00:00', estado: true, pagado: true }
]

const MOCK_PASAJES = [
  { id: 101, destino: 'Santa Cruz', monto: 120, estado: true, reserva: false, fechaHora: '2026-08-11 08:30:00' },
  { id: 102, destino: 'Santa Cruz', monto: 120, estado: true, reserva: false, fechaHora: '2026-08-11 08:30:00' },
  { id: 103, destino: 'Cochabamba', monto: 100, estado: true, reserva: true, fechaHora: '2026-08-11 10:00:00' },
  { id: 104, destino: 'La Paz', monto: 150, estado: true, reserva: false, fechaHora: '2026-08-11 14:00:00' },
  { id: 105, destino: 'La Paz', monto: 150, estado: false, reserva: false, fechaHora: '2026-08-11 14:00:00' }, // Anulado
  { id: 106, destino: 'Tarija', monto: 90, estado: true, reserva: false, fechaHora: '2026-08-11 16:30:00' },
  { id: 107, destino: 'Santa Cruz', monto: 120, estado: true, reserva: false, fechaHora: '2026-08-11 20:00:00' },
  { id: 108, destino: 'Sucre', monto: 80, estado: true, reserva: false, fechaHora: '2026-08-11 21:00:00' }
]

const MOCK_VEHICULOS = [
  { id: 1, movil: '01', placa: '4059-ABC', estado: true },
  { id: 2, movil: '02', placa: '3122-XYZ', estado: true },
  { id: 3, movil: '03', placa: '1899-KLM', estado: false },
  { id: 4, movil: '04', placa: '5230-FGH', estado: true }
]

const MOCK_HORARIOS = [
  { id: 1, fecha: '2026-08-11', hora: '08:30', estado: true },
  { id: 2, fecha: '2026-08-11', hora: '10:00', estado: true },
  { id: 3, fecha: '2026-08-11', hora: '14:00', estado: true },
  { id: 4, fecha: '2026-08-11', hora: '18:00', estado: true }
]

async function safeFetch(url, fallbackData) {
  try {
    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) return fallbackData
    const data = await res.json()
    return Array.isArray(data) && data.length > 0 ? data : fallbackData
  } catch {
    return fallbackData
  }
}

/**
 * Obtiene y procesa todas las métricas agregadas del Dashboard
 */
export async function getDashboardData() {
  const [encomiendas, pasajes, vehiculos, horarios] = await Promise.all([
    safeFetch(BASE_ENCOMIENDAS, MOCK_ENCOMIENDAS),
    safeFetch(BASE_PASAJES, MOCK_PASAJES),
    safeFetch(BASE_VEHICULOS, MOCK_VEHICULOS),
    safeFetch(BASE_HORARIOS, MOCK_HORARIOS)
  ])

  // 1. ENCOMIENDAS
  const encomiendasActivas = encomiendas.filter(e => e.estado !== false)
  const totalEncomiendasCount = encomiendas.length
  
  // Regla especificada por el usuario:
  // fechaEntrega === null significa que NO recogieron aún (pendientes de recojo)
  const sinEntregarCount = encomiendas.filter(e => e.estado !== false && (e.fechaEntrega === null || e.fechaEntrega === undefined || e.fechaEntrega === '')).length
  const entregadasCount = encomiendas.filter(e => e.estado !== false && e.fechaEntrega !== null && e.fechaEntrega !== undefined && e.fechaEntrega !== '').length

  // REGLA SOLICITADA POR EL USUARIO:
  // La suma del total recaudado debe ser filtrada por encomienda.estado = true
  // Sumar solo encomiendas activas y cuya fecha de recepción/registro sea hoy
  const encomiendasHoy = encomiendas.filter(e => {
    try {
      const fechaRaw = e.fechaRecepcion || e.fechaEntrega || ''
      const fechaPart = String(fechaRaw || '').split(' ')[0]
      return fechaPart === new Date().toLocaleDateString('en-CA') && (e.estado === true || e.estado === undefined)
    } catch {
      return false
    }
  })

  const montoEncomiendasTotal = encomiendasHoy.reduce((sum, e) => sum + (Number(e.monto) || 0), 0)

  // Encomiendas por destino (encomienda.destino)
  const encomiendasDestinoMap = {}
  encomiendasActivas.forEach(e => {
    const dest = e.destino || 'Sin Destino'
    if (!encomiendasDestinoMap[dest]) {
      encomiendasDestinoMap[dest] = { destino: dest, cantidad: 0, montoTotal: 0, sinEntregar: 0 }
    }
    encomiendasDestinoMap[dest].cantidad += 1
    encomiendasDestinoMap[dest].montoTotal += (Number(e.monto) || 0)
    if (e.fechaEntrega === null || e.fechaEntrega === undefined || e.fechaEntrega === '') {
      encomiendasDestinoMap[dest].sinEntregar += 1
    }
  })

  const encomiendasPorDestinoList = Object.values(encomiendasDestinoMap)
    .sort((a, b) => b.cantidad - a.cantidad)
    .map(d => ({
      ...d,
      porcentaje: encomiendasActivas.length ? Math.round((d.cantidad / encomiendasActivas.length) * 100) : 0
    }))

  // 2. PASAJES
  const pasajesActivosList = pasajes.filter(p => p.estado !== false)
  const pasajesAnuladosCount = pasajes.filter(p => p.estado === false).length
  const totalPasajesCount = pasajes.length
  const pasajesReservasCount = pasajesActivosList.filter(p => p.reserva === true).length

  // Fecha de hoy en formato yyyy-MM-dd (local)
  const todayStr = new Date().toLocaleDateString('en-CA')

  // REGLA: sumar solo los pasajes cuya fecha (primer segmento de fechaHora) sea hoy
  const pasajesHoy = pasajes.filter(p => {
    try {
      const fechaPart = String(p.fechaHora || '').split(' ')[0]
      return fechaPart === todayStr && (p.estado === true || p.estado === undefined)
    } catch {
      return false
    }
  })

  const montoPasajesTotal = pasajesHoy.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)

  // Pasajes por destino (pasajes.destino -> destinos más concurridos)
  const pasajesDestinoMap = {}
  pasajesActivosList.forEach(p => {
    const dest = p.destino || 'Sin Destino'
    if (!pasajesDestinoMap[dest]) {
      pasajesDestinoMap[dest] = { destino: dest, cantidad: 0, montoTotal: 0 }
    }
    pasajesDestinoMap[dest].cantidad += 1
    pasajesDestinoMap[dest].montoTotal += (Number(p.monto) || 0)
  })

  const pasajesPorDestinoList = Object.values(pasajesDestinoMap)
    .sort((a, b) => b.cantidad - a.cantidad)
    .map(d => ({
      ...d,
      porcentaje: pasajesActivosList.length ? Math.round((d.cantidad / pasajesActivosList.length) * 100) : 0
    }))

  // 3. VEHÍCULOS
  const totalVehiculosCount = vehiculos.length
  const vehiculosActivosCount = vehiculos.filter(v => v.estado !== false).length

  // 4. HORARIOS
  const totalHorariosCount = horarios.length
  const horariosActivosCount = horarios.filter(h => h.estado !== false).length

  // REGLA SOLICITADA POR EL USUARIO: Suma global filtrada por estado = true
  // Ahora total recaudado considera solo registros correspondientes a la fecha de hoy
  const totalRecaudadoGlobal = montoEncomiendasTotal + montoPasajesTotal

  return {
    kpis: {
      totalRecaudadoGlobal,
      montoEncomiendasTotal,
      montoPasajesTotal,
      encomiendasSinEntregar: sinEntregarCount,
      encomiendasEntregadas: entregadasCount,
      totalEncomiendas: totalEncomiendasCount,
      // Número de pasajes vendidos hoy (filtrados por fecha)
      totalPasajesVendidos: pasajesHoy.length,
      pasajesAnulados: pasajesAnuladosCount,
      pasajesReservas: pasajesReservasCount,
      vehiculosActivos: vehiculosActivosCount,
      vehiculosTotal: totalVehiculosCount,
      horariosActivos: horariosActivosCount,
      horariosTotal: totalHorariosCount
    },
    encomiendasPorDestino: encomiendasPorDestinoList,
    pasajesPorDestino: pasajesPorDestinoList,
    ultimasEncomiendasSinEntregar: encomiendas.filter(e => e.estado !== false && (e.fechaEntrega === null || !e.fechaEntrega)).slice(0, 5)
  }
}

export default { getDashboardData }
