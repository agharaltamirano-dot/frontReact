import { useState, useEffect } from 'react'
import './asientos.css'

const BASE_URL_ASIENTOS = 'http://localhost:5093/api/asientos'

export const MOCK_ASIENTOS = [
  { id: 1, nombre: 'Van compacta', filas: 4, cantidad: 16, esminibus: true, estado: true },
  { id: 2, nombre: 'Minibús clásico', filas: 6, cantidad: 24, esminibus: true, estado: true },
  { id: 3, nombre: 'Bus Cama Ejecutivo', filas: 8, cantidad: 32, esminibus: false, estado: true },
  { id: 4, nombre: 'Bus estándar', filas: 10, cantidad: 40, esminibus: false, estado: true }
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

function Asientos() {
  const [asientos, setAsientos] = useState(MOCK_ASIENTOS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [minibusFilter, setMinibusFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Modales y Notificaciones
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAsiento, setEditingAsiento] = useState(null)
  const [notification, setNotification] = useState(null)
  const [asientoToDelete, setAsientoToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    filas: 6,
    cantidad: 24,
    esminibus: false,
    estado: true
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET ('api/asientos') ───────────────────────────────────────────────────
  const fetchAsientos = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL_ASIENTOS, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setAsientos(data)
        }
      }
    } catch (err) {
      console.log('Usando datos locales de asientos para pruebas:', err.message)
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
      filas: 6,
      cantidad: 24,
      esminibus: false,
      estado: true
    })
    setEditingAsiento(null)
    setShowAddModal(true)
  }

  const handleEdit = (asiento) => {
    setFormData({
      nombre: asiento.nombre || '',
      filas: asiento.filas ?? 6,
      cantidad: asiento.cantidad ?? 24,
      esminibus: asiento.esminibus ?? false,
      estado: asiento.estado ?? true
    })
    setEditingAsiento(asiento)
    setShowAddModal(true)
  }

  // ── Toggle Estado Rápido ──────────────────────────────────────────────────────
  const toggleEstado = async (asiento) => {
    const nuevoEstado = !asiento.estado
    setAsientos(prev => prev.map(a => a.id === asiento.id ? { ...a, estado: nuevoEstado } : a))

    try {
      await fetch(`${BASE_URL_ASIENTOS}/${asiento.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...asiento, estado: nuevoEstado })
      })
    } catch (err) {
      console.log('PUT backend asientos no disponible:', err.message)
    }

    showNotification(`Estado de "${asiento.nombre}" actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      nombre: formData.nombre,
      filas: Number(formData.filas),
      cantidad: Number(formData.cantidad),
      esminibus: Boolean(formData.esminibus),
      estado: Boolean(formData.estado)
    }

    try {
      if (editingAsiento) {
        try {
          await fetch(`${BASE_URL_ASIENTOS}/${editingAsiento.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...payload, id: editingAsiento.id })
          })
        } catch (err) {
          console.log('PUT backend asientos no disponible:', err.message)
        }

        setAsientos(prev => prev.map(a => a.id === editingAsiento.id ? { ...payload, id: editingAsiento.id } : a))
        showNotification('Distribución de asientos actualizada exitosamente')
      } else {
        const newId = Date.now()
        const newAsiento = { ...payload, id: newId }
        try {
          const res = await fetch(BASE_URL_ASIENTOS, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const data = await res.json()
            newAsiento.id = data.id || newId
          }
        } catch (err) {
          console.log('POST backend asientos no disponible:', err.message)
        }

        setAsientos(prev => [newAsiento, ...prev])
        showNotification('Nueva distribución de asientos creada exitosamente')
      }

      setShowAddModal(false)
      setEditingAsiento(null)
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
    setAsientos(prev => prev.filter(a => a.id !== asientoToDelete.id))

    try {
      await fetch(`${BASE_URL_ASIENTOS}/${asientoToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch (err) {
      console.log('DELETE backend asientos no disponible:', err.message)
    }

    showNotification('Distribución de asientos eliminada', 'error')
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

            <select
              value={minibusFilter}
              onChange={(e) => setMinibusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los Tipos de Vehículo</option>
              <option value="minibus">Solo Minibús / Van</option>
              <option value="bus">Solo Bus Estándar / Cama</option>
            </select>

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
                  <th>N° de Filas</th>
                  <th>Cantidad de Asientos</th>
                  <th>¿Es Minibús?</th>
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
                      <span style={{ fontWeight: '600', color: '#475569' }}>{a.filas} Filas</span>
                    </td>
                    <td>
                      <span className="seat-badge">
                        {a.cantidad} Asientos
                      </span>
                    </td>
                    <td>
                      <span className={`minibus-badge ${a.esminibus ? 'yes' : 'no'}`}>
                        {a.esminibus ? 'Sí (Minibús)' : 'No (Bus / Otro)'}
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
                          onClick={() => toggleEstado(a)}
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
                        <button
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
                        </button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Número de Filas</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.filas}
                    onChange={(e) => setFormData({ ...formData, filas: e.target.value })}
                    className="input-field"
                    placeholder="Ej. 10"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Cantidad de Asientos</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="input-field"
                    placeholder="Ej. 40"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">¿Es Minibús / Van?</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.esminibus}
                        onChange={(e) => setFormData({ ...formData, esminibus: e.target.checked })}
                      />
                      <span className="switch-slider"></span>
                    </label>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: formData.esminibus ? '#b45309' : '#64748b' }}>
                      {formData.esminibus ? 'Sí (Minibús)' : 'No (Bus Estándar)'}
                    </span>
                  </div>
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
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setAsientoToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar la distribución de asientos <strong>{asientoToDelete.nombre} ({asientoToDelete.cantidad} asientos)</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setAsientoToDelete(null)}>
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

export default Asientos
