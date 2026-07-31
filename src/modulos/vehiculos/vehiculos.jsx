import { useState, useEffect } from 'react'
import './vehiculos.css'

const BASE_URL_VEHICULOS = 'http://localhost:5093/api/vehiculos'
const BASE_URL_CONDUCTORES = 'http://localhost:5093/api/conductores'
const BASE_URL_ASIENTOS = 'http://localhost:5093/api/asientos'

export const STATIC_CONDUCTORES = [
  { id: 1, nombres: 'Carlos Alberto', apellidos: 'Mamani Quispe', licencia: '4892019' },
  { id: 2, nombres: 'Juan Pablo', apellidos: 'Fernández Flores', licencia: '5829104' },
  { id: 3, nombres: 'Roberto', apellidos: 'Vargas Gutierrez', licencia: '3920192' },
  { id: 4, nombres: 'Luis Enrique', apellidos: 'Salazar Choque', licencia: '8201928' }
]

export const STATIC_ASIENTOS = [
  { id: 1, filas: 4, cantidad: 16, nombre: 'Van compacta', esminibus: true, estado: true },
  { id: 2, filas: 6, cantidad: 24, nombre: 'Minibús clásico', esminibus: true, estado: true },
  { id: 3, filas: 8, cantidad: 32, nombre: 'Bus Cama Ejecutivo', esminibus: false, estado: true },
  { id: 4, filas: 10, cantidad: 40, nombre: 'Bus estándar', esminibus: false, estado: true },
  { id: 5, filas: 2, cantidad: 5, nombre: 'Sedán ejecutivo', esminibus: false, estado: true }
]

export const MOCK_VEHICULOS = [
  {
    id: 1,
    movil: '101',
    placa: 'ABC123',
    marca: 'Toyota',
    modelo: 'Corolla',
    color: 'Rojo',
    tipo: 'Sedán',
    soat: 'SOAT2026',
    aseguradora: 'La Boliviana',
    conductorId: 1,
    propietarioId: 2,
    estado: true,
    asientosId: 5
  },
  {
    id: 2,
    movil: '102',
    placa: '1029-XYZ',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter 515',
    color: 'Gris Plata',
    tipo: 'Van',
    soat: 'SOAT-3819204',
    aseguradora: 'BISA Seguros',
    conductorId: 2,
    propietarioId: 3,
    estado: true,
    asientosId: 1
  },
  {
    id: 3,
    movil: '103',
    placa: '3810-FGT',
    marca: 'Volvo',
    modelo: 'Paradiso 1200',
    color: 'Azul Marino',
    tipo: 'Bus Cama',
    soat: 'SOAT-5729103',
    aseguradora: 'Nacional Vida',
    conductorId: 3,
    propietarioId: 1,
    estado: true,
    asientosId: 3
  }
]

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

function Vehiculos() {
  const [vehiculos, setVehiculos] = useState(MOCK_VEHICULOS)
  const [conductores, setConductores] = useState(STATIC_CONDUCTORES)
  const [asientosList, setAsientosList] = useState(STATIC_ASIENTOS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [aseguradoraFilter, setAseguradoraFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [notification, setNotification] = useState(null)
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Estado del Formulario
  const [formData, setFormData] = useState({
    movil: '',
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    tipo: 'Sedán',
    soat: '',
    aseguradora: 'La Boliviana',
    conductorId: STATIC_CONDUCTORES[0].id,
    propietarioId: STATIC_CONDUCTORES[0].id,
    asientosId: 5,
    estado: true
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET Conductores ('api/conductores') ─────────────────────────────────────
  const fetchConductores = async () => {
    try {
      const res = await fetch(BASE_URL_CONDUCTORES, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setConductores(data)
      }
    } catch (err) {
      console.log('Usando conductores locales para pruebas:', err.message)
    }
  }

  // ── GET Asientos ('api/asientos') ───────────────────────────────────────────
  const fetchAsientos = async () => {
    try {
      const res = await fetch(BASE_URL_ASIENTOS, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setAsientosList(data)
      }
    } catch (err) {
      console.log('Usando lista de asientos local para pruebas:', err.message)
    }
  }

  // ── GET Vehículos ('api/vehiculos') ─────────────────────────────────────────
  const fetchVehiculos = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL_VEHICULOS, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setVehiculos(data)
      }
    } catch (err) {
      console.log('Usando lista local de vehículos para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConductores()
    fetchAsientos()
    fetchVehiculos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, tipoFilter, aseguradoraFilter, statusFilter, itemsPerPage])

  // Helper resolver conductor
  const getConductor = (id) => {
    const c = conductores.find(item => Number(item.id) === Number(id))
    if (!c) return { nombres: `Conductor #${id}`, apellidos: '', licencia: 'N/A' }
    return c
  }

  // Helper resolver distribución de asientos
  const getAsientoObj = (id) => {
    const a = asientosList.find(item => Number(item.id) === Number(id))
    if (!a) return { nombre: `Distribución #${id}`, cantidad: '?' }
    return a
  }

  // ── Toggle Estado Rápido ──────────────────────────────────────────────────────
  const toggleEstado = async (vehicle) => {
    const nuevoEstado = !vehicle.estado
    setVehiculos(prev => prev.map(v => v.id === vehicle.id ? { ...v, estado: nuevoEstado } : v))

    try {
      await fetch(`${BASE_URL_VEHICULOS}/${vehicle.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...vehicle, estado: nuevoEstado })
      })
    } catch (err) {
      console.log('PUT backend vehiculos no disponible:', err.message)
    }

    showNotification(`Estado del vehículo M-${vehicle.movil} actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    const firstCondId = conductores[0]?.id || 1
    const secondCondId = conductores[1]?.id || firstCondId
    const firstAsientoId = asientosList[0]?.id || 5
    setFormData({
      movil: '',
      placa: '',
      marca: '',
      modelo: '',
      color: '',
      tipo: 'Sedán',
      soat: '',
      aseguradora: 'La Boliviana',
      conductorId: firstCondId,
      propietarioId: secondCondId,
      asientosId: firstAsientoId,
      estado: true
    })
    setEditingVehicle(null)
    setShowAddModal(true)
  }

  const handleEdit = (vehicle) => {
    setFormData({
      movil: vehicle.movil || '',
      placa: vehicle.placa || '',
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      color: vehicle.color || '',
      tipo: vehicle.tipo || 'Sedán',
      soat: vehicle.soat || vehicle.nroSoat || '',
      aseguradora: vehicle.aseguradora || 'La Boliviana',
      conductorId: vehicle.conductorId || vehicle.conductor?.id || conductores[0]?.id || 1,
      propietarioId: vehicle.propietarioId || vehicle.propietario?.id || conductores[0]?.id || 1,
      asientosId: vehicle.asientosId || vehicle.asientos?.id || asientosList[0]?.id || 5,
      estado: vehicle.estado ?? true
    })
    setEditingVehicle(vehicle)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      movil: formData.movil,
      placa: formData.placa,
      marca: formData.marca,
      modelo: formData.modelo,
      color: formData.color,
      tipo: formData.tipo,
      soat: formData.soat,
      aseguradora: formData.aseguradora,
      conductorId: Number(formData.conductorId),
      propietarioId: Number(formData.propietarioId),
      estado: Boolean(formData.estado),
      asientosId: Number(formData.asientosId)
    }

    try {
      if (editingVehicle) {
        try {
          await fetch(`${BASE_URL_VEHICULOS}/${editingVehicle.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...payload, id: editingVehicle.id })
          })
        } catch (err) {
          console.log('PUT backend vehiculos no disponible:', err.message)
        }

        setVehiculos(prev => prev.map(v => v.id === editingVehicle.id ? { ...payload, id: editingVehicle.id } : v))
        showNotification('Vehículo actualizado exitosamente')
      } else {
        const newId = Date.now()
        const newVehicle = { ...payload, id: newId }
        try {
          const res = await fetch(BASE_URL_VEHICULOS, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const data = await res.json()
            newVehicle.id = data.id || newId
          }
        } catch (err) {
          console.log('POST backend vehiculos no disponible:', err.message)
        }

        setVehiculos(prev => [newVehicle, ...prev])
        showNotification('Nuevo vehículo registrado exitosamente')
      }

      setShowAddModal(false)
      setEditingVehicle(null)
    } catch (err) {
      showNotification('Error al guardar vehículo: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (vehicle) => setVehicleToDelete(vehicle)

  const confirmDelete = async () => {
    if (!vehicleToDelete) return
    setVehiculos(prev => prev.filter(v => v.id !== vehicleToDelete.id))

    try {
      await fetch(`${BASE_URL_VEHICULOS}/${vehicleToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch (err) {
      console.log('DELETE backend vehiculos no disponible:', err.message)
    }

    showNotification('Vehículo eliminado del sistema', 'error')
    setVehicleToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredVehiculos = vehiculos.filter(v => {
    const conductorObj = getConductor(v.conductorId || v.conductor?.id)
    const propietarioObj = getConductor(v.propietarioId || v.propietario?.id)

    const textTarget = `${v.movil} ${v.marca} ${v.modelo} ${v.placa} ${conductorObj.nombres} ${conductorObj.apellidos} ${propietarioObj.nombres}`.toLowerCase()
    const matchesSearch = textTarget.includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === 'todos' || v.tipo === tipoFilter
    const matchesAseguradora = aseguradoraFilter === 'todos' || v.aseguradora === aseguradoraFilter
    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activos' && v.estado) ||
      (statusFilter === 'inactivos' && !v.estado)

    return matchesSearch && matchesTipo && matchesAseguradora && matchesStatus
  })

  // Paginación
  const totalItems = filteredVehiculos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVehiculos = filteredVehiculos.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="vehiculos-view">
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
                placeholder="Buscar vehículo por móvil, placa, marca o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Sedán">Sedán</option>
              <option value="Minibús">Minibús</option>
              <option value="Van">Van</option>
              <option value="Bus Cama">Bus Cama</option>
              <option value="Omnibús">Omnibús</option>
            </select>

            <select
              value={aseguradoraFilter}
              onChange={(e) => setAseguradoraFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todas las Aseguradoras</option>
              <option value="La Boliviana">La Boliviana</option>
              <option value="Alianza Seguros">Alianza Seguros</option>
              <option value="BISA Seguros">BISA Seguros</option>
              <option value="Nacional Vida">Nacional Vida</option>
              <option value="Rímac Seguros">Rímac Seguros</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>

          <button className="add-btn" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Vehículo
          </button>
        </div>

        {/* Tabla de Vehículos */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando vehículos...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Móvil</th>
                  <th>Placa</th>
                  <th>Marca / Modelo</th>
                  <th>Color / Tipo</th>
                  <th>Conductor</th>
                  <th>Propietario</th>
                  <th>Asientos</th>
                  <th>SOAT / Seguro</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehiculos.map((v) => {
                  const cond = getConductor(v.conductorId || v.conductor?.id)
                  const prop = getConductor(v.propietarioId || v.propietario?.id)
                  const asie = getAsientoObj(v.asientosId || v.asientos?.id)

                  return (
                    <tr key={v.id}>
                      <td>
                        <span className="movil-badge">M-{v.movil}</span>
                      </td>
                      <td>
                        <span className="placa-pill">{v.placa}</span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: 'var(--slate-900)' }}>{v.marca}</strong>
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{v.modelo}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{v.tipo}</span>
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>{v.color}</span>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-driver-info">
                          <div className="vehicle-driver-avatar">
                            {cond.nombres ? cond.nombres[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--slate-900)' }}>
                              {cond.nombres} {cond.apellidos}
                            </span>
                            {cond.licencia && <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Lic: {cond.licencia}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="vehicle-driver-info">
                          <div className="vehicle-driver-avatar" style={{ background: '#fef3c7', color: '#b45309' }}>
                            {prop.nombres ? prop.nombres[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--slate-900)' }}>
                              {prop.nombres} {prop.apellidos}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="seats-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          </svg>
                          {asie.nombre} ({asie.cantidad} as.)
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>
                            {v.soat || v.nroSoat}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            {v.aseguradora}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${v.estado !== false ? 'active' : 'inactive'}`}>
                          {v.estado !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => toggleEstado(v)}
                            className="action-btn edit-btn"
                            title={v.estado !== false ? 'Desactivar Vehículo' : 'Activar Vehículo'}
                            style={{ color: v.estado !== false ? '#10b981' : '#94a3b8' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                              <line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(v)}
                            className="action-btn edit-btn"
                            title="Editar Vehículo"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="action-btn delete-btn"
                            title="Eliminar Vehículo"
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

          {!loading && filteredVehiculos.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron vehículos</h3>
              <p>Intente ajustando el término de búsqueda o los filtros</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredVehiculos.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} vehículos
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

      {/* Modal Crear / Editar Vehículo */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
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
                  <label className="input-label">N° Móvil</label>
                  <input
                    type="text"
                    value={formData.movil}
                    onChange={(e) => setFormData({ ...formData, movil: e.target.value })}
                    className="input-field"
                    placeholder="Ej. 101"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Placa</label>
                  <input
                    type="text"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    className="input-field"
                    placeholder="Ej. ABC123"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Marca</label>
                  <input
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Toyota"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Corolla"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Rojo"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Tipo de Vehículo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="input-field"
                  >
                    <option value="Sedán">Sedán</option>
                    <option value="Minibús">Minibús</option>
                    <option value="Van">Van</option>
                    <option value="Bus Cama">Bus Cama</option>
                    <option value="Omnibús">Omnibús</option>
                  </select>
                </div>
              </div>

              {/* Selección de Conductor y Propietario desde 'api/conductores' */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Conductor Asignado</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({ ...formData, conductorId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} {c.licencia ? `(Lic: ${c.licencia})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Propietario</label>
                  <select
                    value={formData.propietarioId}
                    onChange={(e) => setFormData({ ...formData, propietarioId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {conductores.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección de Asientos desde 'api/asientos' */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Distribución de Asientos ('api/asientos')</label>
                  <select
                    value={formData.asientosId}
                    onChange={(e) => setFormData({ ...formData, asientosId: e.target.value })}
                    className="input-field"
                    required
                  >
                    {asientosList.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} ({a.cantidad} asientos, {a.filas} filas)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Aseguradora</label>
                  <select
                    value={formData.aseguradora}
                    onChange={(e) => setFormData({ ...formData, aseguradora: e.target.value })}
                    className="input-field"
                  >
                    <option value="La Boliviana">La Boliviana</option>
                    <option value="Alianza Seguros">Alianza Seguros</option>
                    <option value="BISA Seguros">BISA Seguros</option>
                    <option value="Nacional Vida">Nacional Vida</option>
                    <option value="Rímac Seguros">Rímac Seguros</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">SOAT</label>
                  <input
                    type="text"
                    value={formData.soat}
                    onChange={(e) => setFormData({ ...formData, soat: e.target.value })}
                    className="input-field"
                    placeholder="Ej. SOAT2026"
                    required
                  />
                </div>

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
              </div>

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
                  {saving ? 'Guardando...' : (editingVehicle ? 'Actualizar' : 'Crear') + ' Vehículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {vehicleToDelete && (
        <div className="modal-overlay" onClick={() => setVehicleToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setVehicleToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar el vehículo <strong>M-{vehicleToDelete.movil} ({vehicleToDelete.placa})</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setVehicleToDelete(null)}>
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
    </div>
  )
}

export default Vehiculos
