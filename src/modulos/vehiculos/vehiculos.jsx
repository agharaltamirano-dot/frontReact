import { useState, useEffect } from 'react'
import './vehiculos.css'

const BASE_URL = 'http://localhost:5093/api/vehiculos'

// Objetos estáticos para las pruebas de conductores
export const STATIC_CONDUCTORES = [
  { id: 1, nombres: 'Carlos Alberto', apellidos: 'Mamani Quispe', licencia: '4892019' },
  { id: 2, nombres: 'Juan Pablo', apellidos: 'Fernández Flores', licencia: '5829104' },
  { id: 3, nombres: 'Roberto', apellidos: 'Vargas Gutierrez', licencia: '3920192' },
  { id: 4, nombres: 'Luis Enrique', apellidos: 'Salazar Choque', licencia: '8201928' }
]

// Objetos estáticos para las pruebas de asientos: asientos { id, filas, cantidad }
export const STATIC_ASIENTOS = [
  { id: 1, filas: 4, cantidad: 16, nombre: 'Van (16 Asientos - 4 Filas)' },
  { id: 2, filas: 6, cantidad: 24, nombre: 'Minibús (24 Asientos - 6 Filas)' },
  { id: 3, filas: 8, cantidad: 32, nombre: 'Bus Cama (32 Asientos - 8 Filas)' },
  { id: 4, filas: 10, cantidad: 40, nombre: 'Omnibús (40 Asientos - 10 Filas)' }
]

export const MOCK_VEHICULOS = [
  {
    id: 1,
    movil: 'M-01',
    marca: 'Toyota',
    modelo: 'Coaster',
    placa: '4829-ABC',
    color: 'Blanco / Azul',
    tipo: 'Minibús',
    conductor: STATIC_CONDUCTORES[0],
    propietario: STATIC_CONDUCTORES[0],
    asientos: STATIC_ASIENTOS[1],
    nroSoat: 'SOAT-9840192',
    aseguradora: 'Alianza Seguros'
  },
  {
    id: 2,
    movil: 'M-02',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter 515',
    placa: '1029-XYZ',
    color: 'Gris Plata',
    tipo: 'Van',
    conductor: STATIC_CONDUCTORES[1],
    propietario: STATIC_CONDUCTORES[2],
    asientos: STATIC_ASIENTOS[0],
    nroSoat: 'SOAT-3819204',
    aseguradora: 'BISA Seguros'
  },
  {
    id: 3,
    movil: 'M-03',
    marca: 'Volvo',
    modelo: 'Paradiso 1200',
    placa: '3810-FGT',
    color: 'Azul Marino',
    tipo: 'Bus Cama',
    conductor: STATIC_CONDUCTORES[2],
    propietario: STATIC_CONDUCTORES[1],
    asientos: STATIC_ASIENTOS[3],
    nroSoat: 'SOAT-5729103',
    aseguradora: 'Nacional Vida'
  },
  {
    id: 4,
    movil: 'M-04',
    marca: 'Scania',
    modelo: 'K360',
    placa: '2849-HJK',
    color: 'Rojo / Blanco',
    tipo: 'Omnibús',
    conductor: STATIC_CONDUCTORES[3],
    propietario: STATIC_CONDUCTORES[3],
    asientos: STATIC_ASIENTOS[2],
    nroSoat: 'SOAT-7182930',
    aseguradora: 'Rímac Seguros'
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
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [aseguradoraFilter, setAseguradoraFilter] = useState('todos')

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
    marca: '',
    modelo: '',
    placa: '',
    color: '',
    tipo: 'Minibús',
    conductorId: STATIC_CONDUCTORES[0].id,
    propietarioId: STATIC_CONDUCTORES[0].id,
    asientosId: STATIC_ASIENTOS[0].id,
    nroSoat: '',
    aseguradora: 'Alianza Seguros'
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  const fetchVehiculos = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setVehiculos(data)
        }
      }
    } catch (err) {
      console.log('Usando lista local de vehículos para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVehiculos() }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, tipoFilter, aseguradoraFilter, itemsPerPage])

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({
      movil: '',
      marca: '',
      modelo: '',
      placa: '',
      color: '',
      tipo: 'Minibús',
      conductorId: STATIC_CONDUCTORES[0].id,
      propietarioId: STATIC_CONDUCTORES[0].id,
      asientosId: STATIC_ASIENTOS[0].id,
      nroSoat: '',
      aseguradora: 'Alianza Seguros'
    })
    setEditingVehicle(null)
    setShowAddModal(true)
  }

  const handleEdit = (vehicle) => {
    setFormData({
      movil: vehicle.movil || '',
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      placa: vehicle.placa || '',
      color: vehicle.color || '',
      tipo: vehicle.tipo || 'Minibús',
      conductorId: vehicle.conductor?.id || STATIC_CONDUCTORES[0].id,
      propietarioId: vehicle.propietario?.id || STATIC_CONDUCTORES[0].id,
      asientosId: vehicle.asientos?.id || STATIC_ASIENTOS[0].id,
      nroSoat: vehicle.nroSoat || '',
      aseguradora: vehicle.aseguradora || 'Alianza Seguros'
    })
    setEditingVehicle(vehicle)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const selectedConductor = STATIC_CONDUCTORES.find(c => c.id === Number(formData.conductorId)) || STATIC_CONDUCTORES[0]
    const selectedPropietario = STATIC_CONDUCTORES.find(c => c.id === Number(formData.propietarioId)) || STATIC_CONDUCTORES[0]
    const selectedAsientos = STATIC_ASIENTOS.find(a => a.id === Number(formData.asientosId)) || STATIC_ASIENTOS[0]

    const fullVehicleObj = {
      movil: formData.movil,
      marca: formData.marca,
      modelo: formData.modelo,
      placa: formData.placa,
      color: formData.color,
      tipo: formData.tipo,
      conductor: selectedConductor,
      propietario: selectedPropietario,
      asientos: selectedAsientos,
      nroSoat: formData.nroSoat,
      aseguradora: formData.aseguradora
    }

    try {
      if (editingVehicle) {
        try {
          await fetch(`${BASE_URL}/${editingVehicle.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...fullVehicleObj, id: editingVehicle.id })
          })
        } catch {
          console.log('PUT backend vehiculos no disponible')
        }

        setVehiculos(prev => prev.map(v => v.id === editingVehicle.id ? { ...fullVehicleObj, id: editingVehicle.id } : v))
        showNotification('Vehículo actualizado exitosamente')
      } else {
        const newId = Date.now()
        const newVehicle = { ...fullVehicleObj, id: newId }
        try {
          const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(fullVehicleObj)
          })
          if (res.ok) {
            const data = await res.json()
            newVehicle.id = data.id || newId
          }
        } catch {
          console.log('POST backend vehiculos no disponible')
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
      await fetch(`${BASE_URL}/${vehicleToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch {
      // local
    }

    showNotification('Vehículo eliminado del sistema', 'error')
    setVehicleToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredVehiculos = vehiculos.filter(v => {
    const textTarget = `${v.movil} ${v.marca} ${v.modelo} ${v.placa} ${v.conductor?.nombres} ${v.conductor?.apellidos} ${v.propietario?.nombres}`.toLowerCase()
    const matchesSearch = textTarget.includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === 'todos' || v.tipo === tipoFilter
    const matchesAseguradora = aseguradoraFilter === 'todos' || v.aseguradora === aseguradoraFilter

    return matchesSearch && matchesTipo && matchesAseguradora
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

      {/* Contenido Principal */}
      <div className="content-card">
        {/* Barra de Herramientas y Filtros */}
        <div className="toolbar">
          <div className="filter-group">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por móvil, placa, marca, modelo o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filtro Tipo */}
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Minibús">Minibús</option>
              <option value="Bus Cama">Bus Cama</option>
              <option value="Van">Van</option>
              <option value="Omnibús">Omnibús</option>
            </select>

            {/* Filtro Aseguradora */}
            <select
              value={aseguradoraFilter}
              onChange={(e) => setAseguradoraFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todas las Aseguradoras</option>
              <option value="Alianza Seguros">Alianza Seguros</option>
              <option value="BISA Seguros">BISA Seguros</option>
              <option value="Nacional Vida">Nacional Vida</option>
              <option value="Rímac Seguros">Rímac Seguros</option>
            </select>
          </div>

          <button onClick={handleAddNew} className="add-btn">
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
                  <th>Conductor Asignado</th>
                  <th>Propietario</th>
                  <th>Asientos</th>
                  <th>SOAT / Seguro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehiculos.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="movil-badge">{v.movil}</span>
                    </td>
                    <td>
                      <span className="placa-pill">{v.placa}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', color: 'var(--slate-900)' }}>{v.marca}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{v.modelo}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>{v.tipo}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{v.color}</span>
                      </div>
                    </td>
                    <td>
                      {v.conductor ? (
                        <div className="vehicle-driver-info">
                          <div className="vehicle-driver-avatar">
                            {v.conductor.nombres?.charAt(0)}{v.conductor.apellidos?.charAt(0)}
                          </div>
                          <span>{v.conductor.nombres} {v.conductor.apellidos}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {v.propietario ? (
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>
                          {v.propietario.nombres} {v.propietario.apellidos}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {v.asientos ? (
                        <div className="seats-badge" title={`${v.asientos.filas} filas - ID #${v.asientos.id}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <path d="M4 9h16M9 4v16" />
                          </svg>
                          <span>{v.asientos.cantidad} as. ({v.asientos.filas} fil.)</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{v.nroSoat}</code>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{v.aseguradora}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
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
                ))}
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
              <p>Intente buscando con otros filtros o placa/móvil</p>
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
          <div className="modal-content" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
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
                    placeholder="Ej. M-05"
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
                    placeholder="Ej. 4829-ABC"
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
                    placeholder="Ej. Coaster"
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
                    placeholder="Ej. Blanco / Azul"
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
                    <option value="Minibús">Minibús</option>
                    <option value="Bus Cama">Bus Cama</option>
                    <option value="Van">Van</option>
                    <option value="Omnibús">Omnibús</option>
                  </select>
                </div>
              </div>

              {/* Selección de Objetos Estáticos para Conductor y Propietario */}
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Conductor Asignado</label>
                  <select
                    value={formData.conductorId}
                    onChange={(e) => setFormData({ ...formData, conductorId: e.target.value })}
                    className="input-field"
                  >
                    {STATIC_CONDUCTORES.map(c => (
                      <option key={c.id} value={c.id}>{c.nombres} {c.apellidos} (Lic. {c.licencia})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Propietario</label>
                  <select
                    value={formData.propietarioId}
                    onChange={(e) => setFormData({ ...formData, propietarioId: e.target.value })}
                    className="input-field"
                  >
                    {STATIC_CONDUCTORES.map(c => (
                      <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Plantilla de Asientos (Objeto Estático: id, filas, cantidad) */}
              <div className="input-group">
                <label className="input-label">Distribución de Asientos (Objeto Estático)</label>
                <select
                  value={formData.asientosId}
                  onChange={(e) => setFormData({ ...formData, asientosId: e.target.value })}
                  className="input-field"
                >
                  {STATIC_ASIENTOS.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} - [id: {a.id}, filas: {a.filas}, cantidad: {a.cantidad}]</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">N° de SOAT</label>
                  <input
                    type="text"
                    value={formData.nroSoat}
                    onChange={(e) => setFormData({ ...formData, nroSoat: e.target.value })}
                    className="input-field"
                    placeholder="Ej. SOAT-9840192"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Aseguradora</label>
                  <select
                    value={formData.aseguradora}
                    onChange={(e) => setFormData({ ...formData, aseguradora: e.target.value })}
                    className="input-field"
                  >
                    <option value="Alianza Seguros">Alianza Seguros</option>
                    <option value="BISA Seguros">BISA Seguros</option>
                    <option value="Nacional Vida">Nacional Vida</option>
                    <option value="Rímac Seguros">Rímac Seguros</option>
                  </select>
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
                ¿Está seguro que desea eliminar el vehículo <strong>{vehicleToDelete.movil} ({vehicleToDelete.placa})</strong>?
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
