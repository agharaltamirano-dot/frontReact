import { useState, useEffect } from 'react'
import './conductores.css'

const BASE_URL = 'http://localhost:5093/api/conductores'

const CATEGORIAS_LICENCIA = ['A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc']

export const MOCK_CONDUCTORES = [
  { id: 1, nombres: 'Carlos Alberto', apellidos: 'Mamani Quispe', telefono: '71234567', licencia: '4892019', categoria: 'A-IIIc', estado: true },
  { id: 2, nombres: 'Juan Pablo', apellidos: 'Fernández Flores', telefono: '76543210', licencia: '5829104', categoria: 'A-IIIa', estado: true },
  { id: 3, nombres: 'Roberto', apellidos: 'Vargas Gutierrez', telefono: '68912345', licencia: '3920192', categoria: 'A-IIb', estado: true },
  { id: 4, nombres: 'Marcos Antonio', apellidos: 'Rios Mendoza', telefono: '74839201', licencia: '6748291', categoria: 'A-IIIc', estado: false },
  { id: 5, nombres: 'Luis Enrique', apellidos: 'Salazar Choque', telefono: '79102938', licencia: '8201928', categoria: 'A-IIa', estado: true },
  { id: 6, nombres: 'Hugo', apellidos: 'Alvarez Torrez', telefono: '67491029', licencia: '9102837', categoria: 'A-IIIb', estado: true }
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

function Conductores() {
  const [conductores, setConductores] = useState(MOCK_CONDUCTORES)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [notification, setNotification] = useState(null)
  const [driverToDelete, setDriverToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    licencia: '',
    categoria: CATEGORIAS_LICENCIA[0],
    estado: true
  })

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  const fetchConductores = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setConductores(data)
        }
      }
    } catch (err) {
      console.log('Usando lista local de conductores para pruebas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConductores() }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, statusFilter, itemsPerPage])

  // ── Modales ──────────────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      telefono: '',
      licencia: '',
      categoria: CATEGORIAS_LICENCIA[0],
      estado: true
    })
    setEditingDriver(null)
    setShowAddModal(true)
  }

  const handleEdit = (driver) => {
    setFormData({
      nombres: driver.nombres || '',
      apellidos: driver.apellidos || '',
      telefono: driver.telefono || '',
      licencia: driver.licencia || '',
      categoria: driver.categoria || CATEGORIAS_LICENCIA[0],
      estado: driver.estado !== false
    })
    setEditingDriver(driver)
    setShowAddModal(true)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingDriver) {
        // Intento backend PUT
        try {
          await fetch(`${BASE_URL}/${editingDriver.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ ...formData, id: editingDriver.id })
          })
        } catch {
          console.log('PUT en backend no disponible, actualizando estado local')
        }

        setConductores(prev => prev.map(d => d.id === editingDriver.id ? { ...formData, id: editingDriver.id } : d))
        showNotification('Conductor actualizado exitosamente')
      } else {
        // Intento backend POST
        const newId = Date.now()
        const newDriver = { ...formData, id: newId }
        try {
          const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
          })
          if (res.ok) {
            const data = await res.json()
            newDriver.id = data.id || newId
          }
        } catch {
          console.log('POST en backend no disponible, agregando en estado local')
        }

        setConductores(prev => [newDriver, ...prev])
        showNotification('Nuevo conductor registrado exitosamente')
      }

      setShowAddModal(false)
      setEditingDriver(null)
    } catch (err) {
      showNotification('Error al guardar conductor: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle Estado / Eliminación lógica ────────────────────────────────────────
  const toggleEstado = async (driver) => {
    const nuevoEstado = !driver.estado
    setConductores(prev => prev.map(d => d.id === driver.id ? { ...d, estado: nuevoEstado } : d))

    try {
      await fetch(`${BASE_URL}/estado/${driver.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ estado: nuevoEstado })
      })
    } catch {
      // Ok en modo local
    }
    showNotification(`Estado de ${driver.nombres} actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'success')
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (driver) => setDriverToDelete(driver)

  const confirmDelete = async () => {
    if (!driverToDelete) return
    setConductores(prev => prev.filter(d => d.id !== driverToDelete.id))

    try {
      await fetch(`${BASE_URL}/${driverToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    } catch {
      // Ok en modo local
    }

    showNotification('Conductor eliminado del registro', 'error')
    setDriverToDelete(null)
  }

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filteredConductores = conductores.filter(d => {
    const fullName = `${d.nombres} ${d.apellidos}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      (d.licencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.telefono || '').includes(searchTerm)

    const matchesCategory = categoryFilter === 'todos' || d.categoria === categoryFilter

    const matchesStatus = statusFilter === 'todos' ||
      (statusFilter === 'activos' && d.estado) ||
      (statusFilter === 'inactivos' && !d.estado)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Paginación
  const totalItems = filteredConductores.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConductores = filteredConductores.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="conductores-view">
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
                placeholder="Buscar por nombres, apellidos o licencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filtro Categoría */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todas las Categorías</option>
              {CATEGORIAS_LICENCIA.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filtro Estado */}
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

          <button onClick={handleAddNew} className="add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Conductor
          </button>
        </div>

        {/* Tabla de Conductores */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando conductores...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>Teléfono</th>
                  <th>N° Licencia</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConductores.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {driver.nombres?.charAt(0)}{driver.apellidos?.charAt(0)}
                        </div>
                        <div className="driver-name-container">
                          <span className="driver-full-name">{driver.nombres} {driver.apellidos}</span>
                        </div>
                      </div>
                    </td>
                    <td>{driver.telefono || '—'}</td>
                    <td><code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#000' }}>{driver.licencia}</code></td>
                    <td>
                      <span className={`category-badge ${driver.categoria?.toLowerCase().includes('iii') ? 'a-iii' : driver.categoria?.toLowerCase().includes('ii') ? 'a-ii' : 'a-i'}`}>
                        {driver.categoria}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="action-btn edit-btn"
                          title="Editar Conductor"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(driver)}
                          className="action-btn delete-btn"
                          title="Eliminar Conductor"
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

          {!loading && filteredConductores.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron conductores</h3>
              <p>Intente ajustando el término de búsqueda o los filtros de categoría</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && filteredConductores.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} conductores
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

      {/* Modal Crear / Editar Conductor */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
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
                  <label className="input-label">Nombres</label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Juan Carlos"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="input-field"
                    placeholder="Ej. Perez Quispe"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="input-field"
                    placeholder="Ej. 71234567"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">N° Licencia</label>
                  <input
                    type="text"
                    value={formData.licencia}
                    onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
                    className="input-field"
                    placeholder="Ej. 4892019"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Categoría de Licencia</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIAS_LICENCIA.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Estado Inicial</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
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
                  {saving ? 'Guardando...' : (editingDriver ? 'Actualizar' : 'Crear') + ' Conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {driverToDelete && (
        <div className="modal-overlay" onClick={() => setDriverToDelete(null)}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={() => setDriverToDelete(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ color: 'var(--slate-700)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar al conductor <strong>{driverToDelete.nombres} {driverToDelete.apellidos}</strong>?
              </p>
            </div>
            <div className="modal-actions" style={{ padding: '20px 28px' }}>
              <button className="cancel-btn" onClick={() => setDriverToDelete(null)}>
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

export default Conductores
