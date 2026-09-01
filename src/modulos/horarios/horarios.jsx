import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './horarios.css'

const BASE_URL_HORARIOS = 'http://localhost:5093/api/horarios'
const BASE_URL_RUTAS = 'http://localhost:5093/api/rutas'
const BASE_URL_VEHICULOS = 'http://localhost:5093/api/vehiculos'
const BASE_URL_PUNTOS = 'http://localhost:5093/api/puntos-venta'

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

function Horarios() {

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [rutaFilter, setRutaFilter] = useState('todos')
  const [origenFilter, setOrigenFilter] = useState('todos')
  const [destinoFilter, setDestinoFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // datasets
  const [horarios, setHorarios] = useState([])
  const [puntosVenta, setPuntosVenta] = useState([])
  const [rutas, setRutas] = useState([])
  const [vehiculos, setVehiculos] = useState([])

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Modales y Notificaciones
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHorario, setEditingHorario] = useState(null)
  const [notification, setNotification] = useState(null)
  const [horarioToDelete, setHorarioToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    fecha: '2026-08-01',
    hora: '08:30',
    estado: true,
  })

  // Selector de horas (buscable)
  const [timeSearch, setTimeSearch] = useState('')
  const [showTimeList, setShowTimeList] = useState(false)
  const timeListRef = useRef(null)

  // Selector de vehículos (buscable)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [showVehicleList, setShowVehicleList] = useState(false)
  const vehicleListRef = useRef(null)

  // generar lista de horas cada 30 minutos
  const allTimes = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      allTimes.push(`${hh}:${mm}`)
    }
  }

  const filteredTimes = allTimes.filter(t => t.includes(timeSearch))
  const filteredVehicles = vehiculos.filter(v => {
    const normalize = (s = '') => String(s).normalize('NFD').replace(/\u0300-\u036f|[\u0300-\u036f]/g, '').replace(/\p{Diacritic}/gu, '').replace(/[\u0300-\u036f]/g, '').normalize().toLowerCase()
    // fallback normalize without advanced regex if environment lacks \p support
    const simpleNormalize = (s = '') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const tryNormalize = (s) => {
      try { return normalize(s) } catch { return simpleNormalize(s) }
    }

    const term = tryNormalize(vehicleSearch)
    const fullname = tryNormalize(`${v.conductor?.nombres || ''} ${v.conductor?.apellidos || ''}`)
    const placa = tryNormalize(v.placa || '')
    const movil = tryNormalize(String(v.movil) || '')

    return (
      !term ||
      placa.includes(term) ||
      movil.includes(term) ||
      fullname.includes(term)
    )
  })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeListRef.current && !timeListRef.current.contains(e.target)) {
        setShowTimeList(false)
      }
      if (vehicleListRef.current && !vehicleListRef.current.contains(e.target)) {
        setShowVehicleList(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET Datasets Auxiliares ──────────────────────────────────────────────────
  const fetchAuxiliaryData = async () => {
    try {
      const resPuntos = await fetch(BASE_URL_PUNTOS, { headers: authHeaders() })
      if (resPuntos.ok) {
        const dataP = await resPuntos.json()
        if (Array.isArray(dataP) && dataP.length > 0) setPuntosVenta(dataP)
      }

      const resRutas = await fetch(BASE_URL_RUTAS, { headers: authHeaders() })
      if (resRutas.ok) {
        const dataR = await resRutas.json()
        if (Array.isArray(dataR) && dataR.length > 0) setRutas(dataR)
      }

      const resVeh = await fetch(BASE_URL_VEHICULOS, { headers: authHeaders() })
      if (resVeh.ok) {
        const dataV = await resVeh.json()
        if (Array.isArray(dataV) && dataV.length > 0) setVehiculos(dataV)
      }
    } catch (err) {
      console.log('Usando datos auxiliares locales para Horarios:', err.message)
    }
  }

  // ── GET Horarios ('api/horarios') ───────────────────────────────────────────
  const fetchHorarios = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL_HORARIOS, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setHorarios(data)
      }
    } catch (err) {
      console.log('Usando datos locales de horarios para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuxiliaryData()
    fetchHorarios()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, rutaFilter, origenFilter, destinoFilter, statusFilter, itemsPerPage])

  const getPunto = (id) => puntosVenta.find(p => Number(p.id) === Number(id)) || { nombre: `Punto #${id}` }

  const getRutaObj = (id) => {
    const r = rutas.find(item => Number(item.id) === Number(id))
    if (!r) return { origenNombre: 'Origen N/A', destinoNombre: 'Destino N/A', tarifa: 0 }

    // Si la ruta incluye un arreglo `destinos`, usar el primer/último según orden
    if (Array.isArray(r.destinos) && r.destinos.length) {
      const sorted = [...r.destinos].sort((a, b) => (a.orden || 0) - (b.orden || 0))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]

      const origenIdOrObj = first?.puntoVenta || first?.puntoVenta?.id || first?.puntoVenta
      const destinoIdOrObj = last?.puntoVenta || last?.puntoVenta?.id || last?.puntoVenta

      const origenObj = typeof origenIdOrObj === 'object' ? (origenIdOrObj) : getPunto(origenIdOrObj)
      const destinoObj = typeof destinoIdOrObj === 'object' ? (destinoIdOrObj) : getPunto(destinoIdOrObj)

      return {
        ...r,
        origenNombre: origenObj?.nombre || origenObj?.nombre || 'Origen N/A',
        destinoNombre: destinoObj?.nombre || destinoObj?.nombre || 'Destino N/A',
        tarifa: r.tarifa ?? 0
      }
    }

    // Fallback a campos directos cuando no hay `destinos`
    const origenObj = getPunto(r.origenId || r.origen?.id)
    const destinoObj = getPunto(r.destinoId || r.destino?.id)

    return {
      ...r,
      origenNombre: origenObj.nombre,
      destinoNombre: destinoObj.nombre,
      tarifa: r.tarifa ?? 0
    }
  }

  const getVehiculoObj = (id) => {
    const v = vehiculos.find(item => Number(item.id) === Number(id))
    if (!v) return { movil: `${id}`, placa: 'N/A', marca: 'Vehículo', modelo: '' }
    return v
  }

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return ''
      const s = String(dateStr)

      // If date is plain 'YYYY-MM-DD', construct local Date to avoid UTC shift
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
      let d
      if (m) {
        const y = Number(m[1])
        const mo = Number(m[2]) - 1
        const da = Number(m[3])
        d = new Date(y, mo, da) // local midnight
      } else {
        d = new Date(s)
      }

      if (isNaN(d)) return dateStr
      return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(d)
    } catch {
      return dateStr
    }
  }

  // ── Toggle Estado Rápido ──────────────────────────────────────────────────────
  const toggleEstado = async (horario) => {
    const nuevoEstado = !horario.estado
    setHorarios(prev => prev.map(h => h.id === horario.id ? { ...h, estado: nuevoEstado } : h))

    try {
      await fetch(`${BASE_URL_HORARIOS}/${horario.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...horario, estado: nuevoEstado })
      })
    } catch (err) {
      console.log('PUT backend horarios no disponible:', err.message)
    }

    showNotification(`Horario ${horario.fecha} ${horario.hora} actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    setFormData({
      fecha: todayStr,
      hora: '08:30',
      estado: true,
      rutaId: rutas[0]?.id || 1,
      vehiculoId: vehiculos[0]?.id || 10
    })
    setEditingHorario(null)
    setTimeSearch('')
    setVehicleSearch('')
    setShowTimeList(false)
    setShowVehicleList(false)
    setShowAddModal(true)
  }

  const handleEdit = (horario) => {
    setFormData({
      fecha: horario.fecha || '2026-08-01',
      hora: horario.hora || '08:30',
      estado: horario.estado ?? true,
      rutaId: horario.rutaId || horario.ruta?.id || rutas[0]?.id || 1,
      vehiculoId: horario.vehiculoId || horario.vehiculo?.id || vehiculos[0]?.id || 10
    })
    setEditingHorario(horario)
    setTimeSearch('')
    setVehicleSearch('')
    setShowTimeList(false)
    setShowVehicleList(false)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Validaciones
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
    if (!formData.fecha || formData.fecha < todayStr) {
      showNotification('La fecha no puede ser anterior a hoy', 'error')
      setSaving(false)
      return
    }
    if (!formData.hora) {
      showNotification('La hora es obligatoria', 'error')
      setSaving(false)
      return
    }
    if (!formData.vehiculoId) {
      showNotification('Seleccione un vehículo válido', 'error')
      setSaving(false)
      return
    }

    // Validar que no exista ya un horario con la misma fecha, hora y vehículo
    const isDuplicate = horarios.some(h =>
      h.fecha?.split('T')[0] === formData.fecha &&
      h.hora === formData.hora &&
      Number(h.vehiculoId || h.vehiculo?.id) === Number(formData.vehiculoId) &&
      (!editingHorario || h.id !== editingHorario.id)
    )
    if (isDuplicate) {
      const veh = vehiculos.find(v => Number(v.id) === Number(formData.vehiculoId))
      const vehLabel = veh ? `${veh.movil} (${veh.placa})` : `Vehículo #${formData.vehiculoId}`
      showNotification(`Ya existe un horario el ${formData.fecha} a las ${formData.hora} para ${vehLabel}`, 'error')
      setSaving(false)
      return
    }

    const payload = {
      fecha: formData.fecha,
      hora: formData.hora,
      estado: Boolean(formData.estado),
      rutaId: Number(formData.rutaId),
      vehiculoId: Number(formData.vehiculoId)
    }

    try {
      if (editingHorario) {
        try {
          await fetch(`${BASE_URL_HORARIOS}/${editingHorario.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...payload, id: editingHorario.id })
          })
        } catch (err) {
          console.log('PUT backend horarios no disponible:', err.message)
        }

        setHorarios(prev => prev.map(h => h.id === editingHorario.id ? { ...payload, id: editingHorario.id } : h))
        showNotification('Horario actualizado exitosamente')
      } else {
        const newId = Date.now()
        const newHorario = { ...payload, id: newId }
        try {
          const res = await fetch(BASE_URL_HORARIOS, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const data = await res.json()
            newHorario.id = data.id || newId
          }
        } catch (err) {
          console.log('POST backend horarios no disponible:', err.message)
        }

        setHorarios(prev => [newHorario, ...prev])
        showNotification('Nuevo horario programado exitosamente')
      }

      setShowAddModal(false)
      setEditingHorario(null)
    } catch (err) {
      showNotification('Error al guardar horario: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (horario) => setHorarioToDelete(horario)

  const confirmDelete = async () => {
    if (!horarioToDelete) return
    setHorarios(prev => prev.filter(h => h.id !== horarioToDelete.id))

    try {
      await fetch(`${BASE_URL_HORARIOS}/${horarioToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch (err) {
      console.log('DELETE backend horarios no disponible:', err.message)
    }

    showNotification('Horario eliminado del sistema', 'error')
    setHorarioToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredHorarios = horarios.filter(h => {
    const rutaObj = getRutaObj(h.rutaId || h.ruta?.id)
    const vehObj = getVehiculoObj(h.vehiculoId || h.vehiculo?.id)

    const textTarget = `${h.fecha} ${h.hora} ${rutaObj.origenNombre} ${rutaObj.destinoNombre} ${vehObj.movil} ${vehObj.placa} ${vehObj.marca}`.toLowerCase()
    const matchesSearch = textTarget.includes(searchTerm.toLowerCase())

    // derive origin/destination from ruta.destinos when possible
    const obtenerOrigenDestino = (hr) => {
      // prefer ruta embebida
      const rutaPayload = hr.ruta || null
      let destinos = null

      if (rutaPayload && Array.isArray(rutaPayload.destinos) && rutaPayload.destinos.length) {
        destinos = rutaPayload.destinos
      } else if (hr.rutaId) {
        // intentar encontrar la ruta en el dataset `rutas` cuando solo hay rutaId
        const rutaLocal = rutas.find(r => Number(r.id) === Number(hr.rutaId))
        if (rutaLocal && Array.isArray(rutaLocal.destinos) && rutaLocal.destinos.length) destinos = rutaLocal.destinos
      }

      if (!destinos || destinos.length === 0) return { origen: null, destino: null }

      const sorted = [...destinos].sort((a,b)=> (a.orden||0)-(b.orden||0))
      const first = sorted[0]
      const last = sorted[sorted.length -1]
      return { origen: first?.puntoVenta?.id || first?.puntoVenta || null, destino: last?.puntoVenta?.id || last?.puntoVenta || null }
    }

    const { origen: hOrigen, destino: hDestino } = obtenerOrigenDestino(h)

    const matchesRuta = rutaFilter === 'todos' || Number(h.rutaId || h.ruta?.id) === Number(rutaFilter)
    const matchesOrigen = origenFilter === 'todos' || (hOrigen && Number(hOrigen) === Number(origenFilter))
    const matchesDestino = destinoFilter === 'todos' || (hDestino && Number(hDestino) === Number(destinoFilter))

    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activos' && h.estado) ||
      (statusFilter === 'inactivos' && !h.estado)

    return matchesSearch && matchesRuta && matchesOrigen && matchesDestino && matchesStatus
  })

  // Paginación
  const totalItems = filteredHorarios.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHorarios = filteredHorarios.slice(startIndex, startIndex + itemsPerPage)

  const navigate = useNavigate()
  const openVentaPasajes = (id) => navigate(`/horarios/venta/${id}`)

  return (
    <div className="horarios-view">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {notification.type === 'success' ? (
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="content-card">
        {/* Toolbar Superior */}
        <div className="toolbar">
          <div className="filter-group">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar horario por fecha, ruta o vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select value={origenFilter} onChange={(e) => setOrigenFilter(e.target.value)} className="filter-select">
              <option value="todos">Todos los Orígenes</option>
              {puntosVenta.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            <select value={destinoFilter} onChange={(e) => setDestinoFilter(e.target.value)} className="filter-select">
              <option value="todos">Todos los Destinos</option>
              {puntosVenta.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            {/* <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select> */}
          </div>

          <button className="add-btn" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Horario
          </button>
        </div>

        {/* Tabla de Horarios */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando horarios...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Movil</th>
                  <th>Conductor</th>
                  {/* <th>Estado</th> */}
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHorarios.map((h, idx) => {
                  const nro = startIndex + idx + 1;
                  const rutaInfo = getRutaObj(h.rutaId || h.ruta?.id)
                  const vehInfo = getVehiculoObj(h.vehiculoId || h.vehiculo?.id)

                  // derive origin/destination names from h.ruta.destinos if available
                  let origenName = rutaInfo.origenNombre || '';
                  let destinoName = rutaInfo.destinoNombre || '';
                  const rutaFromPayload = h.ruta || null;
                  if (rutaFromPayload && Array.isArray(rutaFromPayload.destinos) && rutaFromPayload.destinos.length) {
                    const sorted = [...rutaFromPayload.destinos].sort((a,b)=> (a.orden||0)-(b.orden||0));
                    const first = sorted[0];
                    const last = sorted[sorted.length-1];
                    origenName = first?.puntoVenta?.nombre || first?.puntoVenta || origenName;
                    destinoName = last?.puntoVenta?.nombre || last?.puntoVenta || destinoName;
                  }

                  const conductorFull = vehInfo?.conductor ? `${vehInfo.conductor.nombres || ''} ${vehInfo.conductor.apellidos || ''}`.trim() : '';

                  return (
                    <tr key={h.id} onClick={() => openVentaPasajes(h.id)} style={{ cursor: 'pointer' }}>
                      <td>{nro}</td>
                      <td>
                        <span className="date-pill">{formatDate(h.fecha)}</span>
                      </td>
                      <td>
                        <div className="time-pill">{h.hora}</div>
                      </td>
                      <td>
                        <div>{origenName}</div>
                      </td>
                      <td>
                        <div>{destinoName}</div>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ background:'#0f172a', color:'#fff', borderRadius:8, padding:'6px 10px', fontSize:18, fontWeight:700 }}>
                            {vehInfo?.movil ?? ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize:14 }}>{conductorFull}</div>
                      </td>
                      {/* <td>
                        <span className={`status-badge ${h.estado ? 'active' : 'inactive'}`}>
                          {h.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td> */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          {/* <button
                            onClick={() => toggleEstado(h)}
                            className="action-btn edit-btn"
                            title={h.estado ? 'Desactivar Horario' : 'Activar Horario'}
                            style={{ color: h.estado ? '#10b981' : '#94a3b8' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                              <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                          </button> */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(h) }}
                            className="action-btn edit-btn"
                            title="Editar Horario"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(h) }}
                            className="action-btn delete-btn"
                            title="Eliminar Horario"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredHorarios.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron horarios programados</h3>
              <p>Intente ajustando la búsqueda o los filtros</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredHorarios.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} horarios
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="pagination-size-select"
              >
                <option value={5}>5 por pág.</option>
                <option value={10}>10 por pág.</option>
                <option value={20}>20 por pág.</option>
              </select>
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                « Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Horario */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingHorario ? 'Editar Horario' : 'Nuevo Horario'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Fecha de Salida</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.fecha}
                    min={new Date().toLocaleDateString('en-CA')}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group" ref={timeListRef}>
                  <label className="input-label">Hora de Salida</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={formData.hora || 'Buscar hora, ej. 08:30'}
                      value={timeSearch}
                      onChange={(e) => { setTimeSearch(e.target.value); setShowTimeList(true) }}
                      onFocus={() => setShowTimeList(true)}
                      aria-label="Buscar hora"
                    />
                    <input type="hidden" value={formData.hora} />

                    {showTimeList && (
                      <div style={{
                        position: 'absolute',
                        zIndex: 40,
                        left: 0,
                        right: 0,
                        maxHeight: 200,
                        overflow: 'auto',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        boxShadow: '0 6px 18px rgba(15,23,42,0.08)'
                      }}>
                        {(filteredTimes.length === 0) ? (
                          <div style={{ padding: 10, color: '#64748b' }}>No hay horas</div>
                        ) : (
                          filteredTimes.map(t => (
                            <div
                              key={t}
                              onClick={() => { setFormData({ ...formData, hora: t }); setShowTimeList(false); setTimeSearch('') }}
                              style={{ padding: '8px 10px', cursor: 'pointer', background: formData.hora === t ? '#f1f5f9' : 'transparent' }}
                            >
                              {t}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ruta Asignada (rutaId) */}
              <div className="input-group">
                <label className="input-label">Ruta Programada</label>
                <select
                  className="input-field"
                  value={formData.rutaId}
                  onChange={(e) => setFormData({ ...formData, rutaId: e.target.value })}
                  required
                >
                  {rutas.map(r => {
                    const rObj = getRutaObj(r.id)
                    return (
                      <option key={r.id} value={r.id}>
                        {rObj.origenNombre} → {rObj.destinoNombre} (Tarifa: Bs. {Number(rObj.tarifa).toFixed(2)})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Vehículo Asignado (vehiculoId) */}
              <div className="input-group">
                <label className="input-label">Vehículo Asignado</label>
                <div ref={vehicleListRef} style={{ position: 'relative' }}>
                  {(() => {
                    const sel = getVehiculoObj(formData.vehiculoId)
                    const selText = sel?.placa ? `Móvil ${sel.movil} - Placa ${sel.placa} ${sel.conductor ? `- ${sel.conductor.nombres || ''} ${sel.conductor.apellidos || ''}` : ''}` : ''
                    return (
                      <input
                        type="text"
                        className="input-field"
                        placeholder={selText || 'Buscar vehículo por placa, móvil o conductor...'}
                        value={vehicleSearch}
                        onChange={(e) => { setVehicleSearch(e.target.value); setShowVehicleList(true) }}
                        onFocus={() => setShowVehicleList(true)}
                        aria-label="Buscar vehículo"
                      />
                    )
                  })()}

                  {showVehicleList && (
                    <div style={{
                      position: 'absolute',
                      zIndex: 40,
                      left: 0,
                      right: 0,
                      maxHeight: 220,
                      overflow: 'auto',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      boxShadow: '0 6px 18px rgba(15,23,42,0.08)'
                    }}>
                      {(filteredVehicles.length === 0) ? (
                        <div style={{ padding: 10, color: '#64748b' }}>No hay vehículos</div>
                      ) : (
                        filteredVehicles.map(v => (
                          <div
                            key={v.id}
                            onClick={() => { setFormData({ ...formData, vehiculoId: v.id }); setShowVehicleList(false); setVehicleSearch('') }}
                            style={{ padding: '8px 10px', cursor: 'pointer', background: Number(formData.vehiculoId) === Number(v.id) ? '#f1f5f9' : 'transparent' }}
                          >
                            <div style={{ fontWeight: 700 }}>{`Móvil ${v.movil} - Placa ${v.placa}`}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{v.conductor ? `${v.conductor.nombres || ''} ${v.conductor.apellidos || ''}` : ''}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Estado Inicial</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                      />
                      <span className="switch-slider"></span>
                    </label>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: formData.estado ? '#10b981' : '#64748b' }}>
                      {formData.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div> */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Guardando...' : (editingHorario ? 'Actualizar' : 'Crear') + ' Horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {horarioToDelete && (
        <div className="modal-overlay" onClick={() => setHorarioToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setHorarioToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
                <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar el horario programado para el <strong>{formatDate(horarioToDelete.fecha)} a las {horarioToDelete.hora}</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setHorarioToDelete(null)}>
                Cancelar
              </button>
              <button
                className="save-btn"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Venta de Pasajes ahora es una ruta: /horarios/venta/:id - navegamos en openVentaPasajes */}
    </div>
  )
}

export default Horarios
