import { useState, useEffect, useRef } from 'react'
import './asientos.css'
import { getDistribuciones, createDistribucion, updateDistribucion, deleteDistribucion } from './distribucionService'



function Asientos() {
  const [asientos, setAsientos] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [minibusFilter, setMinibusFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('activo')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [matrixRows, setMatrixRows] = useState(2)
  const MAX_ROWS = 20
  const originalSeatsRef = useRef({})

  // Modales y Notificaciones
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAsiento, setEditingAsiento] = useState(null)
  const [notification, setNotification] = useState(null)
  const [asientoToDelete, setAsientoToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    estado: true,
    asientos: []
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET ('api/asientos') ───────────────────────────────────────────────────
  const fetchAsientos = async () => {
    setLoading(true)
    try {
      const data = await getDistribuciones()
      console.log('Distribuciones obtenidas:', data)
      if (Array.isArray(data) && data.length > 0) {
        setAsientos(data)
      }
    } catch (err) {
      console.log('Error al obtener distribuciones:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAsientos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, minibusFilter, statusFilter, itemsPerPage])

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({
      nombre: '',
      estado: true,
      asientos: []
    })
    originalSeatsRef.current = {}
    setMatrixRows(2)
    setEditingAsiento(null)
    setShowAddModal(true)
  }

  const handleEdit = (asiento) => {
    const seats = Array.isArray(asiento.asientos) ? asiento.asientos : (asiento.asientos || [])
    // build map of original seats to preserve ids when toggling
    const map = {}
    let maxFila = 0
    seats.forEach(s => {
      if (s && s.fila) {
        map[`${s.fila}-${s.columna}`] = s
        if (s.fila > maxFila) maxFila = s.fila
      }
    })
    originalSeatsRef.current = map

    const initialRows = Math.max(2, maxFila, Math.ceil((asiento.cantidad || 0) / 3))

    setFormData({
      nombre: asiento.nombre || '',
      estado: asiento.estado ?? true,
      asientos: seats.map(s => ({ ...s }))
    })
    setMatrixRows(initialRows)
    setEditingAsiento(asiento)
    setShowAddModal(true)
  }

  const handleAddRow = () => {
    setMatrixRows(r => Math.min(MAX_ROWS, r + 1))
  }

  const handleSeatToggle = (fila, columna) => {
    // conductor cell fixed at 1,1
    if (fila === 1 && columna === 1) return

    setFormData(prev => {
      const key = `${fila}-${columna}`
      const existsIndex = prev.asientos.findIndex(s => s.fila === fila && s.columna === columna)
      let newAsientos = [...prev.asientos]

      if (existsIndex !== -1) {
        // remove and renumber
        newAsientos.splice(existsIndex, 1)
        newAsientos = newAsientos.map((s, idx) => ({ ...s, numero: idx + 1 }))
      } else {
        // add new seat, reuse original id if present; if editing an existing distribucion, attach its id
        const original = originalSeatsRef.current[key]
        const distribId = original?.distribucion_id || (editingAsiento ? editingAsiento.id : undefined)
        const newSeat = {
          id: original?.id,
          distribucionId: distribId,
          estado: true,
          fila,
          columna,
          numero: newAsientos.length + 1
        }
        newAsientos.push(newSeat)
      }

      return { ...prev, asientos: newAsientos }
    })
  }

  // (Estado toggle removed; use editar/eliminar según flujo)

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const assignedSeats = formData.asientos || []
    if ((assignedSeats.length || 0) < 4) {
      showNotification('Debe asignar al menos 4 asientos antes de guardar', 'error')
      setSaving(false)
      return
    }
    const payload = {
      nombre: formData.nombre,
      estado: Boolean(formData.estado),
      asientos: assignedSeats
    }
    try {
      if (editingAsiento) {
        try {
          const body =  { ...payload, id: editingAsiento.id }
          const data = await updateDistribucion(editingAsiento.id, body)
          // setAsientos(prev => prev.map(a => a.id === editingAsiento.id ? data : a))
          showNotification('Distribución de asientos actualizada exitosamente')
        } catch (err) {
          console.log('UPDATE distribucion error:', err)
          const msg = err.message || 'Error al actualizar distribución'
          showNotification(msg, 'error')
        }
      } else {
        try {
          const body = payload
          const data = await createDistribucion(body)
          // setAsientos(prev => [data, ...prev])
          showNotification('Nueva distribución de asientos creada exitosamente')
        } catch (err) {
          const msg = err.message || 'Error al crear distribución'
          showNotification(msg, 'error')
        }
      }
      setShowAddModal(false)
      setEditingAsiento(null)
      fetchAsientos()
    } catch (err) {
      showNotification('Error al guardar distribución: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleDelete = (asiento) => setAsientoToDelete(asiento)

  const confirmDelete = async () => {
    if (!asientoToDelete) return
    // setAsientos(prev => prev.filter(a => a.id !== asientoToDelete.id))
fetchAsientos()
    try {
      await deleteDistribucion(asientoToDelete.id)
      showNotification(`Distribución de asientos ${asientoToDelete.nombre} ${asientoToDelete.estado ? 'desactivada' : 'activada'}`, asientoToDelete.estado ? 'error' : 'success')
    } catch (err) {
      const msg = err.message || 'Error al eliminar distribución'
      console.log('DELETE distribucion error:', msg)
      showNotification(msg, 'error')
    }
    fetchAsientos()
    setAsientoToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredAsientos = asientos.filter(a => {
    const textTarget = `${a.nombre} ${a.filas} ${a.cantidad}`.toLowerCase()
    const matchesSearch = textTarget.includes(searchTerm.toLowerCase())
    const matchesMinibus = minibusFilter === 'todos' ||
      (minibusFilter === 'minibus' && a.esminibus) ||
      (minibusFilter === 'bus' && !a.esminibus)

    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activo' && a.estado) ||
      (statusFilter === 'inactivo' && !a.estado)

    return matchesSearch && matchesMinibus && matchesStatus
  })

  // Paginación
  const totalItems = filteredAsientos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAsientos = filteredAsientos.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="asientos-view">
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
                placeholder="Buscar por nombre, filas o cantidad de asientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* <select
              value={minibusFilter}
              onChange={(e) => setMinibusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Tipos de Vehículo</option>
              <option value="minibus">Solo Minibús / Van</option>
              <option value="bus">Solo Bus Estándar / Cama</option>
            </select> */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="activo">Solo Activos</option>
              <option value="inactivo">Solo Inactivos</option>
            </select>
          </div>

          <button className="add-btn" onClick={handleAddNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nueva Distribución
          </button>
        </div>

        {/* Tabla */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando distribuciones de asientos...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Nombre de Distribución</th>
                  <th>Cant. asientos</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAsientos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong style={{ color: 'var(--slate-900)', fontSize: '14px' }}>{a.nombre}</strong>
                    </td>
                    <td>
                      <span className="seat-badge">
                        {(Array.isArray(a.asientos) ? a.asientos.length : (a.cantidad || 0))} Asientos
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${a.estado ? 'active' : 'inactive'}`}>
                        {a.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleDelete(a)}
                          className="action-btn edit-btn"
                          title={a.estado ? 'Desactivar Distribución' : 'Activar Distribución'}
                          style={{ color: a.estado ? '#10b981' : '#94a3b8' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(a)}
                          className="action-btn edit-btn"
                          title="Editar Distribución"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* <button
                          onClick={() => handleDelete(a)}
                          className="action-btn delete-btn"
                          title="Eliminar Distribución"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredAsientos.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron distribuciones de asientos</h3>
              <p>Intente ajustando el término de búsqueda o los filtros</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredAsientos.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} distribuciones
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

      {/* Modal Crear / Editar */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '95%', maxWidth: 760 }}>
            <div className="modal-header">
              <h2>{editingAsiento ? 'Editar Distribución de Asientos' : 'Nueva Distribución de Asientos'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="input-group">
                <label className="input-label">Nombre de la Distribución</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Ej. Bus estándar, Minibús 24, Van 16"
                  required
                />
              </div>

              {/* Sólo pedimos Nombre y Estado; filas/asientos se configuran con la matriz */}

              {/* Matriz de Asientos (3 columnas por fila) */}
              <div style={{ marginTop: 18 }}>
                <label className="input-label">Configurar Asientos</label>
                <div className="seat-matrix" style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {Array.from({ length: matrixRows }, (_, rIndex) => {
                    const fila = rIndex + 1
                    return Array.from({ length: 3 }, (_, cIndex) => {
                      const columna = cIndex + 1
                      const seat = formData.asientos.find(s => s.fila === fila && s.columna === columna)
                      const isConductor = fila === 1 && columna === 1
                      return (
                        <button
                          key={`${fila}-${columna}`}
                          type="button"
                          onClick={() => handleSeatToggle(fila, columna)}
                          className={`seat-cell ${seat ? 'assigned' : ''} ${isConductor ? 'conductor' : ''}`}
                          style={{
                            padding: '14px 12px',
                            width: '100%',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: isConductor ? '#fef3c7' : (seat ? '#0ea5a4' : '#ffffff'),
                            color: isConductor ? '#92400e' : (seat ? '#fff' : '#0f172a'),
                            cursor: isConductor ? 'default' : 'pointer',
                            minHeight: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: seat ? '0 6px 18px rgba(6,165,164,0.12)' : 'none'
                          }}
                          title={isConductor ? 'Conductor' : (seat ? `Asiento #${seat.numero}` : 'Vacío')}
                        >
                          <span style={{ fontWeight: isConductor ? 700 : 600 }}>{isConductor ? 'Conductor' : (seat ? seat.numero : '')}</span>
                        </button>
                      )
                    })
                  })}
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={matrixRows >= MAX_ROWS}
                    style={{
                      background: '#0ea5a4',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 6px 18px rgba(14,165,164,0.12)',
                      cursor: matrixRows >= MAX_ROWS ? 'not-allowed' : 'pointer'
                    }}
                  >
                    + Agregar otra fila
                  </button>
                  <small style={{ color: '#64748b' }}>Filas actuales: {matrixRows} (máx {MAX_ROWS})</small>
                </div>
              </div>

              <div className="input-group" style={{ marginTop: 12 }}>
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
                  {saving ? 'Guardando...' : (editingAsiento ? 'Actualizar' : 'Crear') + ' Distribución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {asientoToDelete && (
        <div className="modal-overlay" onClick={() => setAsientoToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar {asientoToDelete.estado ? 'Desactivación' : 'Activación'}</h2>
              <button className="modal-close" onClick={() => setAsientoToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea {asientoToDelete.estado ? 'desactivar' : 'activar'} la distribución de asientos <strong>{asientoToDelete.nombre} ({asientoToDelete.cantidad} asientos)</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setAsientoToDelete(null)}>
                Cancelar
              </button>
              <button
                className="save-btn"
                style={{ background: asientoToDelete.estado ? '#ef4444' : '#10b981', borderColor: asientoToDelete.estado ? '#ef4444' : '#10b981', boxShadow: asientoToDelete.estado ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                onClick={confirmDelete}
              >
                {asientoToDelete.estado ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Asientos
